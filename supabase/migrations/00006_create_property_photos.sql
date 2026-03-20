-- PropFolio: Photo URLs for a property; optional source for provenance.

CREATE TABLE public.property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.property_photos IS 'Photos per property; order and source stored.';

CREATE INDEX idx_property_photos_property_id ON public.property_photos(property_id);
