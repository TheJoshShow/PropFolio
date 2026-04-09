-- Supabase advisor: views should not behave like SECURITY DEFINER (owner bypasses RLS).
-- With security_invoker = true, permission checks and RLS use the querying role (recommended).
-- Requires PostgreSQL 15+ (Supabase default).
ALTER VIEW IF EXISTS public.usage_counters SET (security_invoker = true);
