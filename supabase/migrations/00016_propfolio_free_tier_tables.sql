-- PropFolio: Free tier and subscription model — tables.
-- Seed-safe: CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS so migration can be re-run.
-- Rollback: run 00017 rollback first (drop trigger, function, policies, disable RLS), then:
--   DROP TABLE IF EXISTS public.property_imports;
--   DROP TABLE IF EXISTS public.subscription_status;
-- Do not drop profiles (may exist from 00001).

-- ---------------------------------------------------------------------------
-- 1. Profiles (if missing)
-- ---------------------------------------------------------------------------
-- Ensures profiles exists when this migration runs before 00001 (e.g. fresh DB or seed-safe replay).
-- No-op if 00001 already created it.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'App user profile; one row per auth.users. Referred to as "users" in product docs.';

-- Index only if table was just created (idempotent: CREATE INDEX IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- ---------------------------------------------------------------------------
-- 2. property_imports — one row per successful import per user (reliable count)
-- ---------------------------------------------------------------------------
-- Count of rows per user_id = number of successful imports. Used for free-tier limit (2).
CREATE TABLE IF NOT EXISTS public.property_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT CHECK (source IS NULL OR source IN ('zillow', 'redfin', 'rentcast', 'manual', 'other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.property_imports IS 'One row per successful property import per user; count per user_id enforces free-tier limit.';

CREATE INDEX IF NOT EXISTS idx_property_imports_user_id ON public.property_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_property_imports_imported_at ON public.property_imports(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_imports_user_id_imported_at ON public.property_imports(user_id, imported_at DESC);

-- ---------------------------------------------------------------------------
-- 3. subscription_status — entitlement flag per user (blocks 3rd+ import when false)
-- ---------------------------------------------------------------------------
-- One row per user. entitlement_active = true allows imports beyond the free-tier limit.
CREATE TABLE IF NOT EXISTS public.subscription_status (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    entitlement_active BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.subscription_status IS 'Per-user entitlement; when true, user may exceed free-tier import limit.';

CREATE INDEX IF NOT EXISTS idx_subscription_status_user_id ON public.subscription_status(user_id);
