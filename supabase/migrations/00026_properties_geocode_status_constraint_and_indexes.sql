-- PropFolio: harden properties geocode status values and add lookup indexes.
-- Safe additive migration; does not change app behavior, only data integrity/perf.

-- Normalize unexpected legacy status values before adding a constraint.
UPDATE public.properties
SET geocode_status = 'pending'
WHERE geocode_status IS NULL
   OR geocode_status NOT IN ('pending', 'in_progress', 'resolved', 'failed');

ALTER TABLE public.properties
  ALTER COLUMN geocode_status SET DEFAULT 'pending',
  ALTER COLUMN geocode_status SET NOT NULL;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_geocode_status_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_geocode_status_check
  CHECK (geocode_status IN ('pending', 'in_progress', 'resolved', 'failed'));

CREATE INDEX IF NOT EXISTS idx_properties_geocode_status
  ON public.properties(geocode_status);

CREATE INDEX IF NOT EXISTS idx_properties_lat_lng
  ON public.properties(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
