# PropFolio — Implementation Plan: Auth, Free Tier, and Subscriptions

This document is the **implementation plan only** (no code). It defines the integration path for:

1. Email/password signup and login  
2. Free tier with exactly **2 property imports** per user  
3. In-app subscriptions on iOS and Android (RevenueCat + App Store / Google Play)  
4. Optional web billing compatibility  
5. Subscription management and restore flows  

**Stack:** React Native / Expo, Supabase Auth + Postgres, RevenueCat, Apple App Store & Google Play subscriptions.

---

## 1. Audit summary

### 1.1 Current state

| Area | Status | Notes |
|------|--------|--------|
| **Auth** | In place | `AuthContext.tsx`: `signIn`, `signUp`, `signInWithOAuth`, `signInWithMagicLink`, `signOut`. Login at `app/(auth)/login.tsx`, sign-up at `app/(auth)/sign-up.tsx`. Supabase client in `src/services/supabase.ts`. Session has `user.id` and `user.email`. |
| **Profiles** | Table only | `profiles` table exists (id, display_name, avatar_url). **No trigger** to create profile on signup; comment in 00001 says "trigger can be added separately." App does **not** insert into `profiles` after signUp or OAuth. |
| **Property import** | No persistence | Single entry: `app/(tabs)/import.tsx`. "Paste link" (Zillow/Redfin) and "Or enter address" (geocode + rent estimate via Edge Functions). **Imports are not saved:** no DB insert, no per-user count. Results only in alerts. |
| **Portfolio** | Empty state | `app/(tabs)/portfolio.tsx` shows "No properties yet" and CTA to Import; no list from DB. |
| **Subscriptions** | Schema only | `subscriptions` table exists: `user_id`, `plan` ('free'|'pro'|'enterprise'), `status`, `stripe_subscription_id`, `stripe_customer_id`, period fields. RLS: user can SELECT/INSERT/UPDATE own row. **No RevenueCat columns; no app usage.** |
| **Usage events** | Schema only | `usage_events` table: `user_id`, `event_type`, `resource_type`, `metadata`, `created_at`. RLS: user INSERT own, SELECT own. **Not used by app.** |
| **Store** | Stub | `src/store/index.ts` is empty (no real state). |
| **Settings** | Minimal | `app/(tabs)/settings.tsx`: session email and Sign out only; no subscription or billing UI. |
| **Navigation** | OK | Expo Router; `(tabs)/_layout.tsx` redirects to `(auth)/login` when `!session && !isLoading`. |

### 1.2 Existing Supabase schema (relevant)

- **profiles** — 1:1 with `auth.users`; required for FKs from portfolios, subscriptions, usage_events.  
- **subscriptions** — One per user; Stripe-oriented (stripe_*).  
- **portfolios** — user_id → profiles.  
- **properties** — portfolio_id; normalized address and fields.  
- **imported_source_records** — property_id, source, external_id, raw_payload (for audit).  
- **usage_events** — event stream for analytics and limits.

No Supabase migration currently creates a profile on signup (no trigger on `auth.users`).

---

## 2. Files to add or change

### 2.1 Auth and profile

| File | Action |
|------|--------|
| `expo-app/src/contexts/AuthContext.tsx` | **Change.** After successful `signUp` (when `data.session` exists) or on first session after OAuth/magic link, ensure `profiles` row exists: upsert by `user.id` with `display_name` from `user.user_metadata.first_name` / `last_name` if desired. Alternatively rely on DB trigger only (see migrations). |
| `expo-app/app/(auth)/login.tsx` | No change required for email/password; already uses `signIn`. |
| `expo-app/app/(auth)/sign-up.tsx` | No change required for form; optional: after `signUp` redirect, ensure profile exists (if app is responsible). |
| New: `expo-app/src/services/profile.ts` (or under `features/`) | **Add.** `ensureProfile(userId, metadata?)`: insert into `profiles` if missing (id, display_name from metadata). Used by AuthContext or after first session load. |

### 2.2 Property import and free-tier limit

| File | Action |
|------|--------|
| `expo-app/app/(tabs)/import.tsx` | **Change.** Before starting "import" (e.g. before geocode + rent + save): 1) require session; 2) call a "can import" check (see below). On successful import: create default portfolio if none, create `properties` row, optionally `imported_source_records`, and insert `usage_events` with `event_type = 'property_import'`. On limit exceeded, show upgrade CTA (no DB write). |
| New: `expo-app/src/features/property-import/` or `expo-app/src/services/` | **Add.** Logic: `getImportCount(userId)` (count `usage_events` where `event_type = 'property_import'`), `canImport(userId)` (compare to plan limit: free = 2). Optionally `recordPropertyImport(userId, ...)` that inserts usage_event + property + portfolio as needed. |
| New: Edge Function or RPC (optional) | **Optional.** Enforce limit server-side: e.g. Supabase RPC `check_and_record_import(...)` that checks count, inserts event + property in one transaction; app calls it instead of direct inserts to avoid bypass. |
| `expo-app/app/(tabs)/portfolio.tsx` | **Change.** Phase 6 / this work: load portfolios and properties from Supabase for current user; show list. Depends on properties being created by import flow. |

### 2.3 Subscriptions and RevenueCat

| File | Action |
|------|--------|
| New: `expo-app/src/services/revenueCat.ts` (or `subscriptions.ts`) | **Add.** Wrap RevenueCat SDK: init with API key (platform-specific); set user id to Supabase `user.id` after login; expose `getEntitlements()`, `purchasePackage()`, `restorePurchases()`, listener for entitlement updates. On web, no-op or optional web-specific billing. |
| New: `expo-app/src/contexts/SubscriptionContext.tsx` (or extend AuthContext) | **Add.** Hold: `plan: 'free' | 'pro' | ...`, `isSubscribed` (or entitlement active), `isLoading`. Source: RevenueCat on native; optionally sync from Supabase `subscriptions` for web or server-authoritative checks. Provide `refreshSubscription()`, `restorePurchases()`. |
| `expo-app/app/(tabs)/settings.tsx` | **Change.** Add section: current plan, "Manage subscription" (link to restore / platform paywall), and optionally "Restore purchases" button. |
| New: `expo-app/app/(tabs)/subscription.tsx` or modal/screen | **Add.** Paywall UI: show Pro (and optionally other) offerings from RevenueCat; purchase and restore actions. Navigate here when user hits import limit or from Settings. |
| `expo-app/package.json` | **Change.** Add dependency: `react-native-purchases` (RevenueCat SDK for React Native). |
| `expo-app/app/_layout.tsx` (root) | **Change.** Wrap app with `SubscriptionProvider` if using a separate context; init RevenueCat after auth session is known (user id). |

### 2.4 Web billing (optional)

| File | Action |
|------|--------|
| New: `expo-app/src/services/webBilling.ts` | **Add.** Only used when `Platform.OS === 'web'`. Options: (A) Stripe Checkout / Customer Portal (existing `subscriptions` has Stripe fields); (B) RevenueCat web SDK if/when used. Redirect to Stripe or RevenueCat web flow; on success, backend or webhook updates `subscriptions`; app reads `subscriptions` for plan. |
| Backend: Edge Function or external webhook | **Add.** Stripe webhook (or RevenueCat webhook) to update `public.subscriptions` (and optionally sync RevenueCat server notifications for native). |

### 2.5 Store and shared state

| File | Action |
|------|--------|
| `expo-app/src/store/index.ts` | **Optional.** Add slice or keys for subscription state if not using only context (e.g. `plan`, `importCountUsed`). Prefer SubscriptionContext for subscription; store only if needed for non-UI consumers. |

### 2.6 Supabase (backend)

| Item | Action |
|------|--------|
| New migration: profile on signup | **Add.** Trigger on `auth.users` INSERT to insert into `public.profiles` (id, display_name from raw_user_meta_data). Ensures profile exists before any app insert to portfolios/subscriptions/usage_events. |
| New migration: subscriptions table extension | **Add.** Add columns for RevenueCat: e.g. `revenuecat_app_user_id TEXT`, `revenuecat_entitlement_ids TEXT[]` or single `pro_entitlement_active BOOLEAN`, `last_synced_at TIMESTAMPTZ`. Keep existing Stripe columns for web. |
| New migration: default subscription row | **Optional.** Function or trigger: when profile is created, insert `subscriptions` row with plan = 'free', status = 'active' if no row exists. Simplifies app logic (always one row per user). |
| RLS | No change required for usage_events (already insert/select own). Subscriptions: already select/insert/update own. |
| Edge Function: RevenueCat webhook | **Add.** Receives RevenueCat server notifications (subscription events); updates `public.subscriptions` for the given app_user_id (map to user_id via profiles or store mapping). |

---

## 3. Supabase schema and migrations

### 3.1 Profile on signup

- **New migration** (e.g. `00016_create_profile_on_signup.sql`):
  - In `auth` schema (or via `supabase` migration that runs as superuser): create trigger on `auth.users` AFTER INSERT that inserts into `public.profiles` (id = new.id, display_name from new.raw_user_meta_data first_name/last_name, created_at/updated_at default).
  - Ensures every new user has a profile so FKs from portfolios, subscriptions, usage_events never fail.

### 3.2 Subscriptions table extension for RevenueCat

- **New migration** (e.g. `00017_subscriptions_revenuecat.sql`):
  - Add columns: `revenuecat_app_user_id TEXT`, `pro_entitlement_active BOOLEAN DEFAULT false`, `revenuecat_last_synced_at TIMESTAMPTZ`. Optional: `revenuecat_entitlement_ids TEXT[]`.
  - Keep existing `plan`, `status`, `stripe_*` for web/Stripe.
  - Optional: unique index on `revenuecat_app_user_id` where not null.

### 3.3 Default free subscription

- **Optional migration** (e.g. `00018_default_free_subscription.sql`):
  - Trigger on `public.profiles` AFTER INSERT: insert into `public.subscriptions` (user_id, plan = 'free', status = 'active') if not exists. Ensures one row per user for simple SELECT.

### 3.4 Usage events and import limit

- No new tables. Use `usage_events` with `event_type = 'property_import'`. Optionally `resource_type = 'property'`, `metadata = { property_id }`.
- Enforce limit in app: before starting import, `getImportCount(userId)`; if count >= 2 for free plan, block and show upgrade. Optionally enforce in DB via RPC that increments and checks in one transaction.

---

## 4. RevenueCat integration

### 4.1 Client (Expo app)

- **Init:** After Supabase session is available, set RevenueCat user id to `session.user.id` (Supabase UUID). Use same ID for iOS and Android so one account maps to one RevenueCat user.
- **Where:** In `SubscriptionContext` or root layout: when `session` is set, call RevenueCat `identify(session.id)` and load offerings/entitlements.
- **Entitlements:** Define e.g. "pro" entitlement in RevenueCat dashboard. In app, `getEntitlements()` → if "pro" is active, user can import beyond 2; else apply free limit.
- **Purchase:** On paywall screen, call RevenueCat `purchasePackage(package)`. On success, entitlement becomes active; refresh SubscriptionContext and optionally sync to Supabase (see below).
- **Restore:** "Restore purchases" calls RevenueCat `restorePurchases()`; then refresh entitlements and show result in UI.

### 4.2 Syncing RevenueCat → Supabase

- **Option A (recommended):** RevenueCat webhook (or S2S) calls Supabase Edge Function or external API that updates `public.subscriptions` (revenuecat_app_user_id = Supabase user id, set pro_entitlement_active, plan = 'pro', etc.). App can then rely on Supabase for server-authoritative plan when needed (e.g. Edge Function enforcing import limit).
- **Option B:** App-only: after RevenueCat entitlement change, app calls Edge Function or direct Supabase update (with RLS) to set subscription row. Simpler but less reliable if app is not open.

### 4.3 Platform-specific

- **iOS:** RevenueCat uses StoreKit 2 / App Store Connect products. Configure products and entitlement in RevenueCat; use same app user id as Supabase user id.
- **Android:** RevenueCat uses Google Play Billing; same app user id.
- **Web:** Do not init native RevenueCat SDK; use optional web billing (Stripe or RevenueCat web) and read plan from Supabase.

---

## 5. Free tier: exactly 2 property imports per user

### 5.1 Definition of "import"

- One "property import" = one user action that results in a new saved property (one new row in `properties` and one `usage_events` row with `event_type = 'property_import'`). Link paste and address entry both count when they result in a save.

### 5.2 Where to enforce

- **Client:** Before creating a new property from import flow, call `getImportCount(userId)` and, if current plan is free and count >= 2, block the action and show upgrade/ paywall CTA.
- **Server (recommended):** Expose an RPC or Edge Function that: (1) checks current user's plan (from `subscriptions`) and import count (from `usage_events`); (2) if free and count >= 2, return error; (3) else create portfolio (if needed), property, usage_event in one transaction. App calls this instead of direct inserts so the limit cannot be bypassed.

### 5.3 Data flow

- User has no `subscriptions` row or plan = 'free' → limit 2.
- User has plan = 'pro' (or entitlement active) → no limit (or higher limit if you define one).
- Count = number of `usage_events` rows with `event_type = 'property_import'` and `user_id = auth.uid()`.

---

## 6. Optional web billing

- **Stripe:** Use existing `stripe_subscription_id` / `stripe_customer_id` in `subscriptions`. Add Edge Function or backend: create Checkout session or Customer Portal link; web app redirects. Webhook updates `subscriptions`. On web, app reads `subscriptions` for plan; no RevenueCat.
- **RevenueCat web:** If RevenueCat supports web purchases, add web SDK and same entitlement; sync to Supabase via webhook. Then one source of truth for "pro" across platforms.
- **Scope:** "Optional" means: implement after native subscriptions; same `subscriptions` table and RLS; Settings and paywall on web show "Upgrade" that goes to Stripe or RevenueCat web.

---

## 7. Subscription management and restore flows

- **Restore purchases:** Button in Settings and/or paywall. Calls RevenueCat `restorePurchases()`; RevenueCat syncs with App Store / Google Play; then refresh entitlements in app and show "Restored" or "No active subscription."
- **Manage subscription:** Link to platform-specific management (Apple Subscription Management, Google Play Subscriptions). RevenueCat docs provide URLs; or open in-app via StoreKit/Play Billing manage UI. No direct cancel in app required.
- **Restore and sync:** After restore, if using webhook, RevenueCat notifies backend and Supabase `subscriptions` is updated; app can also refresh from Supabase for consistency.

---

## 8. Environment variables and secrets

### 8.1 Client (expo-app/.env)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Already used. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Already used. |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat public API key for iOS (optional; can use one key per platform in app config). |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | RevenueCat public API key for Android. |

RevenueCat public keys are safe for client; they are restricted in RevenueCat dashboard by app bundle id.

### 8.2 Backend / Edge Functions / Supabase

| Item | Description |
|------|-------------|
| Supabase service_role | Already used only server-side; for webhooks that write to `subscriptions` if needed. |
| RevenueCat webhook secret / auth | Verify webhook calls in Edge Function using RevenueCat shared secret or auth header. |
| Stripe webhook secret | If using Stripe for web, verify Stripe webhooks. |

### 8.3 Documentation

- Update `expo-app/docs/ENV.md` with RevenueCat keys and when to set them.
- Update `docs/SERVICES-INITIATION-GUIDE.md` with RevenueCat setup (dashboard, products, entitlements, webhook URL).

---

## 9. Risks and dependencies

### 9.1 Risks

- **Profile missing:** If trigger is not run (e.g. migration order, different auth provider), inserts to portfolios/subscriptions/usage_events can fail. Mitigation: add trigger and/or app-side `ensureProfile` on first use.
- **Import count bypass:** If app only checks limit in client, a user can bypass by calling Supabase directly. Mitigation: enforce in RPC or Edge Function that performs the insert.
- **RevenueCat ↔ Supabase drift:** If webhook fails or is delayed, Supabase may be out of date. Mitigation: app can show entitlement from RevenueCat for native; use Supabase for server-side enforcement and web; retry webhook or periodic sync.
- **Restore on new device:** User must use same account (same Supabase user id); RevenueCat must be identified with that id so restore attaches to same user.

### 9.2 Dependencies

- **RevenueCat:** Account, iOS and Android apps linked, products and entitlement configured, webhook URL for Supabase.
- **App Store / Google Play:** In-app products created and approved; same product ids configured in RevenueCat.
- **Supabase:** Migrations applied in order; RLS allows insert to usage_events and subscriptions for own user.
- **Expo/React Native:** `react-native-purchases` compatible with Expo (may require dev client or EAS build for native modules; confirm with Expo docs).

---

## 10. Implementation order (phases)

1. **Migrations and profile**  
   - Add profile-on-signup trigger (and optionally app-side `ensureProfile`).  
   - Add subscriptions RevenueCat columns.  
   - Optional: default free subscription row on profile create.

2. **Import persistence and limit**  
   - Implement create-property + usage_event flow (and optional RPC).  
   - Implement `getImportCount` / `canImport`; enforce free tier limit (2) before creating import.  
   - Wire import screen to save property and show in portfolio (portfolio list from DB).

3. **RevenueCat client**  
   - Add `react-native-purchases`; init with Supabase user id after auth.  
   - Add SubscriptionContext (entitlements, purchase, restore).  
   - Paywall screen and "Restore" in Settings.

4. **RevenueCat ↔ Supabase sync**  
   - RevenueCat webhook → Edge Function → update `subscriptions`.  
   - Optionally: app updates Supabase after purchase/restore for immediate consistency.

5. **Settings and subscription UI**  
   - Settings: current plan, Manage subscription, Restore purchases.  
   - When user hits 2-import limit, show upgrade CTA and navigate to paywall.

6. **Web billing (optional)**  
   - Stripe Checkout/Portal or RevenueCat web; webhook updates `subscriptions`; web app reads plan from Supabase.

7. **Testing and docs**  
   - Unit tests for import count and limit logic.  
   - Update ENV.md and SERVICES-INITIATION-GUIDE.md; document restore and subscription management flows.

---

## 11. Summary checklist

- [ ] Migration: profile on signup (trigger).  
- [ ] Migration: subscriptions RevenueCat columns (+ optional default free row).  
- [ ] App: ensure profile exists (trigger or AuthContext/profile service).  
- [ ] App: property import writes to DB (portfolio, property, usage_event); import count and limit 2 for free.  
- [ ] App: RevenueCat init, identify user, SubscriptionContext, paywall, restore.  
- [ ] Backend: RevenueCat webhook → update Supabase subscriptions.  
- [ ] App: Settings subscription section; upgrade CTA when at limit.  
- [ ] Optional: web billing (Stripe or RC web) and docs.  
- [ ] Env vars and secrets documented; RLS and migrations verified.

This plan keeps changes minimal and aligned with the existing architecture (Supabase auth, existing tables, RLS, Expo Router). No code is included; implement following this plan and the project’s TypeScript and testing standards.
