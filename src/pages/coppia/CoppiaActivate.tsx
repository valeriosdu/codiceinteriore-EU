import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { clearSynastryStorage } from '@/context/SynastryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Mode = 'signup' | 'signin' | 'forgot';

export default function CoppiaActivate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [fetchingEmail, setFetchingEmail] = useState(true);
  const redirected = useRef(false);

  const reportProcessingUrl = `/coppia/report-processing?session_id=${encodeURIComponent(sessionId)}`;

  const doRedirect = async () => {
    if (redirected.current) return;
    redirected.current = true;

    clearSynastryStorage();

    if (sessionId) {
      try {
        const { data: syncData } = await supabase.functions.invoke('sync-checkout-session', {
          body: { sessionId },
        });
        if (syncData?.isSynastry && syncData?.reportReady) {
          navigate('/coppia/report', { replace: true });
          return;
        }
      } catch (e) {
        console.warn('[CoppiaActivate] sync-checkout-session failed:', e);
      }
    }

    navigate(reportProcessingUrl, { replace: true });
  };

  useEffect(() => {
    document.title = 'Sinastria – Attiva il tuo account | Codice Interiore';

    const fetchEmail = async () => {
      if (!sessionId) { setFetchingEmail(false); return; }
      try {
        const { data } = await supabase.functions.invoke<{ email?: string }>(
          'get-checkout-email',
          { body: { sessionId } },
        );
        if (data?.email) setEmail(data.email);
      } catch (e) {
        console.warn('[CoppiaActivate] get-checkout-email failed:', e);
      } finally {
        setFetchingEmail(false);
      }
    };
    void fetchEmail();
  }, [sessionId]);

  useEffect(() => {
    let mounted = true;

    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
    const hasOAuthCallback =
      currentUrl.searchParams.has('code') ||
      currentUrl.searchParams.has('state') ||
      currentUrl.searchParams.has('provider_token') ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token');
    const authError =
      currentUrl.searchParams.get('error_description') ||
      currentUrl.searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error');

    const waitForOAuthSession = async () => {
      for (let attempt = 0; mounted && attempt < 20; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) { doRedirect(); return; }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (mounted && !redirected.current) setAuthChecked(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session) {
        setTimeout(() => { if (mounted) doRedirect(); }, 0);
      }
    });

    if (authError) {
      toast({ title: 'Errore di autenticazione', description: authError, variant: 'destructive' });
      setAuthChecked(true);
      return () => { mounted = false; subscription.unsubscribe(); };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        doRedirect();
      } else if (hasOAuthCallback) {
        void waitForOAuthSession();
      } else {
        setAuthChecked(true);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSSOLogin = async (provider: 'google' | 'apple') => {
    setSsoLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + '/coppia/activate' + window.location.search,
      });
      if (result.error) {
        toast({ title: 'Errore di autenticazione', description: String(result.error), variant: 'destructive' });
        setSsoLoading(null);
        return;
      }
      if (result.redirected) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) doRedirect(); else setSsoLoading(null);
    } catch (err) {
      console.error('SSO login error:', err);
      toast({ title: 'Errore di autenticazione', variant: 'destructive' });
      setSsoLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/coppia/activate?session_id=${encodeURIComponent(sessionId)}`,
      });
      setLoading(false);
      if (error) {
        toast({ title: error.message, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Controlla la tua email',
        description: 'Se l\'indirizzo è registrato, riceverai un link per reimpostare la password.',
      });
      setMode('signin');
      setPassword('');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        toast({ title: 'La password deve avere almeno 6 caratteri', variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: 'Le password non coincidono', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${reportProcessingUrl}`,
        },
      });
      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes('already')) {
          toast({ title: 'Esiste già un account con questa email. Accedi.', variant: 'destructive' });
          setMode('signin');
        } else {
          toast({ title: signUpErr.message, variant: 'destructive' });
        }
        setLoading(false);
        return;
      }
      setLoading(false);
    } else {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        toast({ title: 'Email o password non corretti.', variant: 'destructive' });
        setLoading(false);
        return;
      }
    }
  };

  if (!authChecked || ssoLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
            {mode === 'signup'
              ? 'Crea il tuo account'
              : mode === 'forgot'
                ? 'Recupera l\'accesso'
                : 'Accedi al tuo account'}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {mode === 'signup'
              ? 'Per accedere al tuo report di sinastria'
              : mode === 'forgot'
                ? 'Inserisci la tua email: ti invieremo un link per reimpostare la password.'
                : 'Inserisci le tue credenziali per accedere al tuo report di sinastria.'}
          </p>
        </div>

        {(mode === 'signup' || mode === 'signin') && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-muted bg-card text-foreground font-medium gap-3"
              onClick={() => handleSSOLogin('google')}
              disabled={!!ssoLoading}
            >
              {ssoLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continua con Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-muted bg-card text-foreground font-medium gap-3"
              onClick={() => handleSSOLogin('apple')}
              disabled={!!ssoLoading}
            >
              {ssoLoading === 'apple' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              Continua con Apple
            </Button>
          </div>
        )}

        {(mode === 'signup' || mode === 'signin') && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">oppure</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/80 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={fetchingEmail}
              placeholder={fetchingEmail ? 'Caricamento...' : 'La tua email'}
              className="h-12 rounded-xl border-muted bg-card"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80 text-sm">Password</Label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setPassword(''); setConfirmPassword(''); }}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Password dimenticata?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  placeholder="Almeno 6 caratteri"
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

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-foreground/80 text-sm">Conferma password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                placeholder="Ripeti la password"
                className="h-12 rounded-xl border-muted bg-card"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="premium"
            size="hero"
            disabled={loading || fetchingEmail}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === 'signup' ? 'Creazione in corso...' : mode === 'forgot' ? 'Invio in corso...' : 'Accesso in corso...'}
              </>
            ) : mode === 'signup' ? (
              'Accedi al tuo report'
            ) : mode === 'forgot' ? (
              'Invia link di reset'
            ) : (
              'Accedi'
            )}
          </Button>
        </form>

        {mode !== 'forgot' && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'signup' ? (
              <>
                Hai già un account?{' '}
                <button type="button" onClick={() => setMode('signin')} className="text-primary font-medium hover:underline">
                  Accedi
                </button>
              </>
            ) : (
              <>
                Non hai un account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">
                  Registrati
                </button>
              </>
            )}
          </p>
        )}

        {mode === 'forgot' && (
          <p className="text-center text-sm">
            <button type="button" onClick={() => setMode('signin')} className="text-primary font-medium hover:underline">
              Torna al login
            </button>
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground/70">
          I tuoi dati sono al sicuro. Non condivideremo mai la tua email.
        </p>
      </motion.div>
    </div>
  );
}
