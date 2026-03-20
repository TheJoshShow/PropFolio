-- PropFolio: Normalized property record. One row per property; many analyses per property.
-- Source metadata and confidence support audit and "data quality" UI.

CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    -- Normalized address
    street_address TEXT NOT NULL,
    unit TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL CHECK (LENGTH(state) = 2),
    postal_code TEXT NOT NULL CHECK (LENGTH(postal_code) >= 5 AND LENGTH(postal_code) <= 10),
    country_code TEXT NOT NULL DEFAULT 'US' CHECK (LENGTH(country_code) = 2),
    -- Key normalized fields (queryable)
    list_price NUMERIC(14, 2),
    bedrooms INT CHECK (bedrooms IS NULL OR bedrooms >= 0),
    bathrooms NUMERIC(4, 2) CHECK (bathrooms IS NULL OR bathrooms >= 0),
    sqft INT CHECK (sqft IS NULL OR sqft > 0),
    lot_sqft INT CHECK (lot_sqft IS NULL OR lot_sqft >= 0),
    year_built INT CHECK (year_built IS NULL OR year_built >= 1800 AND year_built <= 2100),
    property_type TEXT,
    -- Full normalized snapshot (JSON) for flexibility
    normalized_snapshot JSONB,
    -- Source and confidence metadata (PropFolio rule: record source, timestamp, confidence)
    data_source TEXT,
    fetched_at TIMESTAMPTZ,
    overall_confidence NUMERIC(5, 4) CHECK (overall_confidence IS NULL OR (overall_confidence >= 0 AND overall_confidence <= 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.properties IS 'Canonical property record; raw payloads in imported_source_records.';
COMMENT ON COLUMN public.properties.overall_confidence IS '0–1 aggregate confidence from import; displayed in UI.';

CREATE INDEX idx_properties_portfolio_id ON public.properties(portfolio_id);
CREATE INDEX idx_properties_state_postal_code ON public.properties(state, postal_code);
CREATE INDEX idx_properties_fetched_at ON public.properties(fetched_at) WHERE fetched_at IS NOT NULL;
