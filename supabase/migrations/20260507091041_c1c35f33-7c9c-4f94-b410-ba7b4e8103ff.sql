UPDATE public.checkout_sessions
SET payment_status='paid',
    customer_email='danielabruss54@gmail.com',
    provider_payment_id='6JX51963923529637',
    payment_completed_at='2026-05-01T09:20:02Z',
    purchase_type=COALESCE(purchase_type,'base'),
    product_code=COALESCE(product_code,'natal_report_base'),
    includes_transits=false,
    transit_months=0,
    amount_total=1900,
    currency='EUR',
    provider_metadata = provider_metadata || jsonb_build_object('manual_recovery', true, 'paypal_order_id','3YL47131XU662494V','capture_id','6JX51963923529637','reason','order expired before writeback; reconciled from PayPal transaction')
WHERE stripe_session_id='pp_3YL47131XU662494V';