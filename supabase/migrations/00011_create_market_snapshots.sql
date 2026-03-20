-- PropFolio: Market signals by geography and date. Reference data; no user ownership.
-- Optimized for lookups by geography and time (analytics, "market at analysis date").

CREATE TABLE public.market_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geography_type TEXT NOT NULL CHECK (geography_type IN ('zip', 'city', 'county', 'metro', 'state', 'national')),
    geography_id TEXT NOT NULL,
    snapshot_date DATE NOT NULL,
    signals_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(geography_type, geography_id, snapshot_date)
);

COMMENT ON TABLE public.market_snapshots IS 'Market signals by geography + date; shared reference data.';

CREATE INDEX idx_market_snapshots_geography ON public.market_snapshots(geography_type, geography_id);
CREATE INDEX idx_market_snapshots_snapshot_date ON public.market_snapshots(snapshot_date DESC);
