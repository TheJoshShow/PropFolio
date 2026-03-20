# Import Enforcement: 2-Import Free Plan (Server-Authoritative)

Implementation summary for the server-authoritative enforcement layer: free users get 2 imports, paid users unlimited; usage is incremented only after a successful saved import; retries are idempotent.

---

## 1. File list

| Action | Path | Why |
|--------|------|-----|
| **Created** | `supabase/migrations/00020_record_property_import_rpc.sql` | Adds UNIQUE (user_id, property_id) on property_imports, dedupes existing rows, and adds RPC `record_property_import(p_property_id, p_source)` that returns status + count. |
| **Changed** | `expo-app/src/services/importLimits.ts` | Adds types `ImportRecordStatus`, `RecordPropertyImportResult`; adds `recordPropertyImportEnforced()` (create property + RPC); refactors `recordPropertyImport()` to call the enforced flow and map to legacy `RecordImportResult`. |
| **Changed** | `expo-app/app/(tabs)/import.tsx` | Uses `recordPropertyImportEnforced()` and handles all five statuses; later updated to use `useExecutePropertyImport`, loading/retry/duplicate-submit protection, and `getFreeImportsUsageCopy`. |
| **Created** | `docs/IMPORT-ENFORCEMENT-IMPLEMENTATION.md` | This file: summary, file list, manual steps, QA checklist. |
| **Created** | `expo-app/src/hooks/useExecutePropertyImport.ts` | Central gating hook: single entry point for all import attempts; `execute(data, source)` + `isSubmitting`; duplicate-submit guard; optional callbacks for success/blocked/retry/error. |
| **Changed** | `expo-app/src/services/importLimits.ts` | Adds `getFreeImportsUsageCopy(count, freeRemaining, canImport)` for consistent remaining-imports copy in import UX. |

---

## 2. Backend behavior

- **Unique constraint:** `property_imports (user_id, property_id)`. One row per user per property; duplicate retries do not insert a second row (idempotent).
- **RPC `record_property_import(p_property_id, p_source)`:**  
  - Uses `auth.uid()`.  
  - Inserts into `property_imports` with `ON CONFLICT (user_id, property_id) DO NOTHING RETURNING id`.  
  - If a row is returned: trigger allowed the insert → return `allowed_free` or `allowed_paid` (from `subscription_status.entitlement_active`) and `property_import_count`.  
  - If no row (conflict): idempotent retry → return same allowed status + current count.  
  - On trigger **check_violation**: return `blocked_upgrade_required`.  
  - On **foreign_key_violation**: return `failed_nonretryable`; on **unique_violation** (race): treat as idempotent success; on **others**: return `failed_retryable`.

Usage is incremented only when a new row is actually inserted (successful save). Retries do not double-count.

---

## 3. Frontend

- **Types:** `ImportRecordStatus`, `RecordPropertyImportResult` (discriminated on `status`).  
- **Wrapper:** `recordPropertyImportEnforced(supabase, userId, data, source)` → creates portfolio/property, then calls RPC; returns `RecordPropertyImportResult`.  
- **Legacy:** `recordPropertyImport()` still exists and maps the enforced result to `RecordImportResult` for any other callers.  
- **Import screen:** Calls `recordPropertyImportEnforced`, shows paywall for `blocked_upgrade_required`, “Try again” for `failed_retryable`, and error for `failed_nonretryable`.

---

### 3.1 Integration: central gating and UX

- **Single entry point:** All import attempts go through `useExecutePropertyImport().execute(data, source)`. No duplicate business logic in screens.
- **Hook** `useExecutePropertyImport`: provides `execute(data, source)` and `isSubmitting`; refreshes count on success; guards against double-submit. Optional callbacks: `onSuccess`, `onBlocked`, `onRetryable`, `onError`.
- **Remaining free imports:** `getFreeImportsUsageCopy(count, freeRemaining, canImport)` returns consistent copy (e.g. "1 of 2 free imports used · 1 remaining").
- **Blocked to paywall:** When result is `blocked_upgrade_required`, the app shows an alert and "Upgrade to Pro" opens the paywall (no silent failure).
- **Import screen:** Uses the hook; shows "Looking up…" / "Saving…" / "Use address"; disables button when loading or submitting; handles success, blocked (paywall), retry, and error.

---

## 4. Manual steps (outside codebase)

1. **Run migration:** Apply `00020_record_property_import_rpc.sql` to your Supabase project (e.g. `supabase db push` or run the SQL in the SQL editor).  
2. **Existing duplicates:** The migration dedupes `property_imports` by `(user_id, property_id)` before adding the unique constraint. If you have custom constraints or very large tables, run the migration during a low-traffic window.  
3. No env vars or feature flags were added; no manual config beyond applying the migration.

---

## 5. QA checklist (import enforcement)

- [ ] **Free user, 1st import:** Completes successfully; count = 1; status `allowed_free`.  
- [ ] **Free user, 2nd import:** Completes successfully; count = 2; status `allowed_free`.  
- [ ] **Free user, 3rd import:** Blocked before finalizing; status `blocked_upgrade_required`; paywall shown; no new row in `property_imports`.  
- [ ] **Paid user (entitlement_active = true):** Multiple imports succeed; status `allowed_paid`; count increments.  
- [ ] **Idempotent retry:** Same property imported twice (e.g. user taps “Add” twice or retries after success): only one row in `property_imports`; second call returns `allowed_free`/`allowed_paid` with same count (no double increment).  
- [ ] **Structured statuses:** Verify app receives and handles: `allowed_free`, `allowed_paid`, `blocked_upgrade_required`, `failed_retryable`, `failed_nonretryable` (e.g. retry button for `failed_retryable`, paywall for `blocked_upgrade_required`).  
- [ ] **Race / double-submit:** Two concurrent requests for the same property: one insert wins, the other hits unique conflict; both return success with correct count (no double count).  
- [ ] **Import screen:** After 2 free imports, usage text shows “2 of 2 free imports used”; 3rd attempt shows paywall; after upgrade, further imports work.  
- [ ] **Legacy `recordPropertyImport`:** If still used elsewhere, success/limitReached/error behavior unchanged.
- [ ] **Central gating:** Import tab uses `useExecutePropertyImport().execute()`; any future entry point (e.g. link import) must use the same hook.
- [ ] **Loading state:** "Looking up…" during geocode/rent; "Saving…" during record import; button disabled when loading or submitting.
- [ ] **Duplicate-submit:** Tapping "Use address" again while saving does not send a second request.
- [ ] **Blocked → paywall:** When free user hits limit, alert is shown and "Upgrade to Pro" opens paywall (no silent fail).
- [ ] **Remaining copy:** Import tab shows e.g. "1 of 2 free imports used · 1 remaining" or "Unlimited imports (Pro)" via `getFreeImportsUsageCopy`.
