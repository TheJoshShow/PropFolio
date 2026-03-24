# PropFolio: Auth, Free-Tier, Paywall & Subscription Implementation Guide

This guide describes **exactly** how the current PropFolio codebase implements authentication, free-tier gating, paywall, and subscriptions. Use it for onboarding, debugging, and launch prep.

---

## 1. Architecture overview

- **Auth:** Supabase Auth (email/password, OAuth, magic link, forgot password). Session is the single source of truth in `AuthContext`. When Supabase env vars are unset, the app runs in demo mode (in-memory demo user).
- **Usage (free tier):** Server-authoritative. Count = rows in `property_imports` per user. Free limit = 2. `canImport` = `(freeRemaining > 0) || hasProAccess`. Enforced by DB trigger on `property_imports` INSERT; client gates UI and handles `blocked_upgrade_required` by showing the paywall.
- **Entitlement (Pro):** RevenueCat is the source of truth. `SubscriptionContext` holds `hasProAccess`, offerings, and customerInfo. After purchase/restore, the client syncs `subscription_status.entitlement_active` to Supabase so the server trigger allows the next import without waiting for a webhook.
- **Paywall:** Modal screen at `/paywall`. Uses `usePaywallState` (plans, purchase, restore, entitlement verification). Shown when the user hits the import limit (alert + “Upgrade to Pro”) or from Settings. After purchase, entitlement is verified before closing; “Activating…” is shown if verification is delayed.
- **Resume after paywall:** When the server returns `blocked_upgrade_required`, the app stores the pending import in `ImportResumeContext`. After the user upgrades, the Import screen runs that import once and clears the pending state.

**Data flow (high level):**

1. User signs in → `AuthContext` session set → `SubscriptionContext` configures RevenueCat with `session.id` and loads offerings/customerInfo.
2. Import tab: `useImportLimit()` = server count + `hasProAccess` → `canImport`. User adds property → `useExecutePropertyImport().execute()` → `recordPropertyImportEnforced()` (create property + RPC) → server returns `allowed_*` / `blocked_upgrade_required` / `failed_*`.
3. On `blocked_upgrade_required`: set `pendingImport` in `ImportResumeContext`, show alert, open paywall. On purchase success: sync `subscription_status`, refresh import limit; user can retry the pending import from the Import screen.

---

## 2. Key files and responsibilities

| Layer | File | Responsibility |
|-------|------|----------------|
| **Auth** | `expo-app/src/contexts/AuthContext.tsx` | Session, signIn, signUp, signOut, OAuth, magic link, resetPassword, updatePassword; ensureProfile on session; single source of truth for auth. |
| | `expo-app/src/config/env.ts` | `validateAuthEnv()`, `isAuthConfigured()` for Supabase URL and anon key. |
| | `expo-app/src/services/supabase.ts` | Supabase client singleton (null when env unset). |
| | `expo-app/src/services/profile.ts` | `ensureProfile(supabase, userId, metadata)` — upsert `profiles` row. |
| **Usage** | `expo-app/src/hooks/useImportLimit.ts` | Single source of truth for usage: count, freeRemaining, canImport; combines server count with `hasProAccess`; dev override for “simulate at limit.” |
| | `expo-app/src/services/importLimits.ts` | `getImportCount()`, `syncSubscriptionStatus()`, `recordPropertyImportEnforced()`, `FREE_IMPORT_LIMIT` (2), types and RPC call. |
| **Entitlement** | `expo-app/src/contexts/SubscriptionContext.tsx` | Single source of truth for hasProAccess, offerings, customerInfo; configure RevenueCat on session; refresh on app foreground; cache for offline/error; purchase/restore. |
| | `expo-app/src/services/revenueCat.ts` | Configure, getOfferings, getCustomerInfo, purchasePackage, restorePurchases, hasProAccess, getManagementUrl; lazy-loads native module on iOS/Android only. |
| | `expo-app/src/config/billing.ts` | Env var names for RevenueCat keys; entitlement ID `pro_access`; offering ID `default`; product ID placeholders; feature flags. |
| **Paywall** | `expo-app/app/paywall.tsx` | Paywall screen; uses `usePaywallState` and `PaywallContent`; track events; Manage Subscription link. |
| | `expo-app/src/hooks/usePaywallState.ts` | Single source of truth for paywall UI state: plans, loading, purchasing, restore, entitlement verification; consumes SubscriptionContext. |
| | `expo-app/src/features/paywall/PaywallContent.tsx` | Headline, benefits, plan cards, restore, footer. |
| | `expo-app/src/services/offeringsMapper.ts` | Maps RevenueCat offerings to `SubscriptionPlan` for display. |
| **Resume** | `expo-app/src/contexts/ImportResumeContext.tsx` | Single source of truth for pending import to resume after paywall; set on `blocked_upgrade_required`, cleared after one execute. |
| **Import flow** | `expo-app/src/hooks/useExecutePropertyImport.ts` | Central gating: `execute(data, source)` + isSubmitting; callbacks for success/blocked/retry/error; refresh usage on success. |
| | `expo-app/app/(tabs)/import.tsx` | Import UI; uses useImportLimit, useExecutePropertyImport, useImportResume; shows paywall when blocked. |
| **Settings** | `expo-app/app/(tabs)/settings.tsx` | Account, subscription status, Manage Subscription, Restore, Billing Help, Update Password, Sign out; FreeImportsIndicator; dev “Simulate at limit” toggle. |
| **Navigation** | `expo-app/app/_layout.tsx` | Root layout: `initMonitoring()` then AuthProvider → SubscriptionProvider → ImportResumeProvider. |
| | `expo-app/app/(tabs)/_layout.tsx` | Tabs; redirect to `/(auth)/login` when !session; auth loading state. |
| **Supporting** | `expo-app/src/utils/subscriptionManagement.ts` | openSubscriptionManagement (RevenueCat URL or App Store / Play fallback). |
| | `expo-app/src/services/subscriptionCache.ts` | Persist/restore subscription snapshot for offline and error resilience. |
| | `expo-app/src/services/subscriptionStatusDisplay.ts` | UI-safe subscription status (plan name, renewal). |
| | `expo-app/src/services/restorePurchases.ts` | Restore outcome types and getRestoreOutcome for paywall/settings. |
| | `expo-app/src/dev/subscriptionDebugOverrides.ts` | Dev-only: “Simulate at limit” flag for QA (no-op in production). |
| | `expo-app/src/config/legalUrls.ts` | getPrivacyPolicyUrl, getTermsUrl, getBillingHelpUrl (env overrides). |

---

## 3. Environment variables required

All client-side variables must be prefixed with `EXPO_PUBLIC_`. Set in `expo-app/.env` (copy from `.env.example`); do not commit real keys.

| Variable | Required for | Where to get it |
|----------|--------------|------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Real auth and DB | Supabase Dashboard → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Real auth and DB | Supabase Dashboard → Project Settings → API → anon public key |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | iOS subscriptions | RevenueCat Dashboard → Project → API Keys → Public (iOS) |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Optional (Settings link) | Default: https://propfolio.app/privacy |
| `EXPO_PUBLIC_TERMS_URL` | Optional (Settings link) | Default: https://propfolio.app/terms |
| `EXPO_PUBLIC_BILLING_HELP_URL` | Optional (Settings Billing Help) | Your FAQ or support URL |

If both Supabase vars are missing, the app uses a demo user and no real auth. RevenueCat keys are platform-specific; on web, subscriptions are not configured (app still runs).

---

## 4. Supabase setup required

1. **Project:** Create or use an existing Supabase project; get URL and anon key (see §3).
2. **Migrations:** Apply in order. Auth/free-tier/subscription-relevant migrations:
   - `00001_create_profiles.sql` — profiles table.
   - `00016_propfolio_free_tier_tables.sql` — `property_imports`, `subscription_status` (and profiles if missing).
   - `00017_propfolio_free_tier_rls_and_guard.sql` — RLS on `property_imports` and `subscription_status`; trigger `check_property_import_limit` on `property_imports` INSERT.
   - `00018_subscription_status_webhook_columns.sql` — product_id, store, expires_at, last_synced_at.
   - `00019_free_tier_usage_counters_and_defaults.sql` — plan_status, free_limit; profile trigger for new-user defaults; usage_counters view; guard uses free_limit.
   - `00020_record_property_import_rpc.sql` — UNIQUE (user_id, property_id) on property_imports; RPC `record_property_import(p_property_id, p_source)` returning status (allowed_free, allowed_paid, blocked_upgrade_required, failed_retryable, failed_nonretryable).
3. **Auth:** Enable desired auth methods in Supabase Dashboard (Email, Google, Apple, Magic Link, etc.). Configure redirect URLs for OAuth and magic links to match your app (see `expo-app/src/utils/authRedirect.ts` and auth docs).
4. **RLS:** Policies are created by the migrations above. Users can only read/write their own `property_imports` and `subscription_status`; the trigger enforces the limit on INSERT.
5. **RevenueCat webhook (optional but recommended):** To keep `subscription_status` in sync when subscriptions change (renewal, expiry, cancel), add a Supabase Edge Function that receives RevenueCat webhooks and upserts `subscription_status`. If you do not set a webhook, the client still syncs after purchase/restore so the next import can succeed.

---

## 5. RevenueCat setup required

1. **Project & apps:** Create a RevenueCat project; add iOS and Android apps; link App Store Connect and Google Play Console (see RevenueCat docs).
2. **Entitlement:** In RevenueCat Dashboard → Entitlements, create an entitlement. The app uses the identifier **`pro_access`** (see `expo-app/src/config/billing.ts`: `ENTITLEMENT_PRO_ACCESS`). Use the same identifier in the dashboard.
3. **Offering:** In Offerings, create an offering (e.g. identifier **`default`**). This must match `OFFERING_IDENTIFIER_DEFAULT` in `billing.ts`.
4. **Products:** In RevenueCat → Products, add your subscription product IDs (from App Store Connect and Google Play Console). Attach them to the default offering (e.g. monthly and annual packages). Package identifiers (e.g. `$rc_monthly`, `$rc_annual`) are configured in the dashboard and returned at runtime via `getOfferings()`.
5. **API key:** In RevenueCat → Project → API Keys, copy the **public** app-specific iOS API key into `.env` as `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`.
6. **App User ID:** The app sets RevenueCat’s app user ID to the Supabase user ID (`session.id`) on sign-in and clears it on sign-out. No extra configuration needed.

---

## 6. App Store Connect setup required

1. **App:** Create or use the app record; complete agreements and tax/banking if needed for paid apps.
2. **In-App Purchases:** Create subscription products (e.g. monthly and annual). Note the **Product IDs** (e.g. `com.propfolio.premium.monthly`, `com.propfolio.premium.annual`). You can set placeholders in `billing.ts` for reference; live prices come from RevenueCat at runtime.
3. **Subscription group:** Put subscriptions in a subscription group so users can switch between monthly/annual as needed.
4. **RevenueCat:** In RevenueCat, add these product IDs to Products and attach them to your offering. Configure App Store Connect API key / shared secret in RevenueCat so RevenueCat can validate receipts (see RevenueCat docs).
5. **Sandbox:** Use Sandbox testers in App Store Connect for testing purchases without going live.

---

## 7. Google Play Console setup required

1. **App:** Create or use the app; complete store listing and content rating as required.
2. **Monetize → Subscriptions:** Create subscription products (e.g. monthly and annual). Note the **Product IDs**. Link the app to a merchant account if not already.
3. **RevenueCat:** In RevenueCat, add these product IDs to Products and attach them to your offering. Configure Google Play service account / credentials in RevenueCat per RevenueCat docs.
4. **Testing:** Use license testers in Play Console to test purchases without charging real users.

---

## 8. Testing steps

- **Auth:** Sign up (email/password); confirm profile exists in `profiles`. Sign out; sign in again. Try “Forgot password” and magic link if enabled. With Supabase vars unset, confirm demo user and that app does not crash.
- **Free tier:** As a new user (free), add 2 properties; both should succeed. On the 3rd attempt, the server should return `blocked_upgrade_required`; the app should show an alert and “Upgrade to Pro” opening the paywall; no new row in `property_imports`.
- **Usage display:** On Import tab, confirm “X of 2 free imports used” (or “Unlimited (Pro)” when hasProAccess). After upgrading, confirm unlimited.
- **Paywall:** Open from blocked import and from Settings. Load offerings (or fallback message if offline). Purchase with a sandbox/license tester; confirm success and that entitlement is verified before closing; confirm “Activating…” if verification is delayed.
- **Restore:** On a device that previously purchased, tap Restore; confirm Pro is restored and subscription status updates.
- **Resume after paywall:** Hit limit → paywall → purchase (or restore) → go back to Import; confirm the pending import runs once and count/UI update; confirm pending is cleared so the same import is not run again.
- **Manage Subscription:** In Settings, tap Manage Subscription; confirm RevenueCat management URL or platform subscription screen opens (or fallback message on unsupported platform).
- **Dev override:** In __DEV__, enable “Simulate at limit” in Settings; confirm Import tab shows blocked/paywall behavior without using real imports; disable and confirm normal behavior.

---

## 9. Known limitations

- **Web:** Subscriptions are not configured on web; RevenueCat is not initialized; purchase/restore show a message or no-op. Auth (Supabase) works on web when env is set.
- **Expo Go:** Real in-app purchases do not work in Expo Go. Use a development build (`npx expo prebuild` then `npx expo run:ios` / `run:android`) for IAP testing.
- **Entitlement delay:** After purchase, RevenueCat can take a few seconds to return updated customerInfo. The app shows “Activating…” and verifies entitlement before closing the paywall; if verification times out, a message is shown and the user can close (Pro will appear after refresh).
- **Offline:** Subscription state is cached; we do not revoke Pro on refresh failure. If the user goes offline and never had Pro, they still see Free until the server/RevenueCat are reachable again.
- **Single offering:** The app uses one offering (`default`). A/B testing or multiple offerings would require UI and config changes.

---

## 10. Launch checklist

- [ ] Supabase: All migrations applied; RLS and trigger tested; auth methods and redirect URLs configured.
- [ ] RevenueCat: Entitlement `pro_access`, offering `default`, products attached; iOS and Android API keys in `.env`.
- [ ] App Store Connect: Subscription products and group created; RevenueCat linked; sandbox testers used for testing.
- [ ] Google Play Console: Subscription products created; RevenueCat linked; license testers used for testing.
- [ ] Env: `EXPO_PUBLIC_SUPABASE_*` and `EXPO_PUBLIC_REVENUECAT_*` set for production builds; no secrets committed.
- [ ] Legal: Privacy and Terms URLs (env or defaults) and Billing Help link if desired.
- [ ] QA: Full flow (sign up → 2 imports → block → paywall → purchase → resume import; restore; manage subscription).
- [ ] Build: Ship via development build or EAS; Expo Go is not suitable for IAP.

---

## 11. File list (created, changed, or deleted)

This section lists files that are **part of** the auth, free-tier, paywall, and subscription system in the **current** codebase. It is not a full git history; it is a snapshot of “what exists and why” for this feature set.

**No files were deleted** in the cleanup that preceded this guide. Dead code was removed only inside `expo-app/src/services/importLimits.ts` (legacy `RecordImportResult`, `recordPropertyImport()`, `getFreeImportsUsageCopy()`).

| File | Role / why it exists |
|------|----------------------|
| **Contexts** | |
| `expo-app/src/contexts/AuthContext.tsx` | Single source of truth for session and sign-in/out; ensureProfile; demo user when Supabase unset. |
| `expo-app/src/contexts/SubscriptionContext.tsx` | Single source of truth for entitlement (hasProAccess) and subscription state; RevenueCat configure/refresh/purchase/restore; cache for offline/error. |
| `expo-app/src/contexts/ImportResumeContext.tsx` | Single source of truth for pending import to resume after paywall. |
| **Config** | |
| `expo-app/src/config/env.ts` | Validates Supabase env vars; used by auth and login/sign-up screens. |
| `expo-app/src/config/billing.ts` | RevenueCat env names, entitlement/offering/product IDs, feature flags. |
| `expo-app/src/config/legalUrls.ts` | Privacy, Terms, Billing Help URLs (env overrides). |
| **Services** | |
| `expo-app/src/services/supabase.ts` | Supabase client; null when env unset. |
| `expo-app/src/services/profile.ts` | ensureProfile for profiles table. |
| `expo-app/src/services/importLimits.ts` | getImportCount, syncSubscriptionStatus, recordPropertyImportEnforced, FREE_IMPORT_LIMIT. |
| `expo-app/src/services/revenueCat.ts` | Configure, offerings, customerInfo, purchase, restore, hasProAccess, getManagementUrl; native-only lazy load. |
| `expo-app/src/services/offeringsMapper.ts` | Map RevenueCat offerings to SubscriptionPlan for UI. |
| `expo-app/src/services/subscriptionCache.ts` | Persist/restore subscription snapshot. |
| `expo-app/src/services/subscriptionStatusDisplay.ts` | UI-safe subscription status. |
| `expo-app/src/services/restorePurchases.ts` | Restore outcome types and getRestoreOutcome. |
| **Hooks** | |
| `expo-app/src/hooks/useImportLimit.ts` | Usage state: count, freeRemaining, canImport; combines server + hasProAccess; dev override. |
| `expo-app/src/hooks/usePaywallState.ts` | Paywall UI state: plans, purchase, restore, entitlement verification. |
| `expo-app/src/hooks/useExecutePropertyImport.ts` | Central import gating: execute(data, source), isSubmitting, callbacks. |
| **Screens / app** | |
| `expo-app/app/_layout.tsx` | `initMonitoring()`; AuthProvider → SubscriptionProvider → ImportResumeProvider. |
| `expo-app/app/(tabs)/_layout.tsx` | Tabs; redirect to login when !session; auth loading. |
| `expo-app/app/(auth)/login.tsx` | Login; forgot password link. |
| `expo-app/app/(auth)/sign-up.tsx` | Sign up; profile created via ensureProfile. |
| `expo-app/app/(auth)/forgot-password.tsx` | Forgot password flow. |
| `expo-app/app/(tabs)/import.tsx` | Import UI; paywall when blocked; resume pending import. |
| `expo-app/app/(tabs)/settings.tsx` | Account, subscription status, Manage Subscription, Restore, Billing Help, Sign out; dev “Simulate at limit.” |
| `expo-app/app/paywall.tsx` | Paywall screen; usePaywallState + PaywallContent. |
| **Features / utils** | |
| `expo-app/src/features/paywall/PaywallContent.tsx` | Paywall UI (headline, benefits, plans, restore, footer). |
| `expo-app/src/features/paywall/paywallCopy.ts` | Copy for paywall. |
| `expo-app/src/utils/subscriptionManagement.ts` | openSubscriptionManagement; fallback messages. |
| `expo-app/src/utils/authRedirect.ts` | OAuth/magic link redirect and session from URL. |
| `expo-app/src/dev/subscriptionDebugOverrides.ts` | Dev-only “Simulate at limit” (no-op in production). |
| **Backend** | |
| `supabase/migrations/00016_propfolio_free_tier_tables.sql` | property_imports, subscription_status (and profiles if missing). |
| `supabase/migrations/00017_propfolio_free_tier_rls_and_guard.sql` | RLS and check_property_import_limit trigger. |
| `supabase/migrations/00018_subscription_status_webhook_columns.sql` | Webhook-related columns on subscription_status. |
| `supabase/migrations/00019_free_tier_usage_counters_and_defaults.sql` | plan_status, free_limit, profile trigger, usage_counters view. |
| `supabase/migrations/00020_record_property_import_rpc.sql` | UNIQUE on property_imports; record_property_import RPC. |
| **Docs** | |
| `expo-app/docs/ENV.md` | Env var list and validation. |
| `docs/BACKEND-FREE-TIER-DATA-MODEL.md` | Data model and RLS for free tier. |
| `docs/IMPORT-ENFORCEMENT-IMPLEMENTATION.md` | RPC and import enforcement. |
| `docs/EXPO-BILLING-SETUP.md` | RevenueCat and billing config. |
| `docs/AUTH-FREE-TIER-PAYWALL-SUBSCRIPTION-GUIDE.md` | This guide. |

---

## 12. Manual configuration steps (outside the codebase)

1. **Supabase:** Create project; run migrations; enable auth methods and set redirect URLs; optionally add RevenueCat webhook Edge Function.
2. **RevenueCat:** Create project and apps; create entitlement `pro_access` and offering `default`; add products from App Store / Play; copy public API keys into `expo-app/.env`.
3. **App Store Connect:** Create subscription products and group; link to RevenueCat; set up sandbox testers.
4. **Google Play Console:** Create subscription products; link to RevenueCat; set up license testers.
5. **Expo/EAS:** For IAP, use a development build (prebuild + run:ios/run:android or EAS Build); do not rely on Expo Go for purchases.

---

## 13. QA checklist (auth, free-tier, paywall, subscriptions)

- [ ] **Auth:** Sign up creates profile; sign in/out works; forgot password sends email; unconfigured auth shows demo user and does not crash.
- [ ] **Free tier:** 2 imports succeed; 3rd attempt returns blocked and shows paywall; no extra row in property_imports.
- [ ] **Usage UI:** Import tab shows correct “X of 2 free” or “Unlimited (Pro)”; Settings shows subscription status and remaining imports.
- [ ] **Paywall:** Opens from blocked import and from Settings; offerings load (or fallback); purchase completes and entitlement verified before close; “Activating…” appears if delayed.
- [ ] **Restore:** Restore restores Pro and updates subscription status.
- [ ] **Resume:** After upgrading from blocked state, pending import runs once and is cleared.
- [ ] **Manage Subscription:** Opens RevenueCat or platform subscription screen (or shows fallback).
- [ ] **Dev override:** “Simulate at limit” (Settings, __DEV__ only) forces paywall/blocked UI; toggling off restores normal behavior.
- [ ] **Typecheck:** `npm run typecheck` in expo-app passes when dependencies such as `react-native-purchases` are installed.
- [ ] **Build:** iOS and Android builds (dev or EAS) complete; IAP works in dev build, not in Expo Go.
