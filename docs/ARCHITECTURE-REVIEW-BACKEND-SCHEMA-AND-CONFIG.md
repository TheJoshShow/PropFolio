# Architecture Review: Backend Schema & Config

**Reviewer:** Architecture Reviewer  
**Scope:** Supabase schema (migrations 00001–00015), RLS, and iOS backend config (Configuration/, Supabase client, auth, SETUP-BACKEND-CONFIG.md)  
**Date:** As of review

---

## Verdict: **PASS** (with minor fix list)

The schema supports the full product vision, is not over-engineered for v1, and represents imports, scenarios, and market snapshots cleanly. Secrets are isolated; pricing/usage can be added later without schema changes. The fix list below is limited to documentation clarity, one optional schema note, and profile-creation guarantee.

---

## 1. Does the schema support the full product vision?

| Product element | Schema support | Notes |
|-----------------|----------------|-------|
| Import (Zillow/Redfin/address) | ✅ | `properties` (normalized) + `imported_source_records` (raw); source/fetched_at/confidence on both |
| Analyze with investor metrics | ✅ | `analyses` (inputs_json, outputs_json, confidence_score, confidence_grade) |
| What-if scenarios in real time | ✅ | `analysis_scenarios` (name, inputs_snapshot, outputs_snapshot, sort_order) per analysis |
| Confidence meter | ✅ | `properties.overall_confidence`; `analyses.confidence_score` / `confidence_grade` |
| Future value predictor | ✅ | `market_snapshots` (geography + date + signals_json); app can join by property geography; optional later: `analyses.market_snapshot_id` for “market at analysis date” |
| Track analyzed deals in portfolio | ✅ | `portfolios` → `properties` → `analyses`; multiple analyses per property |
| Multiple units per property | ✅ | `property_units` |
| Photos | ✅ | `property_photos` |
| Renovation (future) | ✅ | `renovation_line_items` (per analysis) |

**Conclusion:** Full product vision is supported. No missing tables for v1.

---

## 2. Is anything over-engineered for v1?

| Table / feature | Verdict | Notes |
|-----------------|--------|--------|
| subscriptions | ✅ OK | Single table, simple plan/status; needed for any future gating |
| usage_events | ✅ OK | Minimal (user_id, event_type, resource_type, metadata, created_at); required for future limits |
| property_units | ✅ OK | Needed for multi-unit; not heavy |
| renovation_line_items | ✅ OK | Backlog feature; table is light and avoids future migration |
| market_snapshots | ✅ OK | Reference data; one row per geography+date |
| api_cache_entries | ✅ OK | Needed to avoid duplicate external API calls |
| Multiple portfolios per user | ✅ OK | Single table, no extra complexity |

**Conclusion:** Nothing is over-engineered. All tables have a clear v1 or near-term use.

---

## 3. Imports, scenario versions, and market snapshots — represented cleanly?

### Imports

- **Normalized:** `properties` holds canonical record + `data_source`, `fetched_at`, `overall_confidence`.
- **Raw:** `imported_source_records` has `property_id`, `source`, `external_id`, `raw_payload`, `fetched_at` and `UNIQUE(property_id, source, external_id)`.
- **Clean:** One property → many imported records; provenance and re-import (upsert) are clear. **Fix:** Document that re-import of same (property, source, external_id) should upsert (update `raw_payload`, `fetched_at`) rather than insert.

### Scenario versions

- **analysis_scenarios:** `analysis_id`, `name`, `inputs_snapshot`, `outputs_snapshot`, `sort_order`, `created_at`/`updated_at`.
- No separate version column; `created_at` and `sort_order` are enough for ordering and “base” (e.g. sort_order = 0). Clean for v1.
- Optional later: `is_primary` boolean if you want an explicit “base” scenario.

### Market snapshots

- **market_snapshots:** `geography_type`, `geography_id`, `snapshot_date`, `signals_json`, `UNIQUE(geography_type, geography_id, snapshot_date)`.
- Read-only for authenticated (RLS); writes via service role. Clean.
- Optional later: `analyses.market_snapshot_id` (nullable FK) to store “market data as of analysis date” for audit or replay.

**Conclusion:** Imports, scenarios, and market snapshots are represented cleanly. Only documentation/upsert and optional future FKs noted.

---

## 4. Are secrets isolated properly?

### Config layer (iOS)

- Only **SUPABASE_URL** and **SUPABASE_ANON_KEY** are loaded; both are client-safe (anon key is intended for client use).
- **AppConfiguration** never logs or prints URL/key; only redacted `safeDescription` (e.g. “&lt;set&gt;” / “&lt;missing&gt;”).
- **ServiceConfiguration.Supabase.current()** throws with key name only, never the value.
- Docs state **service_role** must never be in the app; anon key is safe behind RLS.
- **.gitignore:** `Secrets.xcconfig`, `Config-Secrets.xcconfig`; example files only in repo.

### Backend (Supabase)

- Secrets (API keys for Zillow, etc.) live in Supabase project env / Vault, not in migrations. Schema has no secret columns.
- **api_cache_entries** is service-role only (no anon/authenticated policies).

**Conclusion:** Secrets are isolated. One recommendation: in SETUP-BACKEND-CONFIG.md, briefly state that if real keys are ever put in Info.plist, that plist (or a copy) should not be committed.

---

## 5. Could future pricing/usage enforcement be added cleanly?

- **usage_events:** Already has `user_id`, `event_type`, `resource_type`, `metadata`, `created_at` and indexes on `(user_id, created_at DESC)` and `(event_type, created_at DESC)`. Supports “count events per user per period” and “count by type” for limits.
- **subscriptions:** `plan`, `status`, `current_period_start` / `current_period_end` support “is this user in a paid plan and in which period?”.
- Enforcement can be implemented in Edge Functions or app: load subscription for user, count usage_events in current period, allow/deny. No schema change required.
- Optional later: materialized view or DB function for “usage counts per user per period” for performance; not required for v1.

**Conclusion:** Yes. Future pricing/usage enforcement can be added cleanly on top of the current schema.

---

## 6. Concrete fix list

### Required (doc / process)

1. **SCHEMA-OVERVIEW.md** — Remove duplicate row for `usage_events` in the table summary (it appears twice).
2. **imported_source_records** — In migration comment or schema overview, state: “Re-import of the same (property_id, source, external_id) should upsert (update raw_payload and fetched_at) rather than insert.”
3. **Profile creation** — In RLS plan or a short “Post-deploy” section in schema docs, state: “Ensure a row in `public.profiles` exists for each `auth.users` row (trigger on auth.users INSERT or app creates profile on first sign-in).” If you add a trigger, add it in a migration and reference it in the doc.

### Recommended (doc)

4. **SETUP-BACKEND-CONFIG.md** — Add one sentence under Production or Safe handling: “If you ever put real keys in Info.plist, do not commit that file (or use a build-phase to inject from env only).”
5. **xcconfig → Info.plist** — In the “Option C: xcconfig” bullet, clarify: “To expose xcconfig to the app, add to your target’s Info tab keys such as SUPABASE_URL = $(SUPABASE_URL) so they are baked into Info.plist at build time from the xcconfig.”

### Optional (future)

6. **analyses.market_snapshot_id** — Optional nullable FK to `market_snapshots(id)` for “market data as of analysis date”; add in a later migration when needed.
7. **analysis_scenarios.is_primary** — Optional boolean to mark the base scenario; v1 can rely on `sort_order = 0`.

---

## 7. Summary

| Criterion | Result |
|-----------|--------|
| Schema supports full product vision | ✅ Yes |
| Over-engineered for v1 | ✅ No |
| Imports / scenarios / market snapshots clean | ✅ Yes (doc upsert + optional future FK) |
| Secrets isolated | ✅ Yes |
| Future pricing/usage enforcement | ✅ Can be added cleanly |

**Verdict: PASS.** Apply the required and recommended doc/process fixes above; optional items can be deferred.
