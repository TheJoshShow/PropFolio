-- PropFolio: User container for grouping properties (e.g. "My Deals", "2024").

CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Portfolio',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.portfolios IS 'User-owned container; each property belongs to one portfolio.';

CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
