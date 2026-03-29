# Free-to-Paid Subscription System — Implementation Summary & QA

## Implementation status

The PropFolio free-to-paid subscription system **is already implemented** in this codebase. All of the following are in place:

- **Auth:** Sign up, log in (email/password, OAuth, magic link, forgot password); session and profile creation.
- **Free tier:** Exactly 2 successful property imports for free users; server-authoritative enforcement via `property_imports` and DB trigger.
- **3rd import blocked:** Server returns `blocked_upgrade_required`; app shows alert and paywall (no silent fail).
- **Paid users:** Unlimited imports via RevenueCat entitlement and `subscription_status.entitlement_active`.
- **In-app purchases:** Native iOS/Android subscriptions through RevenueCat (`react-native-purchases`); centralized in `revenueCat.ts` and `SubscriptionContext`.
- **Restore purchases:** Restore in paywall and Settings; outcome (success / no_purchases / failed) surfaced in UI.
- **Manage subscription:** Platform-correct entry point (RevenueCat management URL or App Store / Play fallback) from paywall (when already Pro) and Settings.
- **Account/Settings:** Current plan, entitlement status, renewal/expiration, remaining free imports; Manage Subscription, Restore, Billing Help; design consistent with existing PropFolio brand.
- **Edge cases:** Cancellation (userCancelled), restore flow, delayed entitlement (“Activating…”), offline (cached subscription state, no premature revoke), expired subscriptions (entitlement inactive, server blocks imports).
- **Loading / empty / error states:** Import (loading, submit, retry, error alerts); paywall (loading plans, fallback, error, purchasing, restoring, entitlement verifying); Settings (loading subscription, error + retry, empty/Pro states).
- **Modular architecture:** AuthContext, SubscriptionContext, ImportResumeContext; useImportLimit, usePaywallState, useExecutePropertyImport; services (importLimits, revenueCat, subscriptionCache, subscriptionStatusDisplay, restorePurchases, subscriptionManagement); no duplicate business logic for “can import” or “is Pro.”

If you are onboarding or verifying behavior, use this summary plus **`docs/AUTH-FREE-TIER-PAYWALL-SUBSCRIPTION-GUIDE.md`** for full setup and file-by-file roles.

---

## 1. Architecture summary

| Concern | Source of truth | Flow |
|--------|------------------|------|
| **Auth** | `AuthContext` (session, signIn, signOut) | Supabase Auth; demo user when env unset. Tabs gate on session; redirect to `/(auth)/login` when unauthenticated. |
| **Usage** | Server: `property_imports` count. Client: `useImportLimit()` (count + hasProAccess → canImport) | `getImportCount(supabase)` + `hasProAccess` from SubscriptionContext. canImport = (freeRemaining > 0) \|\| hasProAccess. |
| **Enforcement** | Database trigger on `property_imports` INSERT | Trigger `check_property_import_limit` allows insert only if count < free_limit or subscription_status.entitlement_active. RPC `record_property_import` returns allowed_free, allowed_paid, blocked_upgrade_required, or failed_*. |
| **Entitlement** | RevenueCat + `SubscriptionContext` | Configure RevenueCat with session.id on sign-in; load offerings and customerInfo; hasProAccess from customerInfo.entitlements.active[pro_access]. After purchase/restore, sync subscription_status.entitlement_active to Supabase. |
| **Paywall** | `usePaywallState()` + `PaywallContent` | Plans from offerings; purchase/restore; verify entitlement before closing; “Activating…” on delay. Shown when blocked (import limit) or from Settings. |
| **Resume after paywall** | `ImportResumeContext` (pendingImport) | Set when result === blocked_upgrade_required; cleared after one successful execute on Import screen. |

**Centralized layers:** RevenueCat is used only through `revenueCat.ts` and `SubscriptionContext`. Import gating goes through `useExecutePropertyImport().execute()` and `recordPropertyImportEnforced()`. No duplicate “can user import?” or “is Pro?” logic outside these.

---

## 2. All files that implement the system

Every file below is part of the current auth / free-tier / paywall / subscription behavior. No files were removed for this feature set; some files had dead code removed inside them (e.g. legacy helpers in `importLimits.ts`).

### Contexts

| File | Why |
|------|-----|
| `expo-app/src/contexts/AuthContext.tsx` | Session, sign-in/up/out, OAuth, magic link, resetPassword, ensureProfile; single source of truth for auth. |
| `expo-app/src/contexts/SubscriptionContext.tsx` | Offerings, customerInfo, hasProAccess, purchase, restore, refresh; configures RevenueCat on session; syncs entitlement to Supabase; cache for offline/error. |
| `expo-app/src/contexts/ImportResumeContext.tsx` | Pending import to resume after paywall; set on blocked_upgrade_required, cleared after one execute. |

### Config

| File | Why |
|------|-----|
| `expo-app/src/config/env.ts` | Validates Supabase env; used by auth and login/sign-up. |
| `expo-app/src/config/billing.ts` | RevenueCat env names, entitlement (pro_access), offering (default), product ID placeholders, feature flags. |
| `expo-app/src/config/legalUrls.ts` | Privacy, Terms, Billing Help URLs for Settings. |

### Services

| File | Why |
|------|-----|
| `expo-app/src/services/supabase.ts` | Supabase client singleton. |
| `expo-app/src/services/profile.ts` | ensureProfile for profiles table after sign-up/session. |
| `expo-app/src/services/importLimits.ts` | getImportCount, syncSubscriptionStatus, recordPropertyImportEnforced, FREE_IMPORT_LIMIT (2), RPC and types. |
| `expo-app/src/services/revenueCat.ts` | Configure, getOfferings, getCustomerInfo, purchasePackage, restorePurchases, hasProAccess, getManagementUrl; native-only lazy load. |
| `expo-app/src/services/offeringsMapper.ts` | Maps RevenueCat offerings to SubscriptionPlan for paywall UI. |
| `expo-app/src/services/subscriptionCache.ts` | Persist/restore subscription snapshot (offline and error resilience). |
| `expo-app/src/services/subscriptionStatusDisplay.ts` | UI-safe subscription status (plan name, renewal, entitlement). |
| `expo-app/src/services/restorePurchases.ts` | Restore outcome types and getRestoreOutcome for paywall/settings. |

### Hooks

| File | Why |
|------|-----|
| `expo-app/src/hooks/useImportLimit.ts` | count, freeRemaining, canImport from server + hasProAccess; dev “simulate at limit” override. |
| `expo-app/src/hooks/usePaywallState.ts` | Paywall UI state: plans, loading, purchasing, restore, entitlement verification; consumes SubscriptionContext. |
| `expo-app/src/hooks/useExecutePropertyImport.ts` | Single entry for import: execute(data, source), isSubmitting; callbacks for success/blocked/retry/error; refresh on success. |

### App / screens

| File | Why |
|------|-----|
| `expo-app/app/_layout.tsx` | AuthProvider → SubscriptionProvider → ImportResumeProvider. |
| `expo-app/app/(tabs)/_layout.tsx` | Tabs; redirect to login when !session; auth loading state. |
| `expo-app/app/(auth)/login.tsx` | Login; forgot password link. |
| `expo-app/app/(auth)/sign-up.tsx` | Sign up; profile via ensureProfile. |
| `expo-app/app/(auth)/forgot-password.tsx` | Forgot password. |
| `expo-app/app/(tabs)/import.tsx` | Import UI; useImportLimit, useExecutePropertyImport, useImportResume; paywall when blocked; resume pending import. |
| `expo-app/app/(tabs)/settings.tsx` | Account, SubscriptionStatusCard, FreeImportsIndicator, Manage Subscription, Restore, Billing Help, Sign out; dev “Simulate at limit.” |
| `expo-app/app/paywall.tsx` | Paywall screen; usePaywallState, PaywallContent; already-Pro and web variants; Manage Subscription when Pro. |

### Features / components / utils

| File | Why |
|------|-----|
| `expo-app/src/features/paywall/PaywallContent.tsx` | Paywall UI: headline, benefits, plan cards, restore, loading/error, entitlement verifying/delayed. |
| `expo-app/src/features/paywall/paywallCopy.ts` | Copy for paywall. |
| `expo-app/src/components/SubscriptionStatusCard.tsx` | Current plan, entitlement, renewal, remaining imports; loading and error states. |
| `expo-app/src/components/FreeImportsIndicator.tsx` | Remaining free imports (or hidden for Pro); loading state. |
| `expo-app/src/utils/subscriptionManagement.ts` | openSubscriptionManagement; platform fallback messages. |
| `expo-app/src/utils/authRedirect.ts` | OAuth/magic link redirect and session from URL. |
| `expo-app/src/features/subscriptions/entitlementPolicy.ts` | Entitlement bootstrap policy (gating); `src/dev/` removed. |

### Backend (Supabase migrations)

| File | Why |
|------|-----|
| `supabase/migrations/00016_propfolio_free_tier_tables.sql` | property_imports, subscription_status (and profiles if missing). |
| `supabase/migrations/00017_propfolio_free_tier_rls_and_guard.sql` | RLS and check_property_import_limit trigger. |
| `supabase/migrations/00018_subscription_status_webhook_columns.sql` | Webhook-related columns. |
| `supabase/migrations/00019_free_tier_usage_counters_and_defaults.sql` | plan_status, free_limit, profile trigger, usage_counters view. |
| `supabase/migrations/00020_record_property_import_rpc.sql` | UNIQUE on property_imports; record_property_import RPC. |

### Docs (reference)

| File | Why |
|------|-----|
| `docs/AUTH-FREE-TIER-PAYWALL-SUBSCRIPTION-GUIDE.md` | Full implementation guide: env, Supabase, RevenueCat, App Store, Play, testing, limitations, launch checklist. |
| `docs/BACKEND-FREE-TIER-DATA-MODEL.md` | Data model and RLS. |
| `docs/IMPORT-ENFORCEMENT-IMPLEMENTATION.md` | RPC and import enforcement. |
| `docs/EXPO-BILLING-SETUP.md` | RevenueCat and billing config. |
| `expo-app/docs/ENV.md` | Env vars. |
| `docs/FREE-TO-PAID-IMPLEMENTATION-SUMMARY.md` | This file. |

---

## 3. Manual setup steps still required (outside the codebase)

1. **Supabase**
   - Create/use project; run migrations 00001, 00016–00020 (and any others your app needs).
   - Enable desired auth methods and set redirect URLs for OAuth/magic link.
   - Optionally add a RevenueCat webhook Edge Function to keep `subscription_status` in sync on renewal/expiry/cancel.

2. **RevenueCat**
   - Create project; add iOS and Android apps; link App Store Connect and Google Play.
   - Create entitlement with identifier **`pro_access`** (must match `billing.ts`).
   - Create offering (e.g. **`default`**); add products from App Store / Play and attach to offering.
   - Copy the **public** app-specific iOS API key into `expo-app/.env`: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`.

3. **App Store Connect**
   - Create subscription products and subscription group; note product IDs.
   - In RevenueCat, add those product IDs to Products and attach to offering; configure App Store Connect API / shared secret per RevenueCat docs.
   - Use Sandbox testers for testing.

4. **Google Play Console**
   - Create subscription products; note product IDs.
   - In RevenueCat, add product IDs and attach to offering; configure Play credentials per RevenueCat docs.
   - Use license testers for testing.

5. **Expo / EAS**
   - For real IAP, use a **development build** (`npx expo prebuild` then `npx expo run:ios` / `run:android`, or EAS Build). Expo Go does not support real in-app purchases.

6. **Env**
   - In `expo-app/.env`: set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for production auth; set RevenueCat keys for iOS/Android subscriptions. Do not commit real keys.

---

## 4. QA checklist (specific to auth, free-tier, paywall, subscriptions)

### Auth

- [ ] Sign up creates a profile; sign in and sign out work; session persists across app restart when Supabase is configured.
- [ ] Forgot password sends email and reset flow works; login shows error and retry when credentials are wrong.
- [ ] With Supabase env unset, app runs with demo user and does not crash; auth UI still renders.

### Free tier and usage

- [ ] New free user: 1st and 2nd property imports succeed; count shows “1 of 2” then “2 of 2” (or equivalent); 3rd attempt is blocked and does not insert a row.
- [ ] On 3rd attempt: server returns `blocked_upgrade_required`; app shows alert and “Upgrade to Pro” opens paywall; no silent failure.
- [ ] Import tab shows correct remaining free imports (or “Unlimited” for Pro); FreeImportsIndicator hides for Pro users.
- [ ] Dev “Simulate at limit” (Settings, __DEV__ only): Import tab shows blocked/paywall behavior; toggling off restores normal behavior.

### Paywall and purchase

- [ ] Paywall opens from blocked import and from Settings; plans load (or fallback message when offline/unavailable).
- [ ] Purchase flow: select plan → native sheet → complete with sandbox/license tester → entitlement verified before paywall closes; “Activating…” appears if verification is delayed.
- [ ] User cancellation: closing purchase sheet does not mark success; paywall remains open.
- [ ] Already Pro: paywall shows “You’re already Pro” and Manage Subscription + Done.

### Restore and manage subscription

- [ ] Restore (paywall and Settings): tap Restore → outcome shown (success / no purchases / failed); subscription status and canImport update on success.
- [ ] Manage Subscription (Settings and paywall when Pro): opens RevenueCat management URL or platform subscription screen; or shows fallback message when link cannot be opened.

### Settings and account

- [ ] Settings shows current plan, entitlement (Active/Inactive), and remaining free imports (or “Unlimited” for Pro).
- [ ] Loading state for subscription: “Loading subscription…” then content or error with retry.
- [ ] Billing Help, Privacy, Terms links work when configured; Update Password and Sign out work.

### Resume after paywall

- [ ] After being blocked and opening paywall: user purchases (or restores) → returns to Import tab → pending import runs once automatically (or via explicit retry); count updates; pending is cleared so the same import is not run again.

### Edge cases and errors

- [ ] Offline: subscription state from cache; we do not revoke Pro on refresh failure; appropriate messaging when network is required.
- [ ] Expired subscription: entitlement inactive; server blocks next import; UI shows Free and remaining free imports correctly.
- [ ] Retryable import failure: “Try again” and non-retryable error messaging shown as designed.

### Build and tooling

- [ ] `npm run typecheck` in expo-app passes when dependencies (e.g. `react-native-purchases`) are installed.
- [ ] iOS and Android development builds run; IAP works in dev build (not in Expo Go).
- [ ] Web: app runs; subscriptions/paywall show web message or no-op; no crash when RevenueCat is not configured.
