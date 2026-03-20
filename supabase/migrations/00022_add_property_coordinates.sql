-- PropFolio: optional map coordinates for properties (filled from geocode on import or backfill).

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN public.properties.latitude IS 'WGS84 latitude from geocoding; nullable for legacy imports.';
COMMENT ON COLUMN public.properties.longitude IS 'WGS84 longitude from geocoding; nullable for legacy imports.';
