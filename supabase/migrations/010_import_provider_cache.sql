-- Server-side cache for third-party import providers (e.g. RentCast).
-- Accessed only via service role from Edge Functions (RLS enabled, no public policies).

CREATE TABLE IF NOT EXISTS public.import_provider_cache (
  cache_key text PRIMARY KEY,
  provider text NOT NULL DEFAULT 'rentcast',
  place_id text,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS import_provider_cache_expires_at_idx
  ON public.import_provider_cache (expires_at);

COMMENT ON TABLE public.import_provider_cache IS
  'Caches provider API payloads keyed by place_id or normalized address. Edge Functions use service role.';

ALTER TABLE public.import_provider_cache ENABLE ROW LEVEL SECURITY;
