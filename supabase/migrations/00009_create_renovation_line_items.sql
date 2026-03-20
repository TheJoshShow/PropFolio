-- PropFolio: Renovation line items per analysis (description, cost, category).

CREATE TABLE public.renovation_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL CHECK (cost >= 0),
    category TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.renovation_line_items IS 'Reno line items tied to an analysis.';

CREATE INDEX idx_renovation_line_items_analysis_id ON public.renovation_line_items(analysis_id);
