-- PropFolio: Extend subscription_status for RevenueCat webhook sync.
-- Adds product_id, store, expires_at, last_synced_at for server-side sync from webhooks.
-- Rollback: ALTER TABLE public.subscription_status DROP COLUMN IF EXISTS product_id, DROP COLUMN IF EXISTS store, DROP COLUMN IF EXISTS expires_at, DROP COLUMN IF EXISTS last_synced_at;

ALTER TABLE public.subscription_status
  ADD COLUMN IF NOT EXISTS product_id TEXT,
  ADD COLUMN IF NOT EXISTS store TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.subscription_status.product_id IS 'RevenueCat product_id from webhook (e.g. monthly_pro, annual_pro).';
COMMENT ON COLUMN public.subscription_status.store IS 'RevenueCat store: APP_STORE, PLAY_STORE, STRIPE, etc.';
COMMENT ON COLUMN public.subscription_status.expires_at IS 'When the current subscription period ends; NULL for non-expiring.';
COMMENT ON COLUMN public.subscription_status.last_synced_at IS 'When this row was last updated from a RevenueCat webhook.';

CREATE INDEX IF NOT EXISTS idx_subscription_status_expires_at ON public.subscription_status(expires_at) WHERE expires_at IS NOT NULL;
