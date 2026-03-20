-- PropFolio: Raw payloads from Zillow, Redfin, etc. Normalized data lives in properties;
-- this table keeps raw for audit and reprocessing. Source + timestamp per PropFolio rules.

CREATE TABLE public.imported_source_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('zillow', 'redfin', 'rentcast', 'manual', 'other')),
    external_id TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(property_id, source, external_id)
);

COMMENT ON TABLE public.imported_source_records IS 'Raw API payloads per property/source; normalized data in properties.';

CREATE INDEX idx_imported_source_records_property_id ON public.imported_source_records(property_id);
CREATE INDEX idx_imported_source_records_source_external_id ON public.imported_source_records(source, external_id);
