-- PropFolio: geocode metadata for map reliability and diagnostics.
-- Keeps coordinate sync idempotent and visible in UI.

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS full_address TEXT,
ADD COLUMN IF NOT EXISTS geocode_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS geocode_source TEXT,
ADD COLUMN IF NOT EXISTS geocode_error TEXT,
ADD COLUMN IF NOT EXISTS last_geocoded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.properties.full_address IS 'Normalized full address line used for geocoding and display.';
COMMENT ON COLUMN public.properties.geocode_status IS 'pending|in_progress|resolved|failed';
COMMENT ON COLUMN public.properties.geocode_source IS 'import|backfill|manual';
COMMENT ON COLUMN public.properties.geocode_error IS 'Last geocode failure reason.';
COMMENT ON COLUMN public.properties.last_geocoded_at IS 'Most recent geocode attempt timestamp.';
