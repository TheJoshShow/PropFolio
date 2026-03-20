-- PropFolio: Cache for external API responses. Used by Edge Functions only (service role).
-- Reduces duplicate calls; TTL via expires_at. No user_id; key is request hash.

CREATE TABLE public.api_cache_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE,
    cache_value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.api_cache_entries IS 'API response cache; access via service role only.';

CREATE INDEX idx_api_cache_entries_cache_key ON public.api_cache_entries(cache_key);
CREATE INDEX idx_api_cache_entries_expires_at ON public.api_cache_entries(expires_at);
