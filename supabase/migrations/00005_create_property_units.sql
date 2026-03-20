-- PropFolio: Multi-unit support (e.g. duplex units A/B with separate rent).

CREATE TABLE public.property_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_label TEXT NOT NULL,
    bedrooms INT CHECK (bedrooms >= 0),
    bathrooms NUMERIC(4, 2) CHECK (bathrooms >= 0),
    rent_monthly NUMERIC(12, 2) CHECK (rent_monthly IS NULL OR rent_monthly >= 0),
    sqft INT CHECK (sqft IS NULL OR sqft > 0),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.property_units IS 'Units within a property; one property can have many units.';

CREATE INDEX idx_property_units_property_id ON public.property_units(property_id);
