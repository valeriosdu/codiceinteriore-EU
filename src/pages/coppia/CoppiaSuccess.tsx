import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function CoppiaSuccess() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>(
    () => new URLSearchParams(window.location.search).get('session_id') || '',
  );
  const [paypalCapturing, setPaypalCapturing] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Pagamento ricevuto | Codice Interiore';
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paypalToken = params.get('token') || params.get('paypal_order') || '';
    if (!paypalToken || sessionId) return;

    let cancelled = false;
    setPaypalCapturing(true);

    (async () => {
      try {
        const { data: capture, error } = await supabase.functions.invoke('capture-paypal-order', {
          body: { orderId: paypalToken },
        });
        if (cancelled) return;
        if (error || !capture?.sessionId) {
          throw new Error(error?.message || 'Capture failed');
        }
        const newUrl = `${window.location.pathname}?session_id=${encodeURIComponent(capture.sessionId)}`;
        window.history.replaceState({}, '', newUrl);
        setSessionId(capture.sessionId);
      } catch (e) {
        console.error('PayPal capture error:', e);
        if (cancelled) return;

        const opaqueId = `pp_${paypalToken}`;
        let recovered = false;
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          const { data: poll, error: pollErr } = await supabase.functions.invoke(
            'get-checkout-email',
            { body: { sessionId: opaqueId } },
          );
          if (cancelled) return;
          if (!pollErr && poll) {
            recovered = true;
            break;
          }
        }

        const newUrl = `${window.location.pathname}?session_id=${encodeURIComponent(opaqueId)}`;
        window.history.replaceState({}, '', newUrl);
        setSessionId(opaqueId);

        if (!recovered) {
          setPaypalError("Non siamo riusciti a confermare il pagamento PayPal. Contattaci se l'importo è stato addebitato.");
        }
      } finally {
        if (!cancelled) setPaypalCapturing(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId || paypalCapturing) return;
    const t = setTimeout(() => {
      navigate(`/coppia/activate?session_id=${encodeURIComponent(sessionId)}`, { replace: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [navigate, sessionId, paypalCapturing]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
          {paypalError ? "C'è stato un problema" : 'Grazie, pagamento ricevuto'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {paypalError
            ? paypalError
            : paypalCapturing
              ? 'Stiamo confermando il pagamento PayPal…'
              : 'Sto preparando il tuo account. Un attimo…'}
        </p>
      </div>
    </div>
  );
}
