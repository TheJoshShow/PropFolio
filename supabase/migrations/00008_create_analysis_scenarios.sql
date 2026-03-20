-- PropFolio: What-if scenarios per analysis (e.g. Base, Optimistic, Pessimistic).

CREATE TABLE public.analysis_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    inputs_snapshot JSONB NOT NULL,
    outputs_snapshot JSONB NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.analysis_scenarios IS 'What-if variants for an analysis; each row is a full input/output snapshot.';

CREATE INDEX idx_analysis_scenarios_analysis_id ON public.analysis_scenarios(analysis_id);
