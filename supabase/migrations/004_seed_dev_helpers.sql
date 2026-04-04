-- Dev / staging helpers — safe no-ops in production if unused.
-- Run manually: `supabase db execute --file supabase/migrations/004_seed_dev_helpers.sql` or merge into local seed.

-- Example: relax nothing here by default. Document patterns for local testing:
--
-- insert into public.usage_limits (user_id, property_imports_total)
-- values ('00000000-0000-0000-0000-000000000000', 0)
-- on conflict (user_id) do nothing;

comment on table public.property_imports is 'Audit trail for property import pipeline; written by import-property Edge Function.';
comment on table public.property_snapshots is 'Immutable snapshot versions; current denormalized copy remains on properties.snapshot.';
comment on table public.scenarios is 'User-saved scoring scenario patches per property.';
comment on table public.subscription_status is 'RevenueCat mirror; updated by revenuecat-webhook with service role.';
comment on table public.usage_limits is 'Server-side usage; increment via increment_property_import_usage() RPC.';
