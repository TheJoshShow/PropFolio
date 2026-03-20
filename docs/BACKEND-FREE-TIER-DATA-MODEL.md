# Backend Data Model: Free-Tier Limits and Subscription-Aware Access Control

This document describes the SQL migrations and design for server-authoritative import limits and subscription state. It does not implement client UI or billing logic.

---

## 1. Migrations Overview

| Migration | Purpose |
|-----------|---------|
| **00016** | `profiles` (if missing), `property_imports`, `subscription_status` (entitlement_active, updated_at). |
| **00017** | RLS on property_imports and subscription_status; trigger `check_property_import_limit` on property_imports INSERT. |
| **00018** | subscription_status: product_id, store, expires_at, last_synced_at (RevenueCat webhook). |
| **00019** | subscription_status: plan_status, free_limit; profile trigger for new-user defaults; usage_counters view; guard uses free_limit; RPC get_import_allowance. |
| **00020** | property_imports: UNIQUE (user_id, property_id); RPC record_property_import(property_id, source) for idempotent recording and structured status (allowed_free, allowed_paid, blocked_upgrade_required, failed_retryable, failed_nonretryable). See docs/IMPORT-ENFORCEMENT-IMPLEMENTATION.md. |

---

## 2. Data Model

### 2.1 profiles

- **Role:** One row per app user (1:1 with auth.users). Existing table (00001/00016).
- **Relevant columns:** id (UUID, FK auth.users), display_name, avatar_url, created_at, updated_at.
- **New users:** No change to profiles schema. When a profile is inserted, trigger `ensure_subscription_status_on_profile` (00019) creates a row in subscription_status with plan_status = 'free', free_limit = 2, entitlement_active = false.

### 2.2 property_imports (usage)

- **Role:** One row per successful property import per user. Count per user_id = property import count.
- **Columns:** id, user_id (FK profiles), property_id (FK properties, nullable), imported_at, source (zillow|redfin|rentcast|manual|other), created_at.
- **When count increments:** Only when the app (or backend) successfully inserts a row—i.e. after a property is created and the import is recorded. No client-only counter; the table is the source of truth.
- **Enforcement:** BEFORE INSERT trigger `check_property_import_limit` runs in the same transaction as the INSERT; it counts existing rows and checks subscription_status. If count >= free_limit and entitlement_active is false, the trigger raises and the INSERT is aborted.

### 2.3 subscription_status (plan and entitlement)

- **Role:** One row per user: plan tier, free limit, and whether paid entitlement is active.
- **Columns (after 00019):** user_id (PK), entitlement_active (boolean), plan_status ('free'|'pro'|'enterprise'), free_limit (int, default 2), updated_at; plus product_id, store, expires_at, last_synced_at (00018).
- **Defaults for new users:** plan_status = 'free', free_limit = 2, entitlement_active = false. Set by (1) trigger on profile INSERT, (2) backfill in 00019 for existing profiles without a row.
- **Future expansion:** plan_status and free_limit allow different tiers (e.g. enterprise with higher free_limit). entitlement_active remains the gate for “unlimited” imports.

### 2.4 usage_counters (view)

- **Role:** Read-only view for “current import count per user.” Derived from property_imports.
- **Definition:** `SELECT user_id, COUNT(*)::INT AS property_import_count FROM property_imports GROUP BY user_id`.
- **Security:** View has no separate RLS; underlying table property_imports has RLS. Authenticated users only see their own property_imports rows, so the view effectively shows only their own row (or no row if count 0).
- **Grant:** SELECT granted to authenticated.

---

## 3. RLS (Row-Level Security)

### 3.1 property_imports

- **SELECT:** `auth.uid() = user_id` — users see only their own imports.
- **INSERT:** `auth.uid() = user_id` (WITH CHECK) — users can only insert for themselves. The trigger then enforces the limit.
- **UPDATE / DELETE:** Same user_id check — users can update/delete only their own rows.

So the app must be authenticated and can only insert with user_id = auth.uid(). The trigger runs in the same transaction and blocks the insert when over limit.

### 3.2 subscription_status

- **SELECT:** `auth.uid() = user_id` — users see only their own row.
- **INSERT:** `auth.uid() = user_id` — allowed so the profile trigger (SECURITY DEFINER) and the app (e.g. after purchase) can create/upsert the row.
- **UPDATE:** `auth.uid() = user_id` — users and webhooks (via service role) can update. No DELETE policy; revoke access by setting entitlement_active = false.

### 3.3 usage_counters (view)

- No RLS on the view itself. SELECT is restricted by property_imports RLS when the view is queried as the current user, so users only see their own aggregated count.

---

## 4. Race Conditions: How They Are Prevented

- **Single enforcement point:** The limit is enforced only in the database, inside the trigger `check_property_import_limit` on property_imports INSERT.
- **Atomicity:** The trigger runs in the same transaction as the INSERT. It (1) counts existing rows for the user, (2) reads subscription_status for that user, (3) allows or rejects the insert. No separate “check then insert” round-trip; the check and the insert are one transaction.
- **No counter table:** We do not maintain a separate “usage_counters” table that is incremented. We use COUNT(*) on property_imports. So there is no “read counter, increment counter” race—only “insert row,” and the trigger does a count at that moment. Two concurrent inserts for the same user: each insert runs its trigger; one will see count 0 and succeed, the other will see count 1 and succeed (both under limit 2). A third will see count 2 and fail unless entitlement_active is true. So simultaneous imports cannot bypass the limit.
- **Serialization:** Postgres row-level locking and trigger execution mean that for a given user, the order of INSERTs is serializable; the count seen by the trigger is consistent.

---

## 5. How the App Should Call the Backend Safely

### 5.1 Recording an import (only after successful save)

1. App creates/gets portfolio and creates the property row (existing flow).
2. App inserts into **property_imports** (user_id = auth.uid(), property_id = the new property, source = 'manual' or other).
3. If the insert succeeds, the import is counted and the user has one more import. If the trigger raises (limit reached), the insert fails with a check_violation (e.g. code 23514); the app should treat that as “limit reached” and show paywall/upgrade.
4. Do not rely on a client-side count to “allow” or “disallow” the insert. The client can pre-check (e.g. call get_import_allowance) for UX to show “you’re at limit” and avoid a guaranteed error, but the server trigger is the authority.

### 5.2 Reading usage and allowance (UI only)

- **Option A:** Query **usage_counters** for the current user (one row: property_import_count) and **subscription_status** (free_limit, entitlement_active). Compute can_import = (property_import_count < free_limit) OR entitlement_active in the app.
- **Option B:** Call RPC **get_import_allowance()** which returns (property_import_count, free_limit, entitlement_active, can_import) in one round-trip. Use this for UI only; enforcement remains the trigger.

### 5.3 New users

- When the app (or auth trigger) inserts a row into **profiles**, the trigger **ensure_subscription_status_on_profile** (00019) inserts a row into **subscription_status** with plan_status = 'free', free_limit = 2, entitlement_active = false. So new users get the correct defaults without the app having to insert subscription_status explicitly. The app can still upsert subscription_status (e.g. after purchase) with ON CONFLICT.

---

## 6. Helper Functions and RPCs

### 6.1 check_property_import_limit() (trigger)

- **When:** BEFORE INSERT on property_imports.
- **What:** Counts existing rows for NEW.user_id; reads free_limit and entitlement_active from subscription_status (defaults 2 and false if no row); allows insert if count < free_limit or entitlement_active is true; otherwise raises check_violation.
- **Who:** Runs in the inserter’s transaction (invoker).

### 6.2 ensure_subscription_status_on_profile() (trigger)

- **When:** AFTER INSERT on profiles.
- **What:** Inserts into subscription_status (user_id, entitlement_active = false, plan_status = 'free', free_limit = 2) ON CONFLICT (user_id) DO NOTHING.
- **Who:** SECURITY DEFINER so it runs with definer rights and can insert even if the session would not otherwise see subscription_status (e.g. during signup).

### 6.3 get_import_allowance() (RPC)

- **Purpose:** Return current user’s property_import_count, free_limit, entitlement_active, and can_import in one call. For UI only.
- **Who:** SECURITY INVOKER; returns one row. RLS on property_imports and subscription_status applies, so the user only sees their own data.

---

## 7. Files Created, Changed, or Deleted

| Action | File | Why |
|--------|------|-----|
| **Created** | `supabase/migrations/00019_free_tier_usage_counters_and_defaults.sql` | Adds plan_status and free_limit to subscription_status; backfills subscription_status for existing profiles; trigger on profiles for new-user defaults; usage_counters view; updated check_property_import_limit to use free_limit; RPC get_import_allowance. |
| **Created** | `docs/BACKEND-FREE-TIER-DATA-MODEL.md` | Documents data model, RLS, race conditions, and how the app should call the backend. |
| **Changed** | None | No existing migration files were modified; 00019 is additive. |
| **Deleted** | None | — |

---

## 8. Manual Configuration Steps (Outside Codebase)

- **Run migrations:** Apply Supabase migrations (e.g. `supabase db push` or run 00019 on your project) so the new columns, trigger, view, and RPC exist.
- **RevenueCat webhook:** Continue to upsert subscription_status (entitlement_active, product_id, store, expires_at, last_synced_at). 00019 does not change how the webhook writes; it only adds plan_status and free_limit (with defaults). If the webhook does not set plan_status/free_limit, existing defaults (free, 2) remain.
- **Optional:** When granting a user a paid plan, set entitlement_active = true (and optionally plan_status = 'pro') via webhook or app; no schema change required.

---

## 9. QA Checklist (Backend / Migrations)

- [ ] **Apply 00019** on a Supabase project (or local DB); migration runs without errors.
- [ ] **New profile:** Insert a row into profiles; verify one row appears in subscription_status with plan_status = 'free', free_limit = 2, entitlement_active = false.
- [ ] **Backfill:** For an existing profile that had no subscription_status row before 00019, run the backfill (or re-run migration); verify the row exists with free, 2, false.
- [ ] **usage_counters:** As authenticated user, SELECT * FROM usage_counters; verify you see only your row (or none if you have no property_imports) and property_import_count matches COUNT(*) from property_imports for your user_id.
- [ ] **get_import_allowance:** Call SELECT * FROM get_import_allowance(); verify one row with property_import_count, free_limit = 2, entitlement_active = false, can_import = (property_import_count < 2).
- [ ] **Import limit (free):** As a free user (entitlement_active = false), insert 2 rows into property_imports; both succeed. Third insert fails with check_violation (e.g. 23514) and message containing “limit”.
- [ ] **Import limit (paid):** Set entitlement_active = true for a user; insert 3+ rows into property_imports; all succeed.
- [ ] **RLS:** As user A, attempt to SELECT from property_imports or subscription_status for user B’s user_id; verify no rows returned. Attempt to INSERT into property_imports with user_id = B as user A; verify RLS blocks (or trigger runs with A’s context and counts A’s rows).
- [ ] **Concurrent inserts:** From two sessions as the same user, run two INSERTs into property_imports (both under limit); both succeed and count becomes 2. Third insert from either session fails.
