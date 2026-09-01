import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nProvider';
import { useMetaConversions } from '@/hooks/useMetaConversions';
import { useSynastry, toCompleteBirthDate } from '@/context/SynastryContext';
import { ROUTES } from '@/lib/routes';

export default function CoppiaSuccess() {
  const navigate = useNavigate();
  const { m, market } = useI18n();
  const { data } = useSynastry();
  const { trackPurchase } = useMetaConversions();
  const cs = m.coppia.success;
  const [sessionId, setSessionId] = useState<string>(
    () => new URLSearchParams(window.location.search).get('session_id') || '',
  );
  const [paypalCapturing, setPaypalCapturing] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  useEffect(() => {
    document.title = m.coppia.titles.success(market.siteName);
  }, [m, market.siteName]);

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
          setPaypalError(cs.paypalError);
        }
      } finally {
        if (!cancelled) setPaypalCapturing(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Purchase lato browser, gemello di quello in PaymentSuccess: parte solo con
  // un checkout id confermato e usa i valori reali del checkout. Il gemello
  // server-side (webhook) manda lo stesso event_id, quindi Meta li fonde.
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || paypalCapturing || purchaseTrackedRef.current) return;

    // Marcato subito: questa pagina si auto-redirige a /coppia/activate dopo
    // 1,2s, quindi l'invio non deve dipendere dal fatto che il componente sia
    // ancora montato quando get-checkout-email risponde (non tocca stato).
    purchaseTrackedRef.current = true;

    (async () => {
      const { data: checkout } = await supabase.functions.invoke('get-checkout-email', {
        body: { sessionId },
      });

      const purchaseType = checkout?.purchaseType || 'synastry_launch';
      const amountTotal = Number(checkout?.amountTotal);
      const value =
        Number.isFinite(amountTotal) && amountTotal > 0
          ? amountTotal
          : purchaseType === 'synastry'
            ? market.prices.synastry
            : market.prices.synastryLaunch;

      trackPurchase({
        value,
        currency: checkout?.currency || market.currency,
        purchaseType,
        email: checkout?.email || undefined,
        firstName: data.personA.name || undefined,
        sessionId: checkout?.synastrySessionId || data.sessionId || undefined,
        birthDate: toCompleteBirthDate(data.personA.birthDate),
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, paypalCapturing]);

  useEffect(() => {
    if (!sessionId || paypalCapturing) return;
    const t = setTimeout(() => {
      navigate(`${ROUTES.coupleActivate}?session_id=${encodeURIComponent(sessionId)}`, { replace: true });
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
          {paypalError ? cs.titleProblem : cs.titleOk}
        </h1>
        <p className="text-sm text-muted-foreground">
          {paypalError
            ? paypalError
            : paypalCapturing
              ? cs.capturing
              : cs.preparing}
        </p>
      </div>
    </div>
  );
}
