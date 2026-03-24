# PropFolio — TestFlight / App Store Connect Release Checklist

Use this checklist before each TestFlight upload and App Store submission.

---

## 1. Final release checklist (pre-build verification)

### Version and build number
- [ ] **app.config.ts** — `version` is set (e.g. `1.0.0`). Bump when you ship a new marketing version.
- [ ] **app.config.ts** — `ios.buildNumber` is an integer string (e.g. `"1"`). With `eas.json` `appVersionSource: "remote"` and `autoIncrement: true`, EAS manages the build number on the server; local value is fallback.
- [ ] **eas.json** — `build.production.autoIncrement: true` and `cli.appVersionSource: "remote"` are set.

### Release configuration
- [ ] **eas.json** — `build.production.distribution` is `"store"`.
- [ ] **eas.json** — `build.production.env` includes `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or rely on EAS project env).
- [ ] **EAS project** — Production profile has `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` set (EAS Dashboard → Project → Secrets, or build-time env). Required for paywall and restore; without it, subscriptions are disabled on device.

### No demo / mock in production
- [ ] No `DEMO_USER`, demo session, or hardcoded `demo@propfolio.app` in auth or settings.
- [ ] No `localPortfolioStore` or offline-only import/portfolio paths in production code paths.
- [ ] No `subscriptionDebugOverrides` or “simulate at limit” in settings or `useImportLimit`.
- [ ] `__DEV__` is used only for logging or dev-only diagnostics, not for gating real features.

### Production environment variables
- [ ] **Supabase** — Injected via `eas.json` `build.production.env` or EAS Secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **RevenueCat** — `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` set for production builds (EAS Secrets or build env). Not in repo.
- [ ] **Crash reporting:** Not applicable until Firebase Crashlytics is integrated (`src/services/monitoring` is stub-only today).
- [ ] Server-only keys (e.g. Google Maps, RentCast, OpenAI) are **not** in client env; they live in Supabase Edge Function Secrets.

### iOS-specific release settings
- [ ] **app.config.ts** — `ios.bundleIdentifier`: `com.propfolio.mobile`.
- [ ] **app.config.ts** — `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` (if app uses only standard HTTPS; avoids export compliance prompts).
- [ ] **app.config.ts** — `ios.privacyManifests` present if using required APIs.

### Paywall and subscription IDs (production-safe)
- [ ] **billing.ts** — `ENTITLEMENT_PRO_ACCESS` / `pro_access` matches RevenueCat Dashboard → Entitlements.
- [ ] **billing.ts** — `OFFERING_IDENTIFIER_DEFAULT` (`default`) matches RevenueCat → Offerings.
- [ ] **billing.ts** — `PRODUCT_IDS` (e.g. `com.propfolio.premium.monthly`, `com.propfolio.premium.annual`) match App Store Connect in-app products and RevenueCat Products.
- [ ] **RevenueCat** — Same product IDs and entitlement linked to the same App Store Connect subscription group.

### Restore purchases
- [ ] Paywall screen shows “Restore purchases” and calls `SubscriptionContext.restore()` (via `usePaywallState.handleRestore`).
- [ ] Restore outcome is shown (success / no purchases / failed / offline) via `getRestoreOutcome()` and PaywallContent.
- [ ] After restore, `hasProAccess` updates and import limit reflects Pro (unlimited).

### Auth / session flow (production)
- [ ] App launches to welcome/login when not signed in; tabs redirect to `/(auth)/login` when `!session && !isLoading`.
- [ ] After sign-in, session persists; no repeated sign-in prompts while app is in use.
- [ ] Portfolio and property detail use `session?.id` (user id) for ownership; no `session?.user?.id` mismatch.
- [ ] Sign out clears session and redirects to login; RevenueCat is logged out on sign-out.

### Ready for archive / build / upload
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] No uncommitted local-only or debug code intended for production.
- [ ] EAS Submit path to .p8 key is valid on the machine that runs `eas submit` (or use env vars for API key).

---

## 2. Exact commands to build and upload

Run from the **expo-app** directory.

### One-time (if not already done)
```bash
cd expo-app
npm ci
eas login
# Ensure EAS project is linked: eas.json has "extra.eas.projectId"
```

### Build for TestFlight / App Store
```bash
cd expo-app
eas build --platform ios --profile production --non-interactive
```
- With `autoIncrement: true` and `appVersionSource: "remote"`, EAS will assign the next build number.
- Ensure `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is set in EAS Project → Secrets (or in the environment when running this command).

### After build completes
```bash
# List recent builds (optional)
eas build:list --platform ios --limit 5

# Submit the latest production iOS build to App Store Connect
eas submit --platform ios --profile production --latest --non-interactive
```
- For `--latest` to work, the most recent build must be the one you want. Otherwise use:
  `eas submit --platform ios --profile production --id <BUILD_ID> --non-interactive`

### Non-interactive submit (CI or no keychain)
If submit prompts for Apple credentials, use App Store Connect API key (already in eas.json):
- `ascApiKeyPath`, `ascApiKeyId`, `ascApiKeyIssuerId`, `appleTeamId`, `ascAppId` must be set under `submit.production.ios`.
- Or set env vars: `EXPO_ASC_API_KEY_PATH`, `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`, `EXPO_APPLE_TEAM_ID`, `EXPO_APPLE_APP_ID` (App Store Connect app id).

---

## 3. Manual smoke test checklist (iPhone, TestFlight build)

Run on a **real device** with the TestFlight build installed.

### Launch and auth
- [ ] Cold start shows splash then welcome/login (no crash).
- [ ] Sign up with new email: account created, lands on main tabs.
- [ ] Sign out: returns to login; sign in again: lands on tabs, no “sign in to view property” on portfolio.
- [ ] Kill app, reopen: still signed in (session persisted).

### Import and portfolio
- [ ] Import tab: paste Zillow link → address extracted → import runs → success message; property appears in Portfolio.
- [ ] Import tab: enter address manually → import runs → success; property appears in Portfolio.
- [ ] Portfolio tab: list shows imported properties; tap one → property detail loads (scores, metrics, no “unable to load property” or “sign in to view”).

### Free trial and paywall
- [ ] First and second imports succeed; “X of 2 free imports” (or similar) updates.
- [ ] Third import attempt shows paywall / “Import limit reached” (no silent bypass).
- [ ] Paywall shows plan options; “Restore purchases” runs without crash; outcome message appears (success / no purchases / failed / offline).

### Purchase and restore (if testing IAP)
- [ ] Purchase flow starts from paywall; after purchase, Pro is recognized (or “Activating…” then Pro).
- [ ] Restore purchases: with no prior purchase, “No purchases found” (or equivalent); with prior purchase, “Purchases restored” and Pro access.
- [ ] After Pro: can import more than 2 properties; Settings or paywall shows Pro / “Manage subscription”.

### Settings and account
- [ ] Settings shows **signed-in user’s email** (not a placeholder or demo email).
- [ ] Sign out from Settings: returns to login; session cleared.

### Stability
- [ ] No repeated “sign in to view this property” when already signed in.
- [ ] No crash on background/foreground or after opening a link and returning.
- [ ] Tab switching (Home, Import, Portfolio, Settings) is stable.

---

## 4. App Store Connect — notes and metadata to review before re-submitting

### Version and build
- [ ] **Version** matches `expo.version` (e.g. 1.0.0) if you manage it locally; otherwise align with EAS.
- [ ] **Build** selected is the one you submitted; build number is greater than any previously submitted for that version.

### App information
- [ ] **Name**, **Subtitle**, **Privacy Policy URL**, **Category** are correct.
- [ ] **Support URL** matches what the app uses (e.g. paywall/settings); often `https://propfolio.app/support` or your chosen URL.

### In-app purchases / subscriptions
- [ ] Subscription products (e.g. `com.propfolio.premium.monthly`, `com.propfolio.premium.annual`) exist and are **Approved** in App Store Connect.
- [ ] Subscription group and pricing are set; **RevenueCat** is configured with the same product IDs and entitlement (`pro_access`).

### Export compliance
- [ ] If **ITSAppUsesNonExemptEncryption** is `false` in the app, answer “No” to using encryption (or as guided by the form) so you don’t get unnecessary compliance docs.

### TestFlight / Review
- [ ] **Test notes** (What to Test): mention sign-in, import (Zillow + address), portfolio, paywall, restore purchases, and that no demo account is needed.
- [ ] **Demo account** (if required): provide a real test account (email/password) that reviewers can use; do **not** rely on a demo-only or placeholder account.
- [ ] **Contact** info for review team is current.

### Screenshots and preview (if updating)
- [ ] iPhone 6.7" and 6.5" (and any other required sizes) are up to date if you changed the app.

---

*Last updated for PropFolio TestFlight/App Store Connect upload. Run typecheck and tests before building.*
