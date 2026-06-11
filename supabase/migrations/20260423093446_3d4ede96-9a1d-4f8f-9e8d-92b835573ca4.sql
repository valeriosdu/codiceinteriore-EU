ALTER TABLE public.checkout_sessions
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS product_code TEXT,
ADD COLUMN IF NOT EXISTS includes_transits BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS transit_months INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.transit_cycles
ADD COLUMN IF NOT EXISTS premium_purchase_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS premium_purchase_local_datetime TEXT,
ADD COLUMN IF NOT EXISTS premium_purchase_timezone TEXT,
ADD COLUMN IF NOT EXISTS snapshot_count INTEGER NOT NULL DEFAULT 9,
ADD COLUMN IF NOT EXISTS snapshot_step_days INTEGER NOT NULL DEFAULT 3;

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_product_code ON public.checkout_sessions(product_code);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_payment_completed_at ON public.checkout_sessions(payment_completed_at);
CREATE INDEX IF NOT EXISTS idx_transit_cycles_premium_purchase_at ON public.transit_cycles(premium_purchase_at);
CREATE INDEX IF NOT EXISTS idx_transit_cycles_purchase_timezone ON public.transit_cycles(premium_purchase_timezone);