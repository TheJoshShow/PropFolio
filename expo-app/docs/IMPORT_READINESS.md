# Import readiness (`ensureUserReadyForImport`)

## Purpose

Property import requires a `profiles` row (`portfolios.user_id` → `profiles.id`). The app must not assume the profile exists immediately after signup/sign-in (async storage + JWT hydration + RLS).

## Flow

1. `import` / `useExecutePropertyImport` → `recordPropertyImportEnforced`
2. `ensureUserReadyForImport(supabase, userId)`:
   - `getSession()` (with one short retry) — ensures persisted session is loaded
   - Compare session user id to React `session.id` from caller
   - `getUser()` with retries + optional `refreshSession()` — validates JWT for RLS
   - `ensureProfileWithFallback` — full `ensureProfile` using `user.user_metadata`, then **minimal** upsert `{ id, updated_at }` if full upsert fails (schema drift / column mismatch)
3. `ensureDefaultPortfolio` — select or insert portfolio
4. Insert property + `record_property_import` RPC

## Root causes addressed

- **Race**: UI `session` present before Supabase client has JWT → retries + refresh
- **Stale id**: session user id ≠ expected → explicit mismatch message
- **Auth hydration**: `useExecutePropertyImport` returns `authenticationInProgress` while `AuthContext.isLoading` is true (do not import until session is settled)
- **Profile upsert failure**: metadata/full payload fails → minimal row still creates FK target for portfolio
- **Single profile repair path**: `AuthContext.ensureProfileForUser` uses the same `ensureProfileWithFallback` as import (not `ensureProfile` only)
- **RPC shape drift**: unexpected / missing `record_property_import` status → logged (`import_rpc_unexpected_response`), inserted `properties` row removed, user sees `importTemporaryFailure`
- **Error text**: centralized in `importErrorMessages.ts` (no raw Supabase errors to users)

## Backend requirements

- RLS must allow authenticated users to `insert`/`update` their own `profiles` row (`auth.uid() = id`).
- `profiles` must exist with `id` → `auth.users(id)` FK (see Supabase migrations).
