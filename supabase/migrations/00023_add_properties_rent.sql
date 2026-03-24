-- PropFolio: monthly rent on properties (import path writes this from rent-estimate / listing).
-- Without this column, inserts from importLimits.toPropertyRow fail with "column rent does not exist".

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS rent NUMERIC(14, 2) CHECK (rent IS NULL OR rent >= 0);

COMMENT ON COLUMN public.properties.rent IS 'Estimated or listing monthly rent; nullable. Set on address/link import.';
