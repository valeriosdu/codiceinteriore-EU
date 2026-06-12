import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useMetaConversions } from "@/hooks/useMetaConversions";
import { useQuiz } from "@/context/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { isLovablePreview } from "@/lib/preview-mode";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/i18n/I18nProvider";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { trackPurchase } = useMetaConversions();
  const { data } = useQuiz();
  const { m } = useI18n();
  const s = m.success;
  const [verifying, setVerifying] = useState(true);
  const [sessionId, setSessionId] = useState<string>(
    () => new URLSearchParams(window.location.search).get("session_id") || "",
  );
  const [paypalCapturing, setPaypalCapturing] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  // ---- PayPal capture: PayPal redirects with ?token=<orderId>&PayerID=...
  useEffect(() => {
    if (isLovablePreview()) {
      setVerifying(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const paypalToken =
      params.get("token") || params.get("paypal_order") || "";
    if (!paypalToken || sessionId) return;

    let cancelled = false;
    setPaypalCapturing(true);

    (async () => {
      try {
        const { data: capture, error } = await supabase.functions.invoke("capture-paypal-order", {
          body: { orderId: paypalToken },
        });

        if (cancelled) return;

        if (error || !capture?.sessionId) {
          throw new Error(error?.message || "Capture failed");
        }

        // Replace URL with our standard ?session_id=pp_<id> form so the rest
        // of the flow (including auth redirect back to /activate) works.
        const newUrl = `${window.location.pathname}?session_id=${encodeURIComponent(capture.sessionId)}`;
        window.history.replaceState({}, "", newUrl);
        setSessionId(capture.sessionId);
      } catch (e) {
        console.error("PayPal capture error:", e);
        if (cancelled) return;

        // Webhook safety net: la capture lato browser può fallire (timeout,
        // cold start, doppio click) ma il webhook PAYMENT.CAPTURE.COMPLETED
        // salva comunque la riga. Pollare get-checkout-email per ~20s prima
        // di dare per perso il pagamento.
        const opaqueId = `pp_${paypalToken}`;
        let recovered = false;
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          const { data: poll, error: pollErr } = await supabase.functions.invoke(
            "get-checkout-email",
            { body: { sessionId: opaqueId } },
          );
          if (cancelled) return;
          if (!pollErr && poll) {
            recovered = true;
            break;
          }
        }

        // Always set the session_id so /activate can pass it to
        // sync-checkout-session, which will search for a paid sibling
        // checkout with the same quiz_session_id.
        const newUrl = `${window.location.pathname}?session_id=${encodeURIComponent(opaqueId)}`;
        window.history.replaceState({}, "", newUrl);
        setSessionId(opaqueId);

        if (recovered) {
          console.info("[paypal] capture recovered via polling", {
            paypal_order_id: paypalToken,
          });
        } else {
          setPaypalError(s.paypalError);
        }
      } finally {
        if (!cancelled) setPaypalCapturing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    // Only fire Purchase once we have a confirmed checkout sessionId (Stripe from
    // URL, or PayPal after capture). Never fire a fallback Purchase without it —
    // that was the source of duplicates in the PayPal flow. Server-side dedup via
    // deterministic event_id also protects against page refreshes.
    if (!sessionId) return;
    if (purchaseTrackedRef.current) return;

    let cancelled = false;
    const fallbackPurchaseType = data.purchaseType || undefined;
    const fallbackValue = fallbackPurchaseType === "premium" ? 29 : 19;

    const trackVerifiedPurchase = async () => {
      const { data: checkoutData } = await supabase.functions.invoke("get-checkout-email", {
        body: { sessionId },
      });
      if (cancelled) return;

      const purchaseType = checkoutData?.purchaseType || fallbackPurchaseType;
      const amountTotal = Number(checkoutData?.amountTotal);
      const value = Number.isFinite(amountTotal) && amountTotal > 0 ? amountTotal : purchaseType === "premium" ? 29 : fallbackValue;
      const quizSessionId = checkoutData?.quizSessionId || data.sessionId || undefined;

      // Mark before firing so a re-render in the same mount can't double-call.
      purchaseTrackedRef.current = true;

      trackPurchase({
        value,
        currency: checkoutData?.currency || "EUR",
        purchaseType,
        email: checkoutData?.email || undefined,
        firstName: data.userName || undefined,
        sessionId: quizSessionId,
        birthDate: data.birthDate,
      });

      trackEvent(
        "purchase_completed",
        {
          purchase_type: purchaseType,
          amount: value,
          currency: checkoutData?.currency || "EUR",
          provider: sessionId.startsWith("pp_") ? "paypal" : "stripe",
          checkout_session_id: sessionId,
          quiz_session_id: quizSessionId || null,
        },
        { once: true },
      );
    };

    trackVerifiedPurchase();
    return () => {
      cancelled = true;
    };
  }, [data.purchaseType, data.sessionId, sessionId, trackPurchase]);

  useEffect(() => {
    let cancelled = false;

    const syncIfLoggedIn = async () => {
      if (!sessionId) {
        setVerifying(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (!cancelled) setVerifying(false);
        return;
      }

      const { data: syncData, error } = await supabase.functions.invoke("sync-checkout-session", {
        body: { sessionId },
      });

      if (!cancelled) {
        if (!error && syncData?.quizSessionId) {
          navigate(syncData.reportReady ? "/report" : "/report-processing", { replace: true });
          return;
        }
        setVerifying(false);
      }
    };

    syncIfLoggedIn();
    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full text-center space-y-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Check className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {paypalError ? s.titleProblem : s.titleOk}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {paypalError
              ? paypalError
              : paypalCapturing
                ? s.bodyPaypalCapturing
                : verifying
                  ? s.bodyVerifying
                  : s.bodyDefault}
          </p>
        </div>

        <Button
          variant="premium"
          size="hero"
          disabled={verifying || paypalCapturing}
          onClick={() => {
            navigate(sessionId ? `/activate?session_id=${sessionId}` : "/activate");
          }}
        >
          {(verifying || paypalCapturing) ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {paypalCapturing ? s.ctaCapturing : verifying ? s.ctaVerifying : s.ctaContinue}
        </Button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
