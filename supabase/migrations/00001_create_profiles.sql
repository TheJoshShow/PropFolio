-- PropFolio: App user profile (1:1 with auth.users). "users" in product terms.
-- Run after Supabase auth is enabled. Trigger to auto-create profile on signup can be added separately.

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'App user profile; one row per auth.users. Referred to as "users" in product docs.';

CREATE INDEX idx_profiles_id ON public.profiles(id);

-- RLS enabled in 00015_create_rls_policies.sql
