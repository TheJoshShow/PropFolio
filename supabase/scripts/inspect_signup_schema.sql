-- Run in Supabase SQL Editor (or psql) to audit signup-related schema, RLS, and triggers.
-- Paste sections as needed.

-- 1) profiles columns and nullability
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2) subscription_status columns (trigger must satisfy NOT NULL + FK)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subscription_status'
ORDER BY ordinal_position;

-- 3) RLS enabled?
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'subscription_status')
  AND c.relkind = 'r';

-- 4) Policies on profiles + subscription_status
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscription_status')
ORDER BY tablename, policyname;

-- 5) Triggers on profiles (signup chain)
SELECT tgname, tgtype, tgenabled, pg_get_triggerdef(oid, true) AS definition
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- 6) Trigger function owner + security (should be SECURITY DEFINER, owner postgres)
SELECT p.proname,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'ensure_subscription_status_on_profile';

-- 7) Foreign keys referencing auth.users (profile id must match auth user)
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;
