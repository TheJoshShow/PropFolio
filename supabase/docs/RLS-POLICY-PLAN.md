# PropFolio RLS Policy Plan

## Strategy

- **Tenant isolation:** All user data is scoped by `auth.uid()`. A user can only see and modify rows that belong to them.
- **Ownership chain:** Profiles own Portfolios; Portfolios own Properties; Properties own Analyses and related rows. RLS policies for properties and children use `EXISTS` subqueries through this chain so there is no need to store `user_id` on every table.
- **Reference data:** `market_snapshots` is read-only for authenticated users (no per-user rows).
- **Service-only:** `api_cache_entries` has RLS enabled but no policies for `anon` or `authenticated`, so only the service role can read/write.
- **Usage events:** Users can insert and select only their own `usage_events` (for analytics and limits).

## Policy matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|--------|
| **profiles** | own (id = auth.uid()) | own | own | — | 1:1 with auth.users |
| **subscriptions** | own | own | own | — | user_id = auth.uid() |
| **portfolios** | own | own | own | own | user_id = auth.uid() |
| **properties** | via portfolio | via portfolio | via portfolio | via portfolio | EXISTS portfolio.user_id |
| **property_units** | via property→portfolio | via property→portfolio | same | same | |
| **property_photos** | via property→portfolio | same | same | same | |
| **analyses** | via property→portfolio | same | same | same | |
| **analysis_scenarios** | via analysis→property→portfolio | same | same | same | |
| **renovation_line_items** | via analysis→property→portfolio | same | same | same | |
| **imported_source_records** | via property→portfolio | same | same | same | |
| **market_snapshots** | authenticated | — | — | — | Reference; backfill via service role |
| **api_cache_entries** | — | — | — | — | Service role only |
| **usage_events** | own | own | — | — | user_id = auth.uid() |

## Implementation notes

1. **Profiles:** Policy allows INSERT so the app (or a trigger) can create a profile when a user signs up. Optional: add a trigger on `auth.users` (in a migration that uses `auth` schema) to insert into `public.profiles` on signup.
2. **Cascading deletes:** FKs use `ON DELETE CASCADE` so deleting a portfolio removes its properties and all downstream rows; no orphaned data.
3. **api_cache_entries:** With RLS enabled and no policies for anon/authenticated, the Supabase client using the anon key cannot read or write cache; Edge Functions using the service role key can.
4. **market_snapshots:** Only SELECT for authenticated. Writes (backfill/ETL) should use the service role. If you need authenticated writes (e.g. “save market view”), add a separate policy later.
5. **usage_events:** Insert and select only; no update/delete so the event stream is append-only for audit and limits.

## Migration

Policies are applied in **00015_create_rls_policies.sql** after all tables and triggers exist. Order does not matter for RLS within that file; table creation order is in 00001–00014.

## Testing RLS

- As an authenticated user, select from `portfolios` → only that user’s rows.
- As user A, attempt to update user B’s property (by id) → 0 rows updated.
- As anon, select from `api_cache_entries` → 0 rows (or error if RLS denies).
- As service role, select/insert `api_cache_entries` → allowed.
