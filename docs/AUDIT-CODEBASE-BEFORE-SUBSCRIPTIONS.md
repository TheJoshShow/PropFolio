# Full Codebase Audit Before Subscriptions / Paywall Implementation

**Purpose:** Understand the PropFolio codebase so subscription and paywall work can be integrated safely. No business logic or destructive changes in this audit.

**Scope:** `expo-app/` (Expo/React Native app). Backend: `supabase/` (migrations, Edge Functions). The repo also contains a Swift iOS app in `PropFolio/`; this audit focuses on the **Expo app** as the primary cross-platform client.

---

## 1. Architecture Summary

### 1.1 App Framework and Architecture

- **Framework:** **Expo (SDK 55)** with **React Native 0.83** and **React 19**.
- **Routing:** **expo-router** (file-based). Entry: `expo-router/entry` in `package.json`.
- **State:** React context for auth and subscriptions; no global Redux/MobX. Feature modules in `src/features/*` are mostly barrels or shared libs; UI lives in `app/`.
- **Styling:** StyleSheet, shared `theme` (spacing, fontSizes, fontWeights, colors) and `useThemeColors()`.
- **Platforms:** iOS, Android, web (metro bundler for web).

### 1.2 Expo Workflow: Managed vs Prebuild vs Bare

- **Conclusion: Expo managed (or “prebuild when needed”).**
- **Evidence:**
  - No `ios/` or `android/` directories in `expo-app/` root (no committed native projects).
  - Config is **`app.json`** only (no `app.config.js` / `app.config.ts`). No `plugins` that require custom native code except `expo-router`.
  - **`react-native-purchases`** is present; it requires native code, so the app **must** use a **development build** (e.g. `expo prebuild` + `expo run:ios` / `run:android`) for real in-app purchases. In Expo Go, RevenueCat will not work for purchases (API keys and native module).
- **Summary:** Source is “managed” style; for production IAP you build with prebuild and run on device/simulator. Web runs without native purchases and shows a “subscriptions on iOS/Android” message.

### 1.3 Navigation Structure

| Route | Role |
|-------|------|
| **Root Stack** | `(tabs)` (main app), `(auth)` (login/sign-up/forgot), `paywall`, `update-password`, `modal` |
| **(tabs)** | `index` (Home), `import`, `portfolio`, `settings` |
| **(auth)** | `login`, `sign-up`, `forgot-password` |
| **Other** | `paywall` (standalone), `update-password`, `modal` (generic modal) |

- **Auth gate:** In `(tabs)/_layout.tsx`, when `!isLoading && session === null`, redirect to `/(auth)/login`. When session exists, tabs render. So unauthenticated users only see auth stack; authenticated users see tabs (and can open paywall, update-password, modal).

### 1.4 Auth Flow

- **Provider:** `AuthContext` (`src/contexts/AuthContext.tsx`) in root `_layout.tsx` (`AuthProvider` wraps the app).
- **Supabase:** `getSupabase()` from `src/services/supabase.ts` (AsyncStorage on native, localStorage on web; session persistence and refresh).
- **Methods:** Email/password sign-in and sign-up, OAuth (Google, Apple), magic link, reset password. When Supabase env is missing, app uses a demo user so it stays runnable.
- **Profile:** After sign-in/sign-up and on session load, `ensureProfile()` (`src/services/profile.ts`) upserts `profiles` so FKs (portfolios, subscription_status, usage_events) work.
- **Redirect:** `authRedirect.ts` and `getAuthRedirectUrl()` for OAuth/magic link; on web, `detectSessionInUrl`; on native, `Linking` for auth callback URL.

### 1.5 API Layer

- **Supabase client:** Single instance via `getSupabase()` / `supabase`; used for auth, `profiles`, `property_imports`, `portfolios`, `properties`, `subscription_status`.
- **Edge Functions:** Invoked via `supabase.functions.invoke()` from `src/services/edgeFunctions.ts`: `geocode-address`, `places-autocomplete`, `rent-estimate`, `openai-summarize`, `census-data`. All go through Supabase (no direct paid API calls from client per project rules).

### 1.6 Property Import Flow

- **Screen:** `app/(tabs)/import.tsx`.
- **Limit:** `useImportLimit()` hook (`src/hooks/useImportLimit.ts`) returns `count`, `freeRemaining`, `canImport`, `isLoading`, `refresh`. `canImport = (freeRemaining > 0) || hasProAccess`.
- **Backend:** `src/services/importLimits.ts`: `getImportCount(supabase)` (count rows in `property_imports` for user), `recordPropertyImport(...)` (ensure portfolio → insert `properties` → insert `property_imports`; server trigger enforces 2-import limit), `syncSubscriptionStatus(supabase, userId, entitlementActive)` (upsert `subscription_status`), `addressToImportData()`, `FREE_IMPORT_LIMIT = 2`.
- **UI behavior:** Paste link (Zillow/Redfin parsed but “full import from link coming soon”) or enter address → geocode + rent estimate → `recordPropertyImport` → on success refresh import count; on `limitReached` or when `!canImport` show alert and/or card with “Upgrade to Pro” → `router.push('/paywall')`.

### 1.7 Settings / Account Screens

- **Settings:** `app/(tabs)/settings.tsx`. Uses `useAuth`, `useSubscription`, `useImportLimit`. Shows email, plan (Free/Pro), entitlement status, property imports count; “Manage subscription”, “Restore purchases”, “Update password”, “Log out”; Privacy Policy and Terms links (`src/config/legalUrls.ts`).
- **Update password:** `app/update-password.tsx` (Supabase `updateUser({ password })`).
- **Manage subscription:** `src/utils/subscriptionManagement.ts` — RevenueCat `getManagementUrl()` or fallback to Apple/Google subscription URLs; web returns false and caller shows paywall or message.

### 1.8 Premium / Feature Gating Logic

- **RevenueCat:** `src/services/revenueCat.ts` — configure with Supabase user ID, get offerings, get customer info, purchase, restore, `hasProAccess(customerInfo)` (entitlement id `pro`), `getManagementUrl()`. Web: no-op or safe defaults.
- **Subscription context:** `src/contexts/SubscriptionContext.tsx` — offerings, customerInfo, hasProAccess, isLoading, error, refresh, purchase, restore, clearError. Calls `configureRevenueCat(session.id)` when session exists; syncs `subscription_status` via `syncSubscriptionStatus(getSupabase(), session.id, hasProAccess)` when customerInfo/hasProAccess changes.
- **Import gating:** Import screen and `useImportLimit` use `hasProAccess` from `useSubscription()`; when at limit and not Pro, paywall is shown (alert + card + “Upgrade to Pro”).
- **Paywall screen:** `app/paywall.tsx` — shows packages from offerings, Subscribe, Restore, Done; if already Pro shows “You have Pro”; on web shows “subscriptions on iOS/Android” message.

---

## 2. Relevant Files by Category

### 2.1 Navigation and App Shell

| File | Purpose |
|------|--------|
| `expo-app/app/_layout.tsx` | Root layout: fonts, crash reporting, AuthProvider, Stack (tabs/auth/paywall/update-password/modal). **SubscriptionProvider is imported but not used.** |
| `expo-app/app/(tabs)/_layout.tsx` | Tab layout: auth gate (redirect to login if no session), tabs Home/Import/Portfolio/Settings. |
| `expo-app/app/(auth)/_layout.tsx` | Auth stack: login, sign-up, forgot-password. |
| `expo-app/app/(tabs)/index.tsx` | Home screen. |
| `expo-app/app/(tabs)/import.tsx` | Property import screen; uses useImportLimit, useSubscription (via useImportLimit). |
| `expo-app/app/(tabs)/portfolio.tsx` | Portfolio list (empty state; “Phase 6 will wire Supabase”). |
| `expo-app/app/(tabs)/settings.tsx` | Settings/account; uses useAuth, useSubscription, useImportLimit. |
| `expo-app/app/(auth)/login.tsx` | Login (email, OAuth, magic link). |
| `expo-app/app/(auth)/sign-up.tsx` | Sign up (email, name, OAuth). |
| `expo-app/app/(auth)/forgot-password.tsx` | Forgot password. |
| `expo-app/app/paywall.tsx` | Paywall (offerings, purchase, restore). |
| `expo-app/app/update-password.tsx` | Update password. |
| `expo-app/app/modal.tsx` | Generic modal. |
| `expo-app/app/+not-found.tsx` | 404. |

### 2.2 Auth and Profile

| File | Purpose |
|------|--------|
| `expo-app/src/contexts/AuthContext.tsx` | Session, signIn, signUp, OAuth, magic link, resetPassword, updatePassword, signOut, ensureProfile on session. |
| `expo-app/src/services/supabase.ts` | getSupabase(), supabase singleton; auth storage (AsyncStorage / localStorage). |
| `expo-app/src/services/profile.ts` | ensureProfile(supabase, userId, metadata) — upsert profiles. |
| `expo-app/src/config/env.ts` | validateAuthEnv(), isAuthEnvConfigured(). |
| `expo-app/src/utils/authRedirect.ts` | getAuthRedirectUrl(), getSessionParamsFromUrl(), isAuthCallbackUrl(). |
| `expo-app/src/utils/authErrors.ts` | getAuthErrorMessage() for user-facing auth errors. |

### 2.3 Subscriptions and Paywall

| File | Purpose |
|------|--------|
| `expo-app/src/contexts/SubscriptionContext.tsx` | SubscriptionProvider, useSubscription; RevenueCat configure/offerings/customerInfo/purchase/restore; syncSubscriptionStatus. **Not mounted in app tree.** |
| `expo-app/src/services/revenueCat.ts` | configureRevenueCat, logOutRevenueCat, getOfferings, getCustomerInfo, hasProAccess, purchasePackage, restorePurchases, getManagementUrl; PRO_ENTITLEMENT_ID = 'pro'. |
| `expo-app/src/services/importLimits.ts` | getImportCount, syncSubscriptionStatus, recordPropertyImport, ensureDefaultPortfolio, addressToImportData, FREE_IMPORT_LIMIT. |
| `expo-app/src/hooks/useImportLimit.ts` | useImportLimit() — getImportCount + hasProAccess; canImport = freeRemaining > 0 \|\| hasProAccess. |
| `expo-app/src/utils/subscriptionManagement.ts` | openSubscriptionManagement() — RevenueCat management URL or Apple/Google fallback. |
| `expo-app/app/paywall.tsx` | Paywall UI (see above). |

### 2.4 Property Import

| File | Purpose |
|------|--------|
| `expo-app/app/(tabs)/import.tsx` | Import UI (see above). |
| `expo-app/src/services/importLimits.ts` | See above. |
| `expo-app/src/services/edgeFunctions.ts` | geocodeAddress, placesAutocomplete, rentEstimate, openaiSummarize, censusData. |
| `expo-app/src/lib/parsers/` | parseZillowUrl, parseRedfinUrl, parseAddress (addressParser, zillowUrlParser, redfinUrlParser). |

### 2.5 Onboarding, Settings, Monetization

| File | Purpose |
|------|--------|
| `expo-app/app/(tabs)/settings.tsx` | Account, subscription, security, legal. |
| `expo-app/src/config/legalUrls.ts` | getPrivacyPolicyUrl(), getTermsUrl(). |
| `expo-app/src/services/analytics.ts` | trackEvent (e.g. paywall_viewed, import_completed). |
| `expo-app/src/features/onboarding/index.ts` | Barrel only (`export type {}`). |
| `expo-app/src/features/settings/index.ts` | Barrel only. |
| `expo-app/src/features/subscriptions/index.ts` | Barrel only. |

### 2.6 Shared UI and Theme

| File | Purpose |
|------|--------|
| `expo-app/src/components/` | Button, Card, TextInput, Chip, useThemeColors; index re-exports. |
| `expo-app/src/theme/` | spacing, fontSizes, fontWeights, colors, typography. |
| `expo-app/src/utils/responsive.ts` | responsiveContentContainer. |

### 2.7 Backend (Supabase)

| File | Purpose |
|------|--------|
| `supabase/migrations/` | profiles, subscriptions, property_imports, subscription_status, RLS, check_property_import_limit trigger, etc. |
| `supabase/functions/revenuecat-webhook/` | Edge Function: RevenueCat webhook → upsert subscription_status. |
| `supabase/functions/` (others) | geocode-address, places-autocomplete, rent-estimate, openai-summarize, census-data. |

---

## 3. Risks and Likely Bug Sources

### 3.1 Critical: SubscriptionProvider Not Mounted

- **Location:** `expo-app/app/_layout.tsx` imports `SubscriptionProvider` but the tree is only `<AuthProvider><RootLayoutNav /></AuthProvider>`. `SubscriptionProvider` is never rendered.
- **Impact:** Any screen that calls `useSubscription()` (import, settings, paywall) will throw: “useSubscription must be used within SubscriptionProvider.” So **logged-in users will crash** on Import, Settings, or Paywall.
- **Fix:** Wrap the authenticated area with `SubscriptionProvider`. For example, wrap the Stack (or the (tabs) branch) with `SubscriptionProvider` inside `AuthProvider`, so that paywall, update-password, and modal are also under it if they use subscription. Recommended: wrap `RootLayoutNav` content (e.g. the Stack) with `SubscriptionProvider` so all routes that need subscription have it.

### 3.2 Auth / Session Race

- Tabs layout redirects when `!isLoading && session === null`. If session loads a bit late, user could briefly see loading then tabs; generally acceptable. No change suggested unless you see flicker to login.

### 3.3 Import Count API

- `importLimits.ts` uses `supabase.from('property_imports').select('*', { count: 'exact', head: true }).eq('user_id', user.id)`. Supabase JS returns `{ count, error }`; code uses `count` and handles error. Correct for current Supabase JS.

### 3.4 Subscription Sync and Webhook

- **Client:** `SubscriptionContext` calls `syncSubscriptionStatus(getSupabase(), session.id, hasProAccess)` when customerInfo/hasProAccess changes, writing to `subscription_status`. So the app pushes entitlement from RevenueCat to Supabase for the current device.
- **Server:** RevenueCat webhook (`revenuecat-webhook`) also upserts `subscription_status` by `user_id` (app_user_id). So you have two writers: client (after purchase/restore) and webhook (on all subscription events). Both are upserts; ensure `app_user_id` in RevenueCat is set to Supabase user UUID so they match. No conflict if same user_id.

### 3.5 Web and Expo Go

- On web and in Expo Go, RevenueCat is not configured for purchase; paywall shows “subscriptions on iOS/Android” or “No plans available.” Restore/Manage are disabled or no-op. Acceptable for MVP.

### 3.6 Obsolete / Duplicate / Dead Code

- **Empty barrels:** `src/features/auth/index.ts`, `src/features/subscriptions/index.ts` (and possibly others under `features/`) only contain `export type {}`. They are not dead code that breaks anything; they are placeholders. Safe to leave or later replace with real exports.
- **Portfolio screen:** Does not yet load from Supabase; comment says “Phase 6 will wire Supabase.” No conflict with subscriptions.
- **PropFolio (Swift):** Separate iOS app in `PropFolio/`; not used by the Expo app. No interaction with expo-app subscription logic.
- **`_archive_review/`:** Contains a `web/` package; likely old or experimental. Do not delete without explicit confirmation; list as “archive” in any cleanup list.

---

## 4. Billing and Subscription Packages

| Package | Status | Notes |
|--------|--------|-------|
| **react-native-purchases** | Installed (^9.12.0) | RevenueCat SDK. Required for native IAP. |
| **expo-iap** / **expo-in-app-purchases** | Not installed | Not used; RevenueCat is the IAP layer. |
| **Other billing packages** | None | No Stripe or other client billing SDKs in package.json. |

**Recommendation:** No package removal for subscription work. If you add anything, consider only types or test helpers; no new billing SDKs unless you introduce a second payment path (e.g. web Stripe).

---

## 5. Supabase Auth and Database

| Area | Status | Notes |
|------|--------|-------|
| **Supabase client** | Implemented | getSupabase(), auth persistence, used by auth and data. |
| **Auth** | Implemented | Email/password, OAuth, magic link, reset password, session listener, profile ensure. |
| **Database (profiles)** | Implemented | ensureProfile upsert on sign-in/sign-up. |
| **Database (property_imports, properties, portfolios)** | Implemented | recordPropertyImport, getImportCount; RLS and trigger on backend. |
| **Database (subscription_status)** | Implemented | Client: syncSubscriptionStatus in SubscriptionContext; server: revenuecat-webhook Edge Function. |
| **Edge Functions** | Implemented | Geocode, places, rent, openai, census invoked from client. |

**Conclusion:** Supabase auth and database are in place and used for auth, profiles, import limit, and subscription status. The only critical gap is that **SubscriptionProvider is not mounted**, so subscription-dependent screens crash.

---

## 6. Recommended File-by-File Implementation Order

Order below is for **minimal, safe integration** (fix the provider and any follow-on fixes). No new subscription features yet.

1. **`expo-app/app/_layout.tsx`**  
   - **Change:** Wrap the tree that contains paywall and tabs with `SubscriptionProvider` (e.g. wrap `RootLayoutNav`’s children or the Stack with `SubscriptionProvider` so (tabs), paywall, update-password, modal are inside it).  
   - **Why:** Fixes crash when any screen calls `useSubscription()`.

2. **No other file changes required** for “subscriptions/paywall logic to run as already implemented.” Optional follow-ups:
   - **`expo-app/app/(tabs)/_layout.tsx`:** If you prefer SubscriptionProvider to wrap only authenticated routes, you could render `SubscriptionProvider` only around the tab content when `session != null` (and still allow paywall to be reachable from auth flow if needed). Same net effect: paywall, import, settings must be under SubscriptionProvider.

3. **Manual / config (no code list):**
   - Ensure `.env` (or Expo env) has `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and for native builds `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`.
   - RevenueCat dashboard: products/entitlements (e.g. `pro`), webhook URL pointing to `revenuecat-webhook` Edge Function, `app_user_id` = Supabase user id when identifying users.
   - Supabase: run migrations so `subscription_status`, `property_imports`, and trigger exist; deploy `revenuecat-webhook` and set `REVENUECAT_WEBHOOK_AUTHORIZATION` if used.

---

## 7. Packages to Add or Remove

- **Add:** None for the minimal fix (mount SubscriptionProvider).
- **Remove:** None. Do not remove `react-native-purchases` or Supabase; they are required for current design.

---

## 8. Manual Configuration Steps (Outside Codebase)

1. **Environment:** Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; for native: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`.
2. **Supabase:** Apply all migrations; deploy Edge Functions (including `revenuecat-webhook`); set Edge Function secrets (`REVENUECAT_WEBHOOK_AUTHORIZATION`, etc.).
3. **RevenueCat:** Create project, configure iOS/Android apps and products, entitlement id `pro`; set webhook to your `revenuecat-webhook` URL; use Supabase user id as `app_user_id` when logging in users.
4. **Build:** For real IAP, use a development build (`expo prebuild` + `expo run:ios` / `run:android`), not Expo Go.

---

## 9. QA Checklist (Specific to This Audit and the Recommended Fix)

- [ ] **SubscriptionProvider mounted:** After wrapping with `SubscriptionProvider`, log in and open **Import** tab — no crash, import count and “Upgrade to Pro” (if at limit) appear.
- [ ] **Settings:** Open **Settings** — no crash; Plan/Entitlement/Property imports and Manage subscription / Restore purchases visible.
- [ ] **Paywall:** From Import (at limit) or Settings, tap “Upgrade to Pro” → Paywall screen opens; on native with RevenueCat configured, packages load (or “No plans” if no offerings); Restore and Done work.
- [ ] **Import limit:** As free user, add 2 properties via address; 3rd attempt shows limit alert/card and “Upgrade to Pro”; after “purchasing” Pro (sandbox) or restoring, can add more.
- [ ] **Auth unchanged:** Login, sign-up, forgot password, sign out still work; no regression from adding SubscriptionProvider.
- [ ] **Web:** App loads; paywall shows “subscriptions on iOS/Android” or similar; no crash on Import/Settings (subscription state may be “unavailable” or default).
- [ ] **Expo Go (optional):** App runs in Expo Go; Import/Settings/Paywall do not crash (RevenueCat may not configure; paywall may show no plans or web message).

---

## 10. Summary Table

| Item | Finding |
|------|--------|
| **App type** | Expo (SDK 55) + React Native + expo-router |
| **Expo workflow** | Managed-style source; dev/build with prebuild for IAP |
| **Navigation** | File-based: (tabs), (auth), paywall, update-password, modal |
| **Auth** | Supabase Auth + AuthContext; profile ensure; OAuth/magic link |
| **API** | Supabase client + Edge Functions (geocode, places, rent, openai, census) |
| **Import flow** | import.tsx + useImportLimit + importLimits + recordPropertyImport |
| **Settings/account** | settings.tsx, update-password, legal URLs |
| **Premium gating** | SubscriptionContext, revenueCat, paywall.tsx, useImportLimit; 2-import limit + Pro unlimited |
| **RevenueCat** | react-native-purchases installed; revenueCat.ts and paywall implemented |
| **Supabase** | Auth and DB implemented; subscription_status client sync + webhook |
| **Critical bug** | SubscriptionProvider not mounted → crash on Import/Settings/Paywall when logged in |
| **Safe first change** | Mount SubscriptionProvider in `_layout.tsx` around Stack (or authenticated routes) |

This document is the **detailed implementation plan** for integrating subscriptions/paywall into this codebase: fix the provider mount first, then rely on existing logic; no business logic or destructive edits required for the minimal fix.

---

## 11. Files Created, Changed, or Deleted in This Audit

| Action | File | Why |
|--------|------|-----|
| **Created** | `docs/AUDIT-CODEBASE-BEFORE-SUBSCRIPTIONS.md` | This audit deliverable: architecture summary, file lists, risks, implementation order, packages, manual steps, QA checklist. |

No app or backend files were changed or deleted. No destructive edits were made; the codebase is only documented for the upcoming subscription/paywall work.
