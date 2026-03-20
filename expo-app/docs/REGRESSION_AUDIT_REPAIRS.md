# Regression Audit: Import, Autocomplete, and Sign-In Repairs

**Date:** Post-repair verification  
**Scope:** Zillow/manual import, portfolio creation/lookup, autocomplete, sign-in failure handling, auth navigation, import error handling.

---

## 1. Re-check: No New Regressions Introduced

| Area | Verification |
|------|--------------|
| **Zillow link import** | Flow unchanged: `handlePasteLink` → `parseZillowUrl` → `addressFromParts` → `importByAddressLine(addressLine, 'zillow')` → `execute(importData, source)`. Profile-then-portfolio and error messaging are additive; no change to success path. |
| **Manual address import** | `handleAddress` → `importByAddressLine(trimmed, 'manual')` unchanged. Same `execute` path; profile ensure and portfolio error differentiation do not alter payload or success flow. |
| **Portfolio creation / lookup** | `ensureDefaultPortfolio` now returns structured result; `recordPropertyImportEnforced` still returns same result types. Profile ensure runs before portfolio; first-time and existing-portfolio cases both still succeed when backend allows. |
| **Predictive suggestions** | Stale-response guard only skips applying outdated suggestions; selection still sets `addressInput`; "Use address" still submits current `addressInput`. Normalization accepts both `data.predictions` and `data.data.predictions`. |
| **Sign-in failure** | Login catch still only sets `error` state; no navigation. Tabs guard now runs redirect only when `segments[0] === '(tabs)'`, so when user is on `(auth)/login` the guard does nothing. |
| **Auth navigation** | Success: login `useEffect` still does `if (session) router.replace('/(tabs)')`. Sign-out: user remains on tabs until guard runs, then `router.replace('/(auth)')` (because `isOnTabsRoute` is true). |
| **Import error handling** | Failed import shows Alert and returns; `isSubmitting` is cleared in hook `finally`; `addressInput` is not cleared on failure so user can retry. Differentiated messages for profile/portfolio/create vs lookup. |

**Conclusion:** Fixes are additive or conditional; no success paths were removed or altered in a way that would regress behavior.

---

## 2. Temporary / Debug-Only Code

All logging added in these repairs is **production-safe**:

- **`logImportStep`** (diagnostics.ts): `if (!__DEV__) return` — no log in production.
- **`logErrorSafe`**: `if (__DEV__)` before `console.warn` — only message/code, no full error object in production.
- **Import screen**: `if (__DEV__) console.warn('[Import] placesAutocomplete error', error)` — dev only.
- **Import resume**: Existing `if (__DEV__ && !cancelled) console.log(...)` — dev only.
- **Auth errors**: `if (typeof __DEV__ !== 'undefined' && __DEV__ && error) console.warn(...)` — dev only.

**No temporary or debug-only code was removed** because none was added that runs in production. All of the above are appropriate to keep for support and debugging in development.

---

## 3. UI Stability After Failed Import

- **Failed retryable:** Alert with "OK" and "Try again"; "Try again" re-calls `importByAddressLine` with same args. Button returns to enabled state via `finally` in hook.
- **Failed non-retryable:** Alert with "OK"; no navigation; `addressInput` and form state unchanged so user can correct and submit again.
- **Loading state:** `isSubmitting` is always cleared in `useExecutePropertyImport` `finally`, so the primary CTA never stays stuck as "Saving…".

**Conclusion:** UI remains stable and retryable after failed import.

---

## 4. User Stays on Sign-In After Failed Auth

- Login screen: on throw from `signIn()`, only `setError(getAuthErrorMessage(e, 'signIn'))` runs; no router call.
- Tabs layout: `router.replace('/(auth)')` runs only when `isOnTabsRoute` is true (i.e. `segments[0] === '(tabs)'`). When the user is on `(auth)/login`, segments are `['(auth)', 'login']`, so the guard does not run and the user is not sent to welcome.

**Conclusion:** Failed sign-in keeps the user on the sign-in screen.

---

## 5. Autocomplete Visible and Selectable

- Suggestions container has `zIndex: 10` and `elevation: 4` so it layers above the "Use address" button.
- Rows have `minHeight: 44` and `justifyContent: 'center'` for touch targets.
- `ScrollView` has `keyboardShouldPersistTaps="handled"` so taps on suggestions are handled and the list remains tappable.
- Selection: `handleSelectSuggestion(description)` sets `addressInput(description)`, clears suggestions and autocomplete error.

**Conclusion:** Suggestions are visible and selectable when the API returns data.

---

## 6. Property Import After Selecting Autocomplete Suggestion

- Selecting a suggestion sets `addressInput` to the suggestion’s `description` (full address string).
- "Use address" calls `handleAddress` → `importByAddressLine(addressInput.trim(), 'manual', { clearInputs: true })`.
- So the chosen suggestion text is submitted as the address line; geocode/rent/import pipeline runs as for any manual address.

**Conclusion:** Property import still works after selecting an autocomplete suggestion.

---

## 7. Remaining Weak Spots

| Risk | Mitigation |
|------|------------|
| **Backend: profiles/portfolios RLS or schema** | If profile or portfolio create still fails in production, __DEV__ logs (`logImportStep` / `logErrorSafe`) and user messages ("Account setup incomplete…", "Could not create/load portfolio…") give a clear signal; fix remains on Supabase (policies/schema). |
| **Autocomplete: edge function or API key** | If `places-autocomplete` fails in production, user sees "Suggestions unavailable. You can still type an address and tap Use address." and can still complete import manually. |
| **Auth: `useSegments()` behavior** | If Expo Router changes segment shape (e.g. leading slash or different structure), `segments[0] === '(tabs)'` might need adjustment. Low risk; document for future upgrades. |
| **Stale response guard** | Depends on `addressInputRef.current` being updated in the same effect that schedules the request; currently done at effect start. No weak spot identified. |

---

## 8. Files Touched in Regression Pass

**No code changes were made during this regression audit.** All repair code was re-verified; logging is already __DEV__-guarded and no temporary logic was found. The only artifact added is this document.

(Repair touches from earlier work: `expo-app/src/services/importLimits.ts`, `expo-app/src/services/diagnostics.ts`, `expo-app/src/hooks/useExecutePropertyImport.ts`, `expo-app/app/(tabs)/import.tsx`, `expo-app/app/(tabs)/_layout.tsx`, `expo-app/src/utils/authErrors.ts`, `expo-app/src/services/profile.ts` (import only in importLimits).)

---

## 9. Final Manual TestFlight QA Checklist

### Import (Zillow + manual)

- [ ] **Zillow link:** Paste valid Zillow URL → Import from link → import succeeds; property appears in portfolio.
- [ ] **Manual address:** Type or paste full address (no suggestion) → Use address → import succeeds.
- [ ] **First-time user:** New account, first import → no "Could not create portfolio"; property saved.
- [ ] **Existing portfolio:** Second import (same account) → succeeds and appears in portfolio list.
- [ ] **Invalid Zillow link:** Paste non-Zillow URL → "Unsupported link" (no crash).
- [ ] **Failed import (e.g. network off):** Trigger failure → Alert with clear message; form still usable; can retry.
- [ ] **Error copy:** On profile/portfolio failure, message is "Account setup incomplete…" or "Could not create/load portfolio…" (not generic only).

### Autocomplete

- [ ] **Suggestions appear:** Type 3+ characters in address field → after ~400 ms, suggestions list appears below.
- [ ] **Suggestions visible:** List is above "Use address" button; not hidden by keyboard or other UI.
- [ ] **Select suggestion:** Tap a suggestion → field fills with that address; list closes.
- [ ] **Import after selection:** After selecting a suggestion, tap "Use address" → import runs and succeeds (or shows clear error).
- [ ] **No suggestions / error:** When API fails or returns empty → "Suggestions unavailable…" (or no list); manual entry still works.

### Sign-in and auth navigation

- [ ] **Wrong password:** Sign in with valid email, wrong password → stay on sign-in screen; error: "Incorrect email or password. Please try again."; can retry without being sent to welcome.
- [ ] **Wrong email:** Non-existent email + any password → stay on sign-in; error shown; no redirect to welcome.
- [ ] **Empty fields:** Submit with empty email or password → validation message; stay on sign-in.
- [ ] **Successful sign-in:** Valid credentials → navigate into app (tabs).
- [ ] **Sign-out:** From Settings (or any tab), sign out → redirect to welcome/auth.
- [ ] **Back to welcome:** On sign-in screen, tap "← Welcome" → goes to welcome only via that action, not on failed sign-in.

### General

- [ ] No console/runtime errors during the above flows (in TestFlight/production build).
- [ ] No stuck loading states (e.g. "Saving…" or "Signing in…" never clearing).

---

**Release readiness:** The repaired areas (import, autocomplete, sign-in failure, auth navigation, import error handling) are **ready for release** from a code and flow perspective, with the understanding that any remaining "Could not create portfolio" or profile errors require Supabase-side verification (RLS, schema, and edge function configuration).
