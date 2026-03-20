-- PropFolio: One underwriting "run" per property. Many analyses per property (e.g. base, after reno).
-- Inputs/outputs as JSON; confidence stored for UI and audit.

CREATE TABLE public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Analysis',
    inputs_json JSONB NOT NULL,
    outputs_json JSONB NOT NULL,
    confidence_score NUMERIC(5, 2) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
    confidence_grade TEXT CHECK (confidence_grade IS NULL OR confidence_grade IN ('high', 'medium', 'low', 'veryLow')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.analyses IS 'One underwriting run per property; scenarios in analysis_scenarios.';
COMMENT ON COLUMN public.analyses.confidence_score IS '0–100 score from underwriting engine.';

CREATE INDEX idx_analyses_property_id ON public.analyses(property_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
