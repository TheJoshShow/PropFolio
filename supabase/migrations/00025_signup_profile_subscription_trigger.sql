-- PropFolio: Harden the profile → subscription_status signup chain.
--
-- Problem this addresses:
-- AFTER INSERT ON public.profiles runs ensure_subscription_status_on_profile(), which INSERTs
-- into public.subscription_status (RLS enabled). If the trigger function is not SECURITY DEFINER
-- owned by a role that bypasses RLS (e.g. postgres), the nested INSERT can fail and roll back
-- the entire profiles INSERT — surfacing as a generic PostgREST error on signup.
--
-- This migration re-applies the function with a locked search_path and postgres ownership,
-- and recreates the trigger idempotently.

CREATE OR REPLACE FUNCTION public.ensure_subscription_status_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.subscription_status (user_id, entitlement_active, plan_status, free_limit)
  VALUES (NEW.id, false, 'free', 2)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ensure_subscription_status_on_profile() IS
  'Creates subscription_status for new profiles (free defaults). SECURITY DEFINER so RLS on subscription_status cannot block bootstrap.';

ALTER FUNCTION public.ensure_subscription_status_on_profile() OWNER TO postgres;

DROP TRIGGER IF EXISTS ensure_subscription_status_on_profile ON public.profiles;
CREATE TRIGGER ensure_subscription_status_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_subscription_status_on_profile();
