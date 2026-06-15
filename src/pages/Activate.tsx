import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuiz, clearFunnelStorage } from "@/context/QuizContext";
import { isLovablePreview, DEMO_EMAIL } from "@/lib/preview-mode";
import { useI18n } from "@/i18n/I18nProvider";
import { MARKET } from "@/markets";

const Activate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { updateData } = useQuiz();
  const { m } = useI18n();
  const a = m.activate;

  const hasStripeSession = !!searchParams.get("session_id");
  const intentParam = searchParams.get("intent");
  type Mode = "signup" | "signin" | "forgot" | "reset";
  const initialMode: Mode =
    intentParam === "signin"
      ? "signin"
      : intentParam === "signup"
        ? "signup"
        : intentParam === "forgot"
          ? "forgot"
          : hasStripeSession
            ? "signup"
            : "signin";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [fetchingEmail, setFetchingEmail] = useState(true);
  const [stripeSessionId, setStripeSessionId] = useState("");
  const [quizSessionId, setQuizSessionId] = useState("");
  const [purchaseType, setPurchaseType] = useState<"base" | "premium" | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const redirectStarted = useRef(false);
  const stripeSessionIdRef = useRef("");
  const quizSessionIdRef = useRef("");
  const purchaseTypeRef = useRef<"base" | "premium" | null>(null);
  const phoneRef = useRef("");

  // Keep refs in sync so the auth listener (registered once) reads fresh values
  useEffect(() => { stripeSessionIdRef.current = stripeSessionId; }, [stripeSessionId]);
  useEffect(() => { quizSessionIdRef.current = quizSessionId; }, [quizSessionId]);
  useEffect(() => { purchaseTypeRef.current = purchaseType; }, [purchaseType]);
  useEffect(() => { phoneRef.current = phone; }, [phone]);

  useEffect(() => {
    if (isLovablePreview()) {
      setEmail((prev) => prev || DEMO_EMAIL);
      setFetchingEmail(false);
      return;
    }
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setFetchingEmail(false);
      return;
    }
    setStripeSessionId(sessionId);
    stripeSessionIdRef.current = sessionId;

    supabase.functions
      .invoke("get-checkout-email", { body: { sessionId } })
      .then(({ data, error }) => {
        if (!error && data?.email) {
          setEmail(data.email);
        }
        if (data?.quizSessionId) {
          setQuizSessionId(data.quizSessionId);
        }
        if (data?.purchaseType) {
          const pt = data.purchaseType as "base" | "premium";
          setPurchaseType(pt);
          updateData({ purchaseType: pt });
        }
        setFetchingEmail(false);
      });
  }, [searchParams]);

  const syncCheckoutSession = async (sessionId?: string) => {
    const { data: syncData, error } = await supabase.functions.invoke("sync-checkout-session", {
      body: sessionId ? { sessionId } : {},
    });

    if (error || !syncData?.quizSessionId) return null;

    const pt = syncData.purchaseType as "base" | "premium" | undefined;
    if (pt) {
      setPurchaseType(pt);
      updateData({ purchaseType: pt, sessionId: syncData.quizSessionId });
    } else {
      updateData({ sessionId: syncData.quizSessionId });
    }

    return syncData as {
      quizSessionId: string;
      stripeSessionId: string;
      purchaseType?: "base" | "premium";
      reportReady?: boolean;
    };
  };

  const saveProfileAndRedirect = async (userId: string) => {
    if (redirectStarted.current) return;
    redirectStarted.current = true;
    setRedirecting(true);

    try {
      const stripeSessionIdLocal = stripeSessionIdRef.current;
      const quizSessionIdLocal = quizSessionIdRef.current;
      const purchaseTypeLocal = purchaseTypeRef.current;

      const syncedCheckout = await syncCheckoutSession(stripeSessionIdLocal || undefined);
      if (syncedCheckout?.quizSessionId) {
        clearFunnelStorage();
        navigate(syncedCheckout.reportReady ? "/report" : "/report-processing", { replace: true });
        return;
      }

      let resolvedQuizSessionId = quizSessionIdLocal;

      // If quizSessionId is empty, try to recover it from Stripe metadata directly
      if (!resolvedQuizSessionId && stripeSessionIdLocal) {
        try {
          const { data: checkoutData } = await supabase.functions.invoke("get-checkout-email", {
            body: { sessionId: stripeSessionIdLocal },
          });
          if (checkoutData?.quizSessionId) {
            resolvedQuizSessionId = checkoutData.quizSessionId;
          }
        } catch (e) {
          console.error("Failed to recover quizSessionId from Stripe:", e);
        }
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, quiz_session_id")
        .eq("user_id", userId)
        .single();

      if (existingProfile?.id) {
        const { data: existingReports } = await (supabase as any)
          .from("user_reports")
          .select("quiz_session_id, is_active, quiz_sessions(full_report, user_name)")
          .eq("profile_id", existingProfile.id)
          .order("is_active", { ascending: false })
          .limit(1);

        const existingSession = existingReports?.[0]?.quiz_sessions;
        if (!stripeSessionIdLocal && existingSession?.full_report) {
          updateData({
            sessionId: existingReports[0].quiz_session_id,
            fullReport: existingSession.full_report as Record<string, string>,
            userName: existingSession.user_name || "",
          });
          clearFunnelStorage();
          navigate("/report", { replace: true });
          return;
        }
      }

      if (!resolvedQuizSessionId && existingProfile?.quiz_session_id) {
        const { data: existingSession } = await supabase
          .from("quiz_sessions")
          .select("id, full_report, user_name")
          .eq("id", existingProfile.quiz_session_id)
          .single();

        if (existingSession?.full_report) {
          updateData({
            sessionId: existingSession.id,
            fullReport: existingSession.full_report as Record<string, string>,
            userName: existingSession.user_name || "",
          });
          clearFunnelStorage();
          navigate("/report", { replace: true });
          return;
        }
      }

      if (!stripeSessionIdLocal || !resolvedQuizSessionId) {
        const recoveredCheckout = await syncCheckoutSession();
        if (recoveredCheckout?.quizSessionId) {
          clearFunnelStorage();
          navigate(recoveredCheckout.reportReady ? "/report" : "/report-processing", { replace: true });
          return;
        }

        clearFunnelStorage();
        // Caso "lead OAuth senza acquisto": l'utente è entrato in /activate
        // (via header o link diretto) e ha completato il login social, ma non
        // ha nessun checkout/quiz collegato. La sessione resta valida (e
        // l'email è già stata sincronizzata su Brevo via trigger sul profile),
        // così ha senso indirizzarlo verso il funnel anziché lasciarlo a vuoto.
        const hasExistingReport = !!existingProfile?.quiz_session_id;
        if (!hasExistingReport) {
          toast(a.toasts.welcomeBack);
        }
        navigate(hasExistingReport ? "/report" : "/", { replace: true });
        return;
      }

      const updatePayload: { stripe_session_id?: string; quiz_session_id?: string; phone?: string } = {};
      if (stripeSessionIdLocal) updatePayload.stripe_session_id = stripeSessionIdLocal;
      if (resolvedQuizSessionId) updatePayload.quiz_session_id = resolvedQuizSessionId;
      const phoneLocal = phoneRef.current.trim();
      if (phoneLocal) updatePayload.phone = phoneLocal;

      if (updatePayload.stripe_session_id || updatePayload.quiz_session_id || updatePayload.phone) {
        await supabase.from("profiles").update(updatePayload).eq("user_id", userId);
      }

      if (existingProfile?.id && resolvedQuizSessionId) {
        const { data: linkedSession } = await supabase
          .from("quiz_sessions")
          .select("user_name, birth_place")
          .eq("id", resolvedQuizSessionId)
          .single();

        await (supabase as any).from("user_reports").upsert(
          {
            profile_id: existingProfile.id,
            quiz_session_id: resolvedQuizSessionId,
            stripe_session_id: stripeSessionIdLocal || null,
            purchase_type: purchaseTypeLocal,
            label: [linkedSession?.user_name, linkedSession?.birth_place].filter(Boolean).join(" · ") || a.personalReadingLabel,
            is_active: true,
          },
          { onConflict: "profile_id,quiz_session_id" },
        );
      }

      clearFunnelStorage();
      navigate("/report-processing", { replace: true });
    } catch (err) {
      console.error("saveProfileAndRedirect error:", err);
      redirectStarted.current = false;
      setRedirecting(false);
      setAuthChecking(false);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup" || mode === "reset") {
      if (password.length < 6) {
        toast({ title: a.toasts.passwordTooShort, variant: "destructive" });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: a.toasts.passwordMismatch, variant: "destructive" });
        return;
      }
    }

    setLoading(true);

    if (mode === "forgot") {
      // Routed through request-account-recovery so paid customers without an
      // auth user (orphan checkouts) get an invite immediately, instead of
      // waiting for the 24h cron.
      await supabase.functions.invoke("request-account-recovery", { body: { email, market: MARKET.id } });
      setLoading(false);
      toast(a.toasts.checkEmailRecovery);
      setMode("signin");
      setPassword("");
      return;
    }

    if (mode === "reset") {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      toast(a.toasts.passwordUpdated);
      if (data.user) {
        await saveProfileAndRedirect(data.user.id);
      } else {
        setLoading(false);
        setMode("signin");
      }
      return;
    }

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (data.session && data.user) {
        await saveProfileAndRedirect(data.user.id);
      }
      return;
    }

    // Signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          stripe_session_id: stripeSessionId,
        },
      },
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      await saveProfileAndRedirect(data.user.id);
    } else {
      toast(a.toasts.checkEmailConfirm);
      setLoading(false);
    }
  };

  const handleSSOLogin = async (provider: "google") => {
    setSsoLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + "/activate" + window.location.search,
        },
      });

      if (error) {
        toast({ title: a.toasts.authError, description: error.message, variant: "destructive" });
        setSsoLoading(null);
        return;
      }

      // Browser will redirect to provider; on return the auth listener
      // picks up SIGNED_IN and calls saveProfileAndRedirect.
    } catch (err) {
      console.error("SSO login error:", err);
      toast({ title: a.toasts.authError, variant: "destructive" });
      setSsoLoading(null);
    }
  };

  // Synchronous auth setup: register listener BEFORE checking session, so the
  // SIGNED_IN event from the OAuth callback (which hydrates session on mount)
  // is never missed. Also handles "already signed in → redirect immediately".
  useEffect(() => {
    if (isLovablePreview()) {
      setAuthChecking(false);
      return;
    }
    let mounted = true;
    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
    const isRecoveryCallback = hashParams.get("type") === "recovery";
    const hasOAuthCallback =
      currentUrl.searchParams.has("code") ||
      currentUrl.searchParams.has("state") ||
      currentUrl.searchParams.has("provider_token") ||
      hashParams.has("access_token") ||
      hashParams.has("refresh_token");
    const authError =
      currentUrl.searchParams.get("error_description") ||
      currentUrl.searchParams.get("error") ||
      hashParams.get("error_description") ||
      hashParams.get("error");

    const enterResetMode = () => {
      setMode("reset");
      setPassword("");
      setConfirmPassword("");
      setAuthChecking(false);
    };

    const finishRedirect = (userId: string) => {
      void saveProfileAndRedirect(userId).catch(() => {
        if (mounted) setAuthChecking(false);
      });
    };

    const waitForOAuthSession = async () => {
      for (let attempt = 0; mounted && attempt < 20; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          if (isRecoveryCallback) {
            enterResetMode();
          } else {
            finishRedirect(data.session.user.id);
          }
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      if (mounted && !redirectStarted.current) setAuthChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        enterResetMode();
        return;
      }
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        if (isRecoveryCallback) {
          enterResetMode();
          return;
        }
        // Defer to next tick so any pending state updates (stripeSessionId, etc.) settle
        setTimeout(() => {
          if (mounted) {
            finishRedirect(session.user.id);
          }
        }, 0);
      }
    });

    if (authError) {
      toast({ title: a.toasts.authError, description: authError, variant: "destructive" });
      setAuthChecking(false);
      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    // Initial session check — if user already authenticated on mount, redirect
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        if (isRecoveryCallback) {
          enterResetMode();
        } else {
          finishRedirect(data.session.user.id);
        }
      } else if (hasOAuthCallback) {
        void waitForOAuthSession();
      } else {
        setAuthChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authChecking || redirecting || ssoLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {a.titles[mode]}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {a.subtitles[mode]}
          </p>
        </div>

        {/* SSO Buttons */}
        {(mode === "signup" || mode === "signin") && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-muted bg-card text-foreground font-medium gap-3"
            onClick={() => handleSSOLogin("google")}
            disabled={!!ssoLoading}
          >
            {ssoLoading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {a.google}
          </Button>
        </div>
        )}

        {/* Divider */}
        {(mode === "signup" || mode === "signin") && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{a.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode !== "reset" && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 text-sm">
                {a.fields.email}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={fetchingEmail}
                placeholder={fetchingEmail ? a.fields.emailLoading : a.fields.emailPlaceholder}
                className="h-12 rounded-xl border-muted bg-card"
              />
            </div>
          )}

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80 text-sm">
                  {mode === "reset" ? a.fields.newPassword : a.fields.password}
                </Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    {a.forgotLink}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={a.fields.passwordPlaceholder}
                  className="h-12 rounded-xl border-muted bg-card pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {(mode === "signup" || mode === "reset") && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-foreground/80 text-sm">
                {a.fields.confirmPassword}
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder={a.fields.confirmPasswordPlaceholder}
                className="h-12 rounded-xl border-muted bg-card"
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground/80 text-sm">
                {a.fields.phone}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={a.fields.phonePlaceholder}
                className="h-12 rounded-xl border-muted bg-card"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="premium"
            size="hero"
            disabled={loading || (fetchingEmail && mode !== "reset")}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {a.cta.loading[mode]}
              </>
            ) : (
              a.cta[mode]
            )}
          </Button>
        </form>

        {(mode === "signup" || mode === "signin") && (
          <div className="rounded-xl border border-muted bg-card/50 px-4 py-3 text-center space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {a.recoveryBox.question}
            </p>
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-xs text-primary font-medium hover:underline"
            >
              {a.recoveryBox.action}
            </button>
          </div>
        )}

        {/* Toggle mode */}
        {mode !== "reset" && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                {a.toggle.haveAccount}{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-primary font-medium hover:underline"
                >
                  {a.toggle.signIn}
                </button>
              </>
            ) : mode === "forgot" ? (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary font-medium hover:underline"
              >
                {a.toggle.backToLogin}
              </button>
            ) : (
              <>
                {a.toggle.noAccount}{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  {a.toggle.signUp}
                </button>
              </>
            )}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground/70">
          {a.privacyNote}
        </p>
      </motion.div>
    </div>
  );
};

export default Activate;
