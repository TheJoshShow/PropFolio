-- PropFolio: Idempotent record_property_import RPC and unique constraint.
-- Prevents duplicate increments on retry; returns structured status to the app.
-- Depends on: 00016, 00017, 00019.

-- ---------------------------------------------------------------------------
-- 1. Dedupe: keep one row per (user_id, property_id) before adding unique
-- ---------------------------------------------------------------------------
DELETE FROM public.property_imports a
USING public.property_imports b
WHERE a.user_id = b.user_id
  AND a.property_id IS NOT NULL
  AND b.property_id IS NOT NULL
  AND a.property_id = b.property_id
  AND a.id < b.id;

-- ---------------------------------------------------------------------------
-- 2. Unique constraint: one property_import per (user_id, property_id)
-- ---------------------------------------------------------------------------
-- Prevents double-counting when the app retries after a successful save.
-- Multiple rows with property_id NULL are allowed (legacy or edge cases).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'property_imports_user_property_key'
  ) THEN
    ALTER TABLE public.property_imports
      ADD CONSTRAINT property_imports_user_property_key
      UNIQUE (user_id, property_id);
  END IF;
END $$;

COMMENT ON CONSTRAINT property_imports_user_property_key ON public.property_imports IS 'One import record per user per property; idempotent retries.';

-- ---------------------------------------------------------------------------
-- 3. RPC: record_property_import(property_id, source) → status, property_import_count
-- ---------------------------------------------------------------------------
-- Call after property row exists. Inserts into property_imports; trigger enforces limit.
-- ON CONFLICT (user_id, property_id) DO NOTHING: retry returns success without double-count.
-- Returns: allowed_free | allowed_paid | blocked_upgrade_required | failed_retryable | failed_nonretryable
CREATE OR REPLACE FUNCTION public.record_property_import(
  p_property_id UUID,
  p_source TEXT
)
RETURNS TABLE (
  status TEXT,
  property_import_count INT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  inserted_id UUID;
  cnt INT;
  ent BOOLEAN;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    status := 'failed_nonretryable';
    property_import_count := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.property_imports (user_id, property_id, source)
    VALUES (uid, p_property_id, COALESCE(NULLIF(TRIM(p_source), ''), 'manual'))
    ON CONFLICT (user_id, property_id) DO NOTHING
    RETURNING id INTO inserted_id;

    IF inserted_id IS NOT NULL THEN
      -- Insert succeeded; trigger allowed it
      SELECT COUNT(*)::INT INTO cnt FROM public.property_imports WHERE user_id = uid;
      SELECT COALESCE(entitlement_active, false) INTO ent
        FROM public.subscription_status WHERE user_id = uid LIMIT 1;
      status := CASE WHEN ent THEN 'allowed_paid' ELSE 'allowed_free' END;
      property_import_count := cnt;
      RETURN NEXT;
      RETURN;
    END IF;

    -- ON CONFLICT DO NOTHING: row already exists (idempotent retry)
    SELECT COUNT(*)::INT INTO cnt FROM public.property_imports WHERE user_id = uid;
    SELECT COALESCE(entitlement_active, false) INTO ent
      FROM public.subscription_status WHERE user_id = uid LIMIT 1;
    status := CASE WHEN ent THEN 'allowed_paid' ELSE 'allowed_free' END;
    property_import_count := cnt;
    RETURN NEXT;
    RETURN;

  EXCEPTION
    WHEN check_violation THEN
      status := 'blocked_upgrade_required';
      property_import_count := NULL;
      RETURN NEXT;
      RETURN;
    WHEN foreign_key_violation THEN
      status := 'failed_nonretryable';
      property_import_count := NULL;
      RETURN NEXT;
      RETURN;
    WHEN unique_violation THEN
      -- Race: another request inserted; treat as idempotent success
      SELECT COUNT(*)::INT INTO cnt FROM public.property_imports WHERE user_id = uid;
      SELECT COALESCE(entitlement_active, false) INTO ent
        FROM public.subscription_status WHERE user_id = uid LIMIT 1;
      status := CASE WHEN ent THEN 'allowed_paid' ELSE 'allowed_free' END;
      property_import_count := cnt;
      RETURN NEXT;
      RETURN;
    WHEN OTHERS THEN
      status := 'failed_retryable';
      property_import_count := NULL;
      RETURN NEXT;
      RETURN;
  END;
END;
$$;

COMMENT ON FUNCTION public.record_property_import(UUID, TEXT) IS 'Records a property import for the current user. Idempotent by (user_id, property_id). Returns status: allowed_free, allowed_paid, blocked_upgrade_required, failed_retryable, failed_nonretryable.';

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually if reverting)
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.record_property_import(UUID, TEXT);
-- ALTER TABLE public.property_imports DROP CONSTRAINT IF EXISTS property_imports_user_property_key;
