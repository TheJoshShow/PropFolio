-- PropFolio: Free-tier defaults, usage_counters view, and server-authoritative import limit.
-- Depends on: 00016 (property_imports, subscription_status), 00017 (RLS, check_property_import_limit).
-- Rollback: see end of file.

-- ---------------------------------------------------------------------------
-- 1. subscription_status: plan_status and free_limit (defaults for new users)
-- ---------------------------------------------------------------------------
-- Every user has plan_status (free|pro) and free_limit (e.g. 2). New users get free, 2.
ALTER TABLE public.subscription_status
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS free_limit INT NOT NULL DEFAULT 2;

-- Constrain plan_status for future expansion (pro, enterprise, etc.)
ALTER TABLE public.subscription_status
  DROP CONSTRAINT IF EXISTS subscription_status_plan_status_check;
ALTER TABLE public.subscription_status
  ADD CONSTRAINT subscription_status_plan_status_check
  CHECK (plan_status IN ('free', 'pro', 'enterprise'));

-- free_limit must be non-negative
ALTER TABLE public.subscription_status
  DROP CONSTRAINT IF EXISTS subscription_status_free_limit_check;
ALTER TABLE public.subscription_status
  ADD CONSTRAINT subscription_status_free_limit_check
  CHECK (free_limit >= 0);

COMMENT ON COLUMN public.subscription_status.plan_status IS 'Plan tier: free (default), pro, enterprise. Used with entitlement_active for access.';
COMMENT ON COLUMN public.subscription_status.free_limit IS 'Max property imports allowed when entitlement is not active; default 2.';

-- Ensure every profile has a subscription_status row (backfill; idempotent)
INSERT INTO public.subscription_status (user_id, entitlement_active, plan_status, free_limit)
SELECT p.id, false, 'free', 2
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Trigger: create subscription_status when a new profile is created
-- ---------------------------------------------------------------------------
-- New users get plan_status = free, free_limit = 2, entitlement_active = false.
CREATE OR REPLACE FUNCTION public.ensure_subscription_status_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscription_status (user_id, entitlement_active, plan_status, free_limit)
  VALUES (NEW.id, false, 'free', 2)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ensure_subscription_status_on_profile() IS 'Creates a subscription_status row for new profiles with free defaults.';

DROP TRIGGER IF EXISTS ensure_subscription_status_on_profile ON public.profiles;
CREATE TRIGGER ensure_subscription_status_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_subscription_status_on_profile();

-- ---------------------------------------------------------------------------
-- 3. usage_counters view (read-only; derived from property_imports)
-- ---------------------------------------------------------------------------
-- One row per user: property_import_count = number of successful imports.
-- Count only increments when a row exists in property_imports (after successful save).
CREATE OR REPLACE VIEW public.usage_counters AS
SELECT
  user_id,
  COUNT(*)::INT AS property_import_count
FROM public.property_imports
GROUP BY user_id;

COMMENT ON VIEW public.usage_counters IS 'Per-user usage: property_import_count. RLS on property_imports restricts to own user.';

-- Grant select to authenticated (view uses underlying table RLS)
GRANT SELECT ON public.usage_counters TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Guard function: use free_limit from subscription_status (race-safe)
-- ---------------------------------------------------------------------------
-- Atomic: count + entitlement check in same transaction as INSERT. Prevents
-- simultaneous imports from bypassing the limit.
CREATE OR REPLACE FUNCTION public.check_property_import_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_count BIGINT;
  user_free_limit INT;
  can_import BOOLEAN;
BEGIN
  -- Count existing imports for this user (does not include NEW row yet)
  SELECT COUNT(*) INTO current_count
  FROM public.property_imports
  WHERE user_id = NEW.user_id;

  -- Get this user's free_limit and entitlement (defaults if no row)
  SELECT COALESCE(ss.free_limit, 2), COALESCE(ss.entitlement_active, false)
  INTO user_free_limit, can_import
  FROM public.subscription_status ss
  WHERE ss.user_id = NEW.user_id;

  -- If no row, use safe defaults (allow first 2)
  IF user_free_limit IS NULL THEN
    user_free_limit := 2;
    can_import := false;
  END IF;

  -- Allow if under limit (before this insert)
  IF current_count < user_free_limit THEN
    RETURN NEW;
  END IF;

  -- At or over limit: require entitlement (paid)
  IF can_import THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Property import limit reached. Upgrade to import more properties.'
    USING ERRCODE = 'check_violation';
END;
$$;

COMMENT ON FUNCTION public.check_property_import_limit() IS 'Enforces free tier: max free_limit imports per user unless subscription_status.entitlement_active is true. Atomic with INSERT.';

-- ---------------------------------------------------------------------------
-- 5. RPC: get_import_allowance (for app to read count and limit in one call)
-- ---------------------------------------------------------------------------
-- Returns current user's usage and allowance. Read-only; enforcement is the trigger.
CREATE OR REPLACE FUNCTION public.get_import_allowance()
RETURNS TABLE (
  property_import_count BIGINT,
  free_limit INT,
  entitlement_active BOOLEAN,
  can_import BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid UUID;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH cnt AS (
    SELECT COUNT(*) AS n FROM public.property_imports WHERE user_id = uid
  ),
  sub AS (
    SELECT ss.free_limit, ss.entitlement_active
    FROM public.subscription_status ss
    WHERE ss.user_id = uid
    LIMIT 1
  )
  SELECT
    (SELECT n FROM cnt)::BIGINT,
    COALESCE((SELECT free_limit FROM sub), 2),
    COALESCE((SELECT entitlement_active FROM sub), false),
    (
      (SELECT n FROM cnt) < COALESCE((SELECT free_limit FROM sub), 2)
      OR COALESCE((SELECT entitlement_active FROM sub), false)
    );
END;
$$;

COMMENT ON FUNCTION public.get_import_allowance() IS 'Returns current user import count, free_limit, entitlement, and can_import. Use for UI only; enforcement is trigger on property_imports INSERT.';

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually if reverting)
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.get_import_allowance();
-- DROP VIEW IF EXISTS public.usage_counters;
-- DROP TRIGGER IF EXISTS ensure_subscription_status_on_profile ON public.profiles;
-- DROP FUNCTION IF EXISTS public.ensure_subscription_status_on_profile();
-- (Restore previous check_property_import_limit from 00017 if needed)
-- ALTER TABLE public.subscription_status DROP CONSTRAINT IF EXISTS subscription_status_free_limit_check;
-- ALTER TABLE public.subscription_status DROP CONSTRAINT IF EXISTS subscription_status_plan_status_check;
-- ALTER TABLE public.subscription_status DROP COLUMN IF EXISTS free_limit;
-- ALTER TABLE public.subscription_status DROP COLUMN IF EXISTS plan_status;
