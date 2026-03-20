-- PropFolio: Free tier — RLS and server-side import limit guard.
-- Seed-safe: drops then recreates trigger/function and policies so migration can be re-run.
-- Rollback: see rollback notes at the end of this file.

-- ---------------------------------------------------------------------------
-- 1. Guard function: block third property import unless entitlement_active
-- ---------------------------------------------------------------------------
-- Runs in context of the inserting user; RLS allows reading own property_imports and subscription_status.
CREATE OR REPLACE FUNCTION public.check_property_import_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    current_count BIGINT;
    can_import BOOLEAN;
BEGIN
    -- Count this user's existing imports (does not include NEW row yet).
    SELECT COUNT(*) INTO current_count
    FROM public.property_imports
    WHERE user_id = NEW.user_id;

    -- Allow if under limit (0 or 1 existing => 1 or 2 total after insert).
    IF current_count < 2 THEN
        RETURN NEW;
    END IF;

    -- At or over limit: require entitlement (e.g. pro subscription).
    SELECT COALESCE(entitlement_active, false) INTO can_import
    FROM public.subscription_status
    WHERE user_id = NEW.user_id;

    IF can_import THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Property import limit reached. Upgrade to import more properties.'
        USING ERRCODE = 'check_violation';
END;
$$;

COMMENT ON FUNCTION public.check_property_import_limit() IS 'Enforces free tier: max 2 imports per user unless subscription_status.entitlement_active is true.';

DROP TRIGGER IF EXISTS enforce_property_import_limit ON public.property_imports;
CREATE TRIGGER enforce_property_import_limit
    BEFORE INSERT ON public.property_imports
    FOR EACH ROW EXECUTE FUNCTION public.check_property_import_limit();

-- ---------------------------------------------------------------------------
-- 2. RLS: property_imports — users can only read/write their own rows
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_imports_select_own" ON public.property_imports;
CREATE POLICY "property_imports_select_own"
    ON public.property_imports FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "property_imports_insert_own" ON public.property_imports;
CREATE POLICY "property_imports_insert_own"
    ON public.property_imports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "property_imports_update_own" ON public.property_imports;
CREATE POLICY "property_imports_update_own"
    ON public.property_imports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "property_imports_delete_own" ON public.property_imports;
CREATE POLICY "property_imports_delete_own"
    ON public.property_imports FOR DELETE
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. RLS: subscription_status — users can only read/update their own row
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscription_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_status_select_own" ON public.subscription_status;
CREATE POLICY "subscription_status_select_own"
    ON public.subscription_status FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscription_status_insert_own" ON public.subscription_status;
CREATE POLICY "subscription_status_insert_own"
    ON public.subscription_status FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscription_status_update_own" ON public.subscription_status;
CREATE POLICY "subscription_status_update_own"
    ON public.subscription_status FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- No DELETE policy: subscription_status row is kept for lifecycle; revoke via entitlement_active = false.

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger for subscription_status
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_subscription_status_updated_at ON public.subscription_status;
CREATE TRIGGER set_subscription_status_updated_at
    BEFORE UPDATE ON public.subscription_status
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ROLLBACK (run in reverse order if reverting)
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS set_subscription_status_updated_at ON public.subscription_status;
-- DROP TRIGGER IF EXISTS enforce_property_import_limit ON public.property_imports;
-- DROP FUNCTION IF EXISTS public.check_property_import_limit();
-- DROP POLICY IF EXISTS "property_imports_delete_own" ON public.property_imports;
-- DROP POLICY IF EXISTS "property_imports_update_own" ON public.property_imports;
-- DROP POLICY IF EXISTS "property_imports_insert_own" ON public.property_imports;
-- DROP POLICY IF EXISTS "property_imports_select_own" ON public.property_imports;
-- DROP POLICY IF EXISTS "subscription_status_update_own" ON public.subscription_status;
-- DROP POLICY IF EXISTS "subscription_status_insert_own" ON public.subscription_status;
-- DROP POLICY IF EXISTS "subscription_status_select_own" ON public.subscription_status;
-- ALTER TABLE public.property_imports DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.subscription_status DISABLE ROW LEVEL SECURITY;
-- DROP TABLE IF EXISTS public.property_imports;
-- DROP TABLE IF EXISTS public.subscription_status;
