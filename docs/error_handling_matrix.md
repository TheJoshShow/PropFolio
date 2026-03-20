# PropFolio Error Handling Matrix

**Purpose:** Map failure modes to handling (user message, retry, logging, fallback) and identify gaps. Drives consistent behavior and safe degradation.

**Last updated:** 2025-03-12.

---

## 1. Edge Function invocations (geocode, rent-estimate, places-autocomplete, census, openai-summarize, delete-account)

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| Supabase not configured | getSupabase() null | "Not configured" / demo or skip | No | __DEV__ | Use demo or offline flow |
| Network error / timeout | invoke throws or error response | Alert with error message | **Add:** optional retry (e.g. 1 retry) | Log event type + "network" (no PII) | **Add:** "You can try again" + skip rent if rent-estimate fails |
| 400 (bad request) | data.error | Show message from server | No | __DEV__ | — |
| 502/503/500 | data.error or throw | Show generic or server message | **Add:** retry for 502/503 | Log status/code (no body) | **Add:** graceful degradation (e.g. add property without rent) |
| Success but empty/malformed body | data shape invalid | "Could not load result" | No | __DEV__ | Use partial result if safe (e.g. address without rent) |

**Implementation notes:**
- Add a wrapper `invokeWithTimeout(name, body, { timeoutMs, retries })` that uses AbortController + setTimeout for timeout and retries on 502/503 or network errors.
- Keep existing `invoke` for delete-account and other non-latency-sensitive calls; use wrapper for geocode, rent-estimate, places-autocomplete.

---

## 2. Property import (recordPropertyImportEnforced)

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| Supabase null | Early return | "Not configured" | No | — | — |
| ensureDefaultPortfolio fails | portfolioId null | "Could not create portfolio" (non-retryable) | No | __DEV__ | — |
| Property insert fails | propError | "Failed to create property" (retryable) | Yes (user taps) | __DEV__ | — |
| RPC fails | rpcError | "Failed to record import" (retryable) | Yes | __DEV__ | — |
| RPC blocked_upgrade_required | status | Redirect to paywall; rollback property | No | — | setPendingImport for resume |
| RPC failed_nonretryable | status | "Import not allowed" | No | __DEV__ | — |
| Unknown status | default | "Please try again" (retryable) | Yes | __DEV__ | — |

**Current:** Handled. Ensure rollback on blocked is always done (already is). Optional: log non-PII "import_result" (status only) for analytics.

---

## 3. getImportCount / useImportLimit

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| Supabase null | — | — | No | — | count 0, freeRemaining 2, canImport true |
| No user | — | — | No | — | Same permissive default |
| DB error | error from select | — | No | __DEV__ | Same permissive default |

**Current:** Permissive fallback to avoid blocking. Consider: surface "Couldn't load usage" in UI when error and allow manual refresh.

---

## 4. Auth (sign-in, sign-up, magic link, reset password, delete account)

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| Supabase not configured | getSupabase() null | Demo user | No | — | Demo mode |
| Auth error | Supabase auth error | Show error.message (sanitized) | User can retry | __DEV__ only (no tokens) | — |
| ensureProfile fails | error from upsert | Session still set; profile insert retried on next load | — | __DEV__ | — |
| deleteAccount Edge error | data.error | Show error; do not sign out if delete failed | User can retry | __DEV__ | — |

**Recommendation:** Do not log full error object in production; log error.code or error.message only and ensure no token in message.

---

## 5. Subscription (RevenueCat, refresh, purchase, restore)

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| Load/refresh error | getCustomerInfo throws or error | Keep last state; optional "Couldn't refresh" | Refresh on next foreground | __DEV__ diagnostics | Keep cachedSnapshot; do not set customerInfo null |
| Purchase failed | PurchaseResult | Show outcome (cancelled/failed) | User can retry | __DEV__ | — |
| Restore failed | RestoreResult | "Restore failed" / "No purchases" | User can retry | __DEV__ | — |
| Offline | Network error | Show cached state; no revoke | — | — | Use subscriptionCache |

**Current:** No revoke on uncertain state. Good. Optional: set error state for "Couldn't refresh subscription" so user can tap Retry.

---

## 6. Scoring and underwriting (pure functions)

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| Invalid input (NaN, negative where invalid) | Input validation | Show "Insufficient data" or omit metric | No | — | Return null / insufficientData |
| Division by zero | Guards (price > 0, egi > 0, etc.) | — | No | — | Return null |

**Add:** Validate numeric inputs at boundary (simulation/underwriting entry); clamp or reject negative/NaN for key fields so UI never shows invalid numbers.

---

## 7. Parsing (address, Zillow, Redfin)

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| Empty string | trimmed empty | All null (address); URL unsupported/missing ID | No | — | — |
| Invalid URL | canParse false or exception | "Unsupported link" / "Missing listing ID" | No | — | — |
| Malformed address | No comma / no state-zip | Partial PartialAddress | No | — | addressToImportData fallbacks (Unknown, XX, 00000) |

**Current:** Handled. Optional: max length on address input (e.g. 500 chars) to avoid huge strings.

---

## 8. Analytics (trackEvent)

| Failure | Detection | User-facing | Retry | Logging | Fallback |
|---------|-----------|-------------|-------|---------|----------|
| No Supabase / no user | Early return | — | No | — | No-op |
| usage_events insert fails | catch | — | No | __DEV__ warn | No-op |

**Current:** No-op on failure; no user impact. Ensure metadata never contains PII (allowlist already in place).

---

## 9. Logging and PII

| Risk | Mitigation |
|------|------------|
| Logging error object that contains token or PII | Log only error.message or error.code in production; __DEV__ can log full message, never log response body with secrets. |
| Analytics metadata PII | SAFE_METADATA_KEYS allowlist; reject unknown keys in sanitizeForLog. |
| Edge Function logs | Ensure Edge handlers do not log request body or auth headers; log only status and error type. |

---

## Summary: implementation checklist

- [x] **Edge invoke:** Added timeout (30s) and optional retries for geocode, rent-estimate, places-autocomplete in `edgeFunctions.ts`; input validation for empty address/params.
- [x] **Rent failure in import:** If rent-estimate fails, property is still added without rent; success message shows "Rent estimate unavailable; you can add rent later in the property."
- [x] **Input validation:** Simulation inputs sanitized in `simulationEngine.ts` via `sanitizeInputs()` (NaN/Infinity → null) before underwriting.
- [ ] **Deal score/confidence copy:** Ensure UI labels estimates (see user_trust_and_disclaimer_recommendations.md) wherever score/rent are displayed.
- [x] **Auth/Edge logs:** `logErrorSafe()` in diagnostics logs only error message; importLimits uses it for getImportCount, ensureDefaultPortfolio, syncSubscriptionStatus.
- [ ] **Optional:** getImportCount error state in useImportLimit so UI can show "Couldn't load usage" and a refresh action.
