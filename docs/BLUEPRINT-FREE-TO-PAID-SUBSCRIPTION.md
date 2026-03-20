# Implementation Blueprint: Free-to-Paid Subscription Model

**Purpose:** Concrete plan for adding a free-to-paid subscription model to PropFolio (Expo app). No implementation in this document—blueprint only.

**Scope:** expo-app (iOS, Android, web). Backend: Supabase (existing migrations + revenuecat-webhook). Aligns with existing codebase (see `docs/AUDIT-CODEBASE-BEFORE-SUBSCRIPTIONS.md`).

---

## 1. Business Requirements (Summary)

| Requirement | Implementation approach |
|-------------|-------------------------|
| Users can sign up and log in | Existing: AuthContext + Supabase Auth + ensureProfile. No change. |
| Free users get exactly 2 successful property imports | Server: trigger on `property_imports` INSERT. Client: gate UI and handle 3rd-attempt error. |
| 3rd attempted import blocks and shows upgrade paywall | Client: check before starting import; server rejects INSERT; client shows paywall on limit error. |
| Paid users get unlimited imports | `subscription_status.entitlement_active = true` (from RevenueCat / webhook) allows trigger to pass. |
| Purchases inside app via native IAP | Existing: react-native-purchases (RevenueCat). No change. |
| Restore purchases | Existing: restorePurchases in revenueCat.ts + Restore button on paywall/settings. No change. |
| Manage subscriptions (platform flow) | Existing: subscriptionManagement.ts (RevenueCat URL or Apple/Google fallback). No change. |
| iOS and Android cleanly | RevenueCat + platform-specific API keys; web no-op so app does not break. |

---

## 2. Data Model (Free Usage + Subscription State)

### 2.1 Existing Model (Use As-Is)

**Free usage tracking**

- **Table:** `public.property_imports`
- **Purpose:** One row per successful property import per user. Count per `user_id` = number of imports.
- **Columns:** `id`, `user_id` (FK profiles), `property_id` (FK properties, nullable), `imported_at`, `source` ('zillow'|'redfin'|'rentcast'|'manual'|'other'), `created_at`.
- **Enforcement:** `check_property_import_limit()` trigger on INSERT: if `COUNT(*)` for user ≥ 2, allow only if `subscription_status.entitlement_active` is true for that user; otherwise raise exception.

**Subscription state**

- **Table:** `public.subscription_status`
- **Purpose:** One row per user; source of truth for “can this user exceed the free limit?”
- **Columns:** `user_id` (PK, FK profiles), `entitlement_active` (boolean, default false), `updated_at`; plus `product_id`, `store`, `expires_at`, `last_synced_at` (from migration 00018).
- **Writers:** (1) RevenueCat webhook Edge Function (authoritative after purchase/renewal/expiration); (2) Client `syncSubscriptionStatus()` after purchase/restore (optimistic sync so trigger allows next import without waiting for webhook).

### 2.2 No New Tables

- Usage = count of `property_imports` for user.
- Entitlement = `subscription_status.entitlement_active`.
- No separate “plans” or “subscriptions” table required for this model; RevenueCat holds product/offerings; server only needs the boolean (and optional metadata already in 00018).

### 2.3 Invariants

- **Server-authoritative limit:** The only place that can allow a 3rd+ import is the DB trigger reading `subscription_status.entitlement_active`. Client and Edge Function only write data; they do not decide “allow/deny” for the INSERT.
- **Idempotent writes:** `subscription_status` is upserted by `user_id`; `property_imports` is append-only (no update of count in application logic).

---

## 3. Service Layer Structure

### 3.1 Proposed Layout (Folder / File)

```
expo-app/src/
├── services/
│   ├── supabase.ts           # (existing) Client singleton, auth storage
│   ├── profile.ts            # (existing) ensureProfile
│   ├── revenueCat.ts         # (existing) Configure, offerings, customerInfo, purchase, restore, getManagementUrl, hasProAccess
│   ├── importLimits.ts       # (existing) getImportCount, syncSubscriptionStatus, recordPropertyImport, ensureDefaultPortfolio, addressToImportData, FREE_IMPORT_LIMIT
│   ├── edgeFunctions.ts      # (existing) Geocode, places, rent, openai, census
│   ├── analytics.ts          # (existing) trackEvent
│   └── index.ts              # (existing) Re-exports
├── contexts/
│   ├── AuthContext.tsx       # (existing) Session, sign-in/up/out, ensureProfile
│   └── SubscriptionContext.tsx # (existing) Offerings, customerInfo, hasProAccess, refresh, purchase, restore; syncSubscriptionStatus on change
├── hooks/
│   └── useImportLimit.ts     # (existing) getImportCount + hasProAccess → canImport, count, freeRemaining, refresh
├── utils/
│   └── subscriptionManagement.ts # (existing) openSubscriptionManagement (RevenueCat URL or platform fallback)
└── config/
    └── env.ts                # (existing) validateAuthEnv
```

### 3.2 Responsibility Matrix

| Concern | Service / module | Responsibility |
|--------|------------------|----------------|
| Auth | AuthContext, supabase.ts, profile.ts | Session, sign-in/up/out, ensureProfile. No change. |
| Usage check | importLimits.ts | `getImportCount(supabase)` → count from `property_imports`; no entitlement decision here. |
| Entitlement (source of truth for “Pro”) | revenueCat.ts + SubscriptionContext | RevenueCat customerInfo → `hasProAccess(customerInfo)`. SubscriptionContext syncs to `subscription_status` for server. |
| Paywall presentation | app/paywall.tsx | Reads SubscriptionContext; shows offerings, Subscribe, Restore, Done; already implemented. |
| Purchase handling | revenueCat.ts (purchasePackage) + SubscriptionContext (purchase) | Call RevenueCat; on success update context and sync subscription_status. |
| Restore | revenueCat.ts (restorePurchases) + SubscriptionContext (restore) | Call RevenueCat; on success update context and sync. |
| Management links | subscriptionManagement.ts + revenueCat.ts (getManagementUrl) | Open platform subscription management; used by settings and optionally paywall. |

No new service files are required. One fix: ensure SubscriptionContext is mounted (see File plan).

### 3.3 Optional: Entitlement Service Facade

If you want a single place that “answers: can this user import?” for UI only (cached/optimistic):

- **Option A (recommended):** Keep current design. `useImportLimit` composes `getImportCount` (server count) + `hasProAccess` (RevenueCat). Server remains authority on the INSERT.
- **Option B:** Add `src/services/entitlement.ts` that exports `getEntitlementForUI(supabase, userId)` reading `subscription_status` for “last known” when offline. UI can show a stale “Pro” badge; actual allow/deny for import still comes from trigger on INSERT. Use only if you need offline-friendly display; not required for MVP.

---

## 4. UI vs Business Logic Separation

### 4.1 Current Pattern (Keep)

- **Screens (UI):** `app/(tabs)/import.tsx`, `app/paywall.tsx`, `app/(tabs)/settings.tsx`. They call hooks and context; no direct Supabase or RevenueCat calls for business rules.
- **Hooks:** `useImportLimit()` composes services and returns `count`, `freeRemaining`, `canImport`, `isLoading`, `refresh`. Logic: `canImport = (freeRemaining > 0) || hasProAccess`.
- **Context:** SubscriptionContext holds offerings, customerInfo, hasProAccess, purchase, restore. AuthContext holds session.
- **Services:** Pure functions (or singleton client); no React. `importLimits.ts`, `revenueCat.ts`, `subscriptionManagement.ts`.

### 4.2 Rules

- **UI:** Only presents data and calls context/hook methods (e.g. “Upgrade to Pro” → router to paywall; “Restore” → context.restore()). No calculation of “can import” or “is Pro” in the screen.
- **Business logic:** “Can user import?” = server count + entitlement. Computed in hook from services/context. “Did limit block this insert?” = server error code/message; handled in service return and then in UI (show paywall).

---

## 5. Server-Authoritative Guards (Import Limit)

### 5.1 Single Enforcement Point

- **Location:** Database trigger `enforce_property_import_limit` on `public.property_imports` (BEFORE INSERT).
- **Logic (existing):** Count existing rows for `NEW.user_id`. If count < 2, allow. If count ≥ 2, allow only if `subscription_status.entitlement_active` is true for that user; otherwise `RAISE EXCEPTION 'Property import limit reached. Upgrade to import more properties.'` with `ERRCODE = 'check_violation'` (23514).

### 5.2 Client Role

- **Before starting an import (UX):** Call `getImportCount` + use `hasProAccess`. If `!canImport`, show paywall and do not call `recordPropertyImport`. This avoids unnecessary work and a guaranteed server error.
- **When saving an import:** Always call `recordPropertyImport`. If the trigger raises (e.g. race: user was at limit or entitlement expired), client gets error with `limitReached: true` and shows paywall.
- **No client-only enforcement:** The limit is not enforced only in the client. The trigger is the authority; client checks are for UX and to handle the error path.

### 5.3 Where Not to Enforce

- Do not enforce the limit in an Edge Function that “approves” imports (adds complexity and duplicates trigger logic). The trigger is the single source of truth.
- Do not rely on client “count” or “canImport” to allow an INSERT without the server again checking; the server does not trust the client.

---

## 6. Local / Cached Subscription State (UI Only)

### 6.1 Safe Uses of Cached State

- **Display only:** “Pro” badge, “Unlimited imports” text, “Manage subscription” visibility. Source: SubscriptionContext (`hasProAccess`, `customerInfo`) or, if you add it, a read of `subscription_status` for “last known” when offline.
- **Optimistic UI:** After purchase or restore, update context immediately and optionally call `syncSubscriptionStatus` so the next import sees entitlement without waiting for the webhook.
- **Deciding whether to show paywall or “Add property”:** Using `canImport` (from count + hasProAccess) is safe for UI flow; the server still enforces on INSERT.

### 6.2 What Not to Use Cache For

- **Allowing the INSERT:** The database trigger does not use client state. It reads `subscription_status` (and count) from the DB. So “cached Pro” must eventually be reflected in `subscription_status` (via sync or webhook) for the trigger to allow the 3rd+ import.
- **Permanent authority:** If RevenueCat is down or stale, the webhook and client sync keep `subscription_status` updated. Do not treat “no RevenueCat response” as “user is Pro” without a server-side rule.

### 6.3 Web

- On web, RevenueCat is not configured for purchase; `hasProAccess` is false (or customerInfo null). `canImport` is effectively “free remaining > 0”. Server trigger still applies if someone uses the web client with auth; they get 2 imports then block. No new logic required; existing “subscriptions on iOS/Android” message is sufficient.

---

## 7. Error Handling and Fallback Behavior

### 7.1 Import Flow

| Scenario | Handling |
|---------|----------|
| `recordPropertyImport` success | Refresh import count; show success; clear form as today. |
| `recordPropertyImport` with `limitReached: true` | Show paywall (alert + navigate to /paywall or inline CTA). Do not retry the insert. |
| `recordPropertyImport` with other error (e.g. network, RLS) | Show generic error message; allow retry. |
| `getImportCount` fails | In existing code, return `{ count: 0, freeRemaining: 2, canImport: true }` so UI does not block; server still enforces on insert. Optional: show “Couldn’t load usage” and still allow attempt. |
| User not signed in | Auth gate already redirects to login; import screen not reachable without session. |

### 7.2 Purchase / Restore

| Scenario | Handling |
|---------|----------|
| Purchase success | Update SubscriptionContext; sync subscription_status; dismiss paywall; refresh import limit in UI. |
| User cancels | No error; dismiss paywall or leave on paywall. |
| Pending (e.g. Ask to Buy) | Show “Purchase is pending approval…” (already in paywall). |
| Network / RevenueCat error | Show error in context; “Try again” / refresh. |
| Restore success | Same as purchase success. |
| Restore “no purchases” | Show “No purchases to restore” (or similar); do not treat as generic failure. |

### 7.3 Subscription Status Sync

| Scenario | Handling |
|---------|----------|
| `syncSubscriptionStatus` fails | Log in dev; do not block purchase success UX. Webhook will update server eventually. |
| RevenueCat down on app load | SubscriptionContext has no offerings/customerInfo; hasProAccess false. User can still use free tier; paywall shows “No plans” or “Try again.” |

### 7.4 Web

- Purchases/restore/manage disabled or no-op; paywall shows that subscriptions are on iOS/Android. No crash; no new fallback beyond existing behavior.

---

## 8. File / Folder Plan

### 8.1 No New Files Required for Core Model

The existing structure already implements the model. The only required code change is mounting SubscriptionProvider.

### 8.2 Files to Change (Minimal)

| File | Change | Why |
|------|--------|-----|
| `expo-app/app/_layout.tsx` | Wrap the root navigation (Stack) with `SubscriptionProvider` so that (tabs), paywall, update-password, and modal are inside it. | SubscriptionContext is used by import, settings, and paywall; without the provider, those screens throw when calling `useSubscription()`. |

### 8.3 Files Created

| File | Purpose |
|------|--------|
| (None for core subscription model) | All logic and UI already exist. |

### 8.4 Files Deleted

| File | Reason |
|------|--------|
| None | No removals. |

### 8.5 Optional / Future-Only

- **`src/services/entitlement.ts`:** Only if you add “offline entitlement display” (read `subscription_status` for last-known Pro badge). Not in scope for minimal blueprint.
- **New screens or components:** Only if you add new flows (e.g. dedicated “Manage subscription” screen); current settings + paywall are enough.

---

## 9. State Flow (Text Diagram)

### 9.1 App Load (Authenticated)

```
User opens app (logged in)
  → AuthContext: session present
  → (tabs) layout renders
  → SubscriptionProvider (once mounted): session.id set
      → configureRevenueCat(session.id)
      → getOfferings() + getCustomerInfo()
      → set offerings, customerInfo; hasProAccess = hasProAccess(customerInfo)
      → syncSubscriptionStatus(supabase, session.id, hasProAccess)
  → useImportLimit (on Import or Settings):
      → getImportCount(supabase) → count, freeRemaining
      → canImport = (freeRemaining > 0) || hasProAccess
  → UI shows count (“X of 2 used” or “Unlimited”) and enables/disables “Add property” / shows paywall card
```

### 9.2 Import Attempt (Free User at Limit)

```
User has 2 imports; hasProAccess = false
  → User taps “Use address” / “Import from link”
  → Client checks canImport → false
  → Show paywall (alert or inline card); “Upgrade to Pro” → router.push('/paywall')
  → (If client check were skipped) recordPropertyImport runs
      → INSERT into property_imports
      → Trigger: count = 2, entitlement_active = false → RAISE EXCEPTION
      → Client gets error, limitReached: true → show paywall
```

### 9.3 Purchase Flow (Text)

```
User on paywall
  → Taps “Subscribe” on a package
  → SubscriptionContext.purchase(rawPackage, displayPackage)
      → revenueCat.purchasePackage(rawPackage)
      → RevenueCat SDK: native purchase sheet
  → User completes payment (or cancels / pending)
  → On success: customerInfo returned
      → setCustomerInfo(customerInfo); hasProAccess = true
      → syncSubscriptionStatus(supabase, session.id, true)
      → router.back() (dismiss paywall)
  → useImportLimit refreshes or already has hasProAccess true
  → Next import: recordPropertyImport → trigger sees entitlement_active = true → INSERT allowed
```

### 9.4 Restore Flow

```
User taps “Restore purchases” (paywall or settings)
  → SubscriptionContext.restore()
      → revenueCat.restorePurchases()
      → On success: setCustomerInfo(customerInfo); syncSubscriptionStatus(…)
  → UI updates (Pro badge, unlimited imports); optionally router.back() if on paywall
```

### 9.5 Webhook (Server-Side)

```
RevenueCat sends event (e.g. INITIAL_PURCHASE, RENEWAL, EXPIRATION)
  → revenuecat-webhook Edge Function
  → Validates body; derives user_id (app_user_id), entitlement_active, product_id, store, expires_at
  → Upsert subscription_status
  → Next client INSERT (or same user on another device) sees updated entitlement_active
```

---

## 10. Import-Gating Flow (Detailed)

1. **User lands on Import tab:**  
   `useImportLimit` runs: `getImportCount(supabase)` and `hasProAccess` from SubscriptionContext.  
   Result: `count`, `freeRemaining`, `canImport = (freeRemaining > 0) || hasProAccess`.

2. **UI:**  
   If `!canImport` (at limit and not Pro): show “You’ve used your 2 free imports” card and “Upgrade to Pro”; disable primary import actions or show alert on tap.  
   If `canImport`: show “X of 2 free used” or “Unlimited” and enable actions.

3. **User starts import (e.g. enters address and taps “Use address”):**  
   Handler checks `canImport` again. If false → show paywall, return. If true → continue (geocode, rent estimate, then `recordPropertyImport`).

4. **recordPropertyImport:**  
   Ensure portfolio → insert property → insert `property_imports`.  
   Trigger runs on INSERT: if count ≥ 2 and entitlement_active = false → exception.

5. **If trigger raises:**  
   Client gets error; `importLimits.ts` sets `limitReached` from error code/message.  
   UI: show paywall (and optionally refresh import count).

6. **If insert succeeds:**  
   Return success; client refreshes import count; UI shows success and updates “X of 2 used” or “Unlimited.”

---

## 11. Edge Cases

| Edge case | Handling |
|-----------|----------|
| User at 2 imports, subscription expires (webhook sets entitlement_active = false) | Next import: client may still show “Unlimited” until refresh; recordPropertyImport fails with limitReached; show paywall and refresh. |
| User purchases on device A; opens app on device B | Device B: configureRevenueCat(session.id); getCustomerInfo() returns Pro; syncSubscriptionStatus updates server. Trigger allows imports on B. |
| RevenueCat down when user opens paywall | Offerings/customerInfo null or error; show “No plans” or “Try again.” Do not allow import beyond 2 unless subscription_status already true (e.g. from webhook). |
| User at limit, deletes one property (future feature) | If you add “delete property” and remove a property_import row, count drops; trigger would allow next insert. Client count from getImportCount will reflect new count after refresh. |
| Restore returns “no purchases” | Show explicit message; do not set hasProAccess. User stays free. |
| Pending purchase (e.g. Ask to Buy) | Show “Pending approval”; do not set hasProAccess until RevenueCat sends success; webhook or next getCustomerInfo will update. |
| Web: user has 2 imports, tries 3rd | recordPropertyImport runs; trigger rejects; client shows limit error. Same as native. No purchase path on web. |
| subscription_status row missing (new user, no webhook yet) | Trigger: COALESCE(entitlement_active, false) → false. User limited to 2. After purchase, client sync or webhook creates/updates row. |
| Double-tap “Subscribe” | Disable button while purchasing (purchasingId state in paywall); single purchase call. |
| Session expires during purchase | Auth redirects to login; purchase may complete in background; on next login, configureRevenueCat and getCustomerInfo restore state. |

---

## 12. Purchase Flow Description (Summary)

- **Entry:** User taps “Upgrade to Pro” from import (at limit) or from settings.
- **Screen:** Paywall loads offerings from SubscriptionContext (RevenueCat). Shows monthly/annual (or configured) packages; “Subscribe,” “Restore purchases,” “Done.”
- **Subscribe:** User taps a package → `purchase(rawPackage, displayPackage)` → native IAP sheet → on success, context updates and syncs `subscription_status`, paywall dismisses; on cancel, stay on paywall; on pending, show pending message.
- **Restore:** User taps “Restore purchases” → `restore()` → RevenueCat restore → on success, context updates and syncs, paywall can dismiss; on failure, show error.
- **Already Pro:** If `hasProAccess`, paywall shows “You have Pro” and “Done”; no packages.
- **Web:** Paywall shows “Subscriptions on iOS/Android”; no purchase/restore.

---

## 13. Manual Configuration Steps (Outside Codebase)

1. **Environment variables (Expo):**  
   Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; for native: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`, `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`. Optional: `EXPO_PUBLIC_SENTRY_DSN`.

2. **Supabase:**  
   Run all migrations (including 00016, 00017, 00018) so `property_imports`, `subscription_status`, RLS, and `check_property_import_limit` trigger exist. Deploy Edge Functions; set `REVENUECAT_WEBHOOK_AUTHORIZATION` for revenuecat-webhook.

3. **RevenueCat:**  
   Create project; add iOS/Android apps and products; create entitlement `pro`; set webhook URL to the deployed `revenuecat-webhook` URL; set same auth secret as in Supabase. Ensure app identifies users with Supabase user ID (`app_user_id`) so webhook and client refer to the same user.

4. **Build:**  
   For real IAP, use a development build (`expo prebuild` + `expo run:ios` / `run:android`). Expo Go will not complete real purchases.

5. **App Store / Play Console:**  
   Configure in-app products and link to RevenueCat; complete tax and banking if required.

---

## 14. QA Checklist (Specific to This Blueprint)

After implementing the single change (mount SubscriptionProvider) and verifying existing flows:

- [ ] **Provider mounted:** Log in, open Import tab — no crash; usage line shows “X of 2 used” or “Unlimited.”
- [ ] **Free limit:** As free user, add 2 properties via address; 3rd attempt shows paywall (alert or card) and “Upgrade to Pro” opens paywall.
- [ ] **Server enforcement:** With 2 imports and no Pro, attempt 3rd import (e.g. bypass client check in dev); server returns error and client shows paywall or limit message.
- [ ] **Pro unlimited:** After purchase (sandbox) or restore, hasProAccess true; can add 3rd+ property; no paywall at limit.
- [ ] **Paywall:** From Import (at limit) or Settings, “Upgrade to Pro” opens paywall; packages load (or “No plans” if not configured); Subscribe and Restore work; Done dismisses.
- [ ] **Restore:** Restore purchases restores Pro; UI shows Pro and unlimited; next import succeeds.
- [ ] **Manage subscription:** “Manage subscription” opens platform flow (or fallback URL); web shows message or paywall.
- [ ] **Settings:** Plan, Entitlement, Property imports count correct; Restore and Manage work.
- [ ] **Web:** App loads; Import/Settings/Paywall do not crash; paywall shows “subscriptions on iOS/Android” or similar; 2-import limit still enforced by server if user imports on web.
- [ ] **Auth unchanged:** Login, sign-up, forgot password, sign out work; no regression from SubscriptionProvider.
- [ ] **Error paths:** recordPropertyImport limit error shows paywall; purchase cancel does not show error; restore “no purchases” shows clear message.

---

## 15. Summary: Files Created, Changed, Deleted

| Action | File | Why |
|--------|------|-----|
| **Changed** | `expo-app/app/_layout.tsx` | Mount `SubscriptionProvider` so Import, Settings, and Paywall can call `useSubscription()` without throwing. |
| **Created** | (none) | Core subscription model and UI already implemented. |
| **Deleted** | (none) | No removals. |

This blueprint minimizes rewrites and preserves existing behavior; the only code change required for the free-to-paid model to work end-to-end is adding the provider to the tree.
