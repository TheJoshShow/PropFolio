# PropFolio – iOS-Only Conversion Audit Report

**Role:** Principal iOS Architect / Senior Mobile Release Engineer  
**Scope:** Full repository audit before any destructive changes  
**Date:** March 2025  
**Goal:** Convert and optimize PropFolio into an exclusive iOS app with the lowest-risk path to production.

---

## A. INVENTORY REPORT

### 1. Full top-level folder inventory

| Path | Purpose |
|------|---------|
| **expo-app/** | Main application: Expo (React Native) app targeting iOS, Android, and web. Contains app routes, src (contexts, services, lib, features, components), assets, and config. |
| **PropFolio/** | **Native Swift iOS app** – parallel codebase with its own Supabase client, auth, scoring, confidence meter, underwriting, simulation, property import, paywall, and portfolio screens. Not referenced by expo-app. |
| **supabase/** | Backend: migrations (00001–00020), Edge Functions (geocode-address, places-autocomplete, rent-estimate, openai-summarize, census-data, revenuecat-webhook, delete-account), docs. |
| **docs/** | Project documentation: release checklists, privacy, support links, specs (scoring, underwriting, future value, etc.), setup guides, phase handoffs. |
| **_archive_review/** | Archived material; includes **web/** – Vite/React package (propfolio-web) with separate package.json. Not used by expo-app. |
| **expo-app/expo-app/** | Nested directory under expo-app; appears to be a duplicate or nested clone (contains node_modules, react-native, etc.). **Verify before deletion.** |

### 2. Important subfolder inventory (expo-app, source only)

| Path | Purpose |
|------|---------|
| **expo-app/app/** | Expo Router file-based routes: `_layout.tsx`, `(tabs)/` (index, import, portfolio, settings), `(auth)/` (login, sign-up, forgot-password), `paywall.tsx`, `update-password.tsx`, `+html.tsx` (web root), `+not-found.tsx`. |
| **expo-app/src/contexts/** | AuthContext, SubscriptionContext, ImportResumeContext. |
| **expo-app/src/services/** | supabase, edgeFunctions, revenueCat, importLimits, profile, analytics, subscriptionStatusDisplay, subscriptionCache, offeringsMapper, restorePurchases, diagnostics; deleteAccount via edgeFunctions. |
| **expo-app/src/hooks/** | useExecutePropertyImport, useImportLimit, usePaywallState. |
| **expo-app/src/lib/** | scoring (dealScoringEngine, types, dealScoreExplanations, dealScoreInputsFromSimulation), confidence (confidenceMeterEngine, confidenceMeterCopy, types), underwriting, simulation, parsers (zillow, redfin, address), renovation; __tests__ under scoring and underwriting. |
| **expo-app/src/features/** | paywall, **subscriptions** (entitlement policy), property-import, property-analysis, scoring, confidence, future-value, renovation, portfolio, settings, onboarding. Auth routes live under **`app/(auth)/`** (no `features/auth` folder). |
| **expo-app/src/components/** | Button, Card, TextInput, Chip, FreeImportsIndicator, SubscriptionStatusCard, useThemeColors, useColorScheme, useClientOnlyValue, Themed. |
| **expo-app/src/config/** | billing.ts, env.ts, legalUrls.ts. |
| **expo-app/src/utils/** | authRedirect, authErrors, subscriptionManagement, responsive. |
| **expo-app/src/theme/** | index, colors, typography. |
| **expo-app/src/store/** | index.ts (currently only `export type {}` – placeholder). |
| **expo-app/src/dev/** | **Removed** (was empty after repo cleanup). Older guides mentioned `subscriptionDebugOverrides.ts`; that path is gone — use **`EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS`** and Settings diagnostics / `MONITORING_VERIFICATION.md` for internal QA. |
| **expo-app/src/test/** | setup.ts (Jest). |
| **expo-app/assets/** | Referenced in app.json: images (icon.png, splash-icon.png, favicon.png, android-icon-foreground/background/monochrome), fonts (SpaceMono-Regular.ttf). |
| **expo-app/_quarantine/** | Previously quarantined unused files: modal.tsx, EditScreenInfo, StyledText, ExternalLink. See docs/release/AUDIT-OBSOLETE-UNUSED.md. |

### 3. Framework / runtime

- **expo-app:** Expo SDK ~55, React 19.2, React Native 0.83.2, TypeScript ~5.9. Expo Router for navigation. React Native Reanimated, Safe Area Context, Screens; expo-symbols, expo-web-browser, expo-constants, expo-font, expo-linking, expo-splash-screen, expo-status-bar.
- **PropFolio (Swift):** Native iOS (Swift); separate Supabase Swift client and auth.

### 4. Build system

- **expo-app:** npm scripts: `start`, `ios`, `android`, `web`, `test`, `typecheck`, `lint`, `validate`. **`expo-app/eas.json`** defines EAS build/submit profiles; dashboard secrets supply env. Build entry: `expo-router/entry` (package.json `main`).
- **Supabase:** Supabase CLI for migrations and Edge Function deploy.

### 5. Backend / services

- **Supabase:** Auth, PostgreSQL (profiles, properties, property_imports, subscription_status, usage_events, etc.), Edge Functions invoked from client.
- **Edge Functions (client-invoked):** geocode-address (Google Geocoding), places-autocomplete (Google Places), rent-estimate (RentCast), openai-summarize (OpenAI), census-data (Census), delete-account (Supabase auth delete). revenuecat-webhook: server-to-server.
- **RevenueCat:** In-app subscriptions (iOS/Android); entitlement `pro_access`; offerings/packages; sync to Supabase `subscription_status`.

### 6. Authentication flow

- **AuthContext** (expo-app): When `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set, uses Supabase auth (email/password, OAuth Google/Apple, magic link, forgot password). On missing env, uses **demo user** (in-memory) so app remains runnable. Ensures profile row via ensureProfile(). deleteAccount() calls Edge Function `delete-account` then clears session. Protected routes (tabs) redirect to `/(auth)/login` when session is null.

### 7. Subscription / paywall flow

- **SubscriptionContext** uses RevenueCat (react-native-purchases): configure with Supabase user id, getOfferings/getCustomerInfo, purchasePackage, restorePurchases. hasProAccess from RevenueCat; sync to Supabase subscription_status. **revenueCat.ts** gates on `Platform.OS === 'ios' || Platform.OS === 'android'` (no RevenueCat on web). **billing.ts** getRevenueCatApiKey() returns iOS or Android key by Platform.OS. Paywall screen and Settings show restore; manage subscription opens iOS/Android system flow via subscriptionManagement.ts.

### 8. Data sources and APIs

- **Supabase:** Auth, profiles, portfolios, properties, property_imports, subscription_status, usage_events, analyses, etc. (see supabase/migrations).
- **Edge Functions:** Google (Geocoding, Places), RentCast (rent estimate), OpenAI (summarize), Census (market data). All invoked via getSupabase().functions.invoke(); return structured { data, error }.
- **RevenueCat:** Offerings and customer info; no direct paid APIs from client for financial logic (per project rules).

### 9. Analytics / crash logging

- **Analytics:** usage_events table (Supabase); trackEvent() in analytics.ts (signup, login, import, paywall, purchase, restore, etc.). __DEV__ logs sanitized metadata only.
- **Crash reporting:** `initMonitoring()` in `app/_layout.tsx` (stubs in `src/services/monitoring`; production no-op until Firebase Crashlytics is added).

### 10. Environment variable usage

- **Client (EXPO_PUBLIC_*):** EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY; EXPO_PUBLIC_REVENUECAT_API_KEY_IOS; EXPO_PUBLIC_PRIVACY_POLICY_URL, EXPO_PUBLIC_TERMS_URL, EXPO_PUBLIC_BILLING_HELP_URL. Read at build time (e.g. EAS). No third-party crash DSN env vars are used today.
- **Backend (Edge Functions):** SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY; GOOGLE_MAPS_API_KEY, RENTCAST_API_KEY, OPENAI_API_KEY, CENSUS_API_KEY, REVENUECAT_WEBHOOK_AUTHORIZATION (per function).

### 11. App entry points

- **expo-app:** main = `expo-router/entry`. Root layout app/_layout.tsx loads fonts, AuthProvider → SubscriptionProvider → ImportResumeProvider → RootLayoutNav (Stack: (tabs), (auth), paywall, update-password). (tabs)/_layout.tsx redirects unauthenticated users to (auth)/login.

### 12. Navigation structure

- **Stack (root):** (tabs) | (auth) | paywall | update-password. initialRouteName: (tabs).
- **Tabs:** index (Home), import, portfolio, settings. Tab bar uses SymbolView with `{ ios: '...', android: '...', web: '...' }`.
- **Auth group:** login, sign-up, forgot-password.
- **Programmatic:** router.push('/(tabs)/import'), router.push('/paywall'), router.push('/(auth)/login'), router.replace('/(auth)/login'), router.push('/update-password').

### 13. State management pattern

- **React Context:** AuthContext (session, sign-in/out, deleteAccount), SubscriptionContext (offerings, hasProAccess, purchase, restore), ImportResumeContext (pending import resume).
- **Hooks:** useImportLimit, usePaywallState, useExecutePropertyImport; no Redux/Zustand in use (store/index.ts is placeholder).

### 14. File upload / import flow

- **Property import:** User enters address or pastes link on Import tab. placesAutocomplete + geocodeAddress + rentEstimate (Edge Functions). addressToImportData() builds payload. useExecutePropertyImport().execute(data, source) → recordPropertyImportEnforced (importLimits) → Supabase RPC record_property_import + property/portfolio creation. Free tier: 2 imports; 3rd triggers blocked_upgrade_required and paywall. No file upload; data-only.

### 15. Property analysis / scoring engine flow

- **Scoring:** src/lib/scoring/dealScoringEngine.ts – score(DealScoreInputs) → DealScoreResult (score 0–100, band, factors). dealScoreInputsFromSimulation maps simulation to inputs. Cap when data confidence low.
- **Confidence:** src/lib/confidence/confidenceMeterEngine.ts – evaluate(ConfidenceMeterInputs) → score, band, explanation, recommendedActions. Pure TypeScript; no network.
- **Underwriting / simulation / renovation:** src/lib/underwriting, simulation, renovation – used by analysis/UI. All in-app logic; no AI for financial metrics.

---

## B. RISK REPORT

### Architecture risks

- **Dual codebases:** PropFolio (Swift) and expo-app (Expo) implement overlapping features (auth, scoring, confidence, import, paywall). For iOS-only, one must be chosen as source of truth; the other creates maintenance and drift risk.
- **Nested expo-app/expo-app:** Unclear whether intentional (e.g. submodule or copy). Risk of confusion and duplicate dependencies; should be verified and either removed or documented.
- **Empty store:** src/store/index.ts is a placeholder; global state is entirely Context-based. Acceptable but worth documenting so future state is added consistently.

### Performance risks

- **Web/Android code in bundle:** react-native-web and Platform.OS branches remain in the client bundle for iOS; tree-shaking may not remove all web paths. Could marginally increase bundle size and surface area for bugs.
- **crash reporting + Reanimated:** Native-only crash reporting and Reanimated are appropriate; no specific performance risk identified for iOS-only if other platforms are dropped.

### App Store rejection risks

- **Account deletion:** Implemented via delete-account Edge Function; must be deployed and tested. Documented in docs/release.
- **Restore purchases:** Present in Settings and Paywall; RevenueCat restore flow must work on device.
- **Subscription disclosure:** Paywall and legal links (Privacy, Terms) must be visible and correct.
- **Demo mode:** When Supabase is not configured, app runs with demo user; ensure review build uses real Supabase + RevenueCat so reviewers see full flow.

### Privacy / security risks

- **Env at build time:** EXPO_PUBLIC_* are baked into client; only anon key and public API keys should be used; no secrets in client. Confirmed in code.
- **Usage events / PII:** analytics.ts restricts __DEV__ logs to safe metadata keys; no PII in event payloads in code review. Supabase RLS and Edge Function auth (JWT) used appropriately.

### Brittle or duplicated logic

- **Platform.OS spread:** Many files branch on Platform.OS ('ios' | 'android' | 'web'). For iOS-only, android and web branches become dead code; removal reduces branches and simplifies maintenance.
- **SymbolView names:** Tab bar and any other SymbolView use `{ ios: '...', android: '...', web: '...' }`; iOS-only would only need the ios key (or a single string if API allows).
- **Billing config:** getRevenueCatApiKey() and isBillingConfigured() explicitly handle ios and android; product IDs and package identifiers are shared in docs (iOS and Android). Single platform simplifies this.
- **Copy strings:** paywallCopy and subscriptionManagement reference "iOS and Android" or "iOS or Android app"; should be updated for iOS-only to avoid confusion.

### Files that appear obsolete but should be reviewed before deletion

- **PropFolio/** (entire Swift project): Decide whether to abandon (favor Expo) or replace Expo with native. Do not delete until decision is documented.
- **expo-app/expo-app/** (nested): Verify it is not referenced by build or scripts; then treat as safe to remove or document as intentional.
- **_archive_review/web:** Already archived; safe to keep or remove after confirming no references.
- **expo-app/app/+html.tsx:** Web-only root HTML. For iOS-only build, web build is typically not produced; file can be kept for possible future web or removed after confirming EAS/Expo does not require it.
- **expo-app/src/store/index.ts:** Placeholder; keep if future global state is planned, or remove and delete references.

---

## C. IOS-ONLY CONVERSION PLAN (SUMMARY)

**Recommendation:** **Option 1 – Keep current stack and target iOS only.**

- **Effort:** Lower. No rewrite of app logic; config and cleanup only.
- **Risk:** Lower. Existing Expo iOS build and App Store readiness docs already in place; removing Android/web reduces surface area.
- **Performance:** Slightly better bundle and simpler code paths by dropping web and Android.
- **Launch speed:** Fastest. Phased cleanup (config, scripts, Platform branches, copy, then optional dependency removal) can be done in order; no native rewrite.

**Option 2 (rewrite selected pieces natively)** would be justified only if there is a hard requirement for native Swift UI or specific native modules Expo cannot provide. Current codebase does not indicate that; business logic is already in TypeScript and shared.

**Phased execution:** See **ios_conversion_plan.md** for the exact phased plan.

---

## D. CLEANUP PLAN (BUCKETS SUMMARY)

| Bucket | Description | Examples (see cleanup_candidates.csv for full list) |
|--------|-------------|-----------------------------------------------------|
| **1. Safe to delete immediately** | After one final verification pass | None until verification step is done; then e.g. expo-app/expo-app if confirmed unused. |
| **2. Delete after verification** | Confirm no imports, routes, or build references | _archive_review/web; app/+html.tsx for iOS-only; Android-specific assets (android-icon-*, favicon if web dropped). |
| **3. Keep but refactor** | Keep file/module; simplify for iOS-only | Platform.OS branches (reduce to ios-only or remove web/android paths); billing.ts (drop Android key handling); paywallCopy and subscriptionManagement copy; tab bar SymbolView (ios-only keys); app.json (remove android and web blocks). |
| **4. Keep unchanged** | No change for iOS-only | supabase/; docs/release; src/lib (scoring, confidence, underwriting, simulation, parsers, renovation); AuthContext, SubscriptionContext; Edge Function calls; RevenueCat flow; crash reporting init; assets for iOS (icon, splash, SpaceMono). |

---

**Next step:** Use **cleanup_candidates.csv** and **ios_conversion_plan.md** to execute the phased plan. Do not delete or refactor until the plan is approved and verification steps are completed.
