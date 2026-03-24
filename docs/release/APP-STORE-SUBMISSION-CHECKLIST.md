## PropFolio – App Store Submission Checklist

**Target: iOS only.** Production build is the Expo app in `expo-app/`; no Android or web release. This checklist assumes expo-app and Supabase/RevenueCat are already configured.

**For full functionality (APIs, algorithms, and what to configure so everything works on the App Store):** see **`docs/release/APP-STORE-PRODUCTION-READINESS.md`**.

### 1. Build configuration

- **Versioning**
  - [ ] `expo-app/app.json` has correct `version` for this release.
  - [ ] iOS build number set (via EAS or `expo.ios.buildNumber`).
- **Bundles**
  - [ ] iOS production build created (EAS or Xcode archive). (Android/web not used for release.)

### 2. Environment & backend

- **Supabase**
  - [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in `.env` and EAS environment.
  - [ ] All migrations applied, including free-tier and subscription tables/triggers.
  - [ ] Edge functions deployed (`geocode-address`, `places-autocomplete`, `rent-estimate`, `openai-summarize`, `census-data`, `revenuecat-webhook`, `delete-account`).
- **RevenueCat**
  - [ ] iOS app created in RevenueCat with the correct bundle ID.
  - [ ] Entitlement `pro_access` (or matching value in `ENTITLEMENT_PRO_ACCESS`) exists.
  - [ ] Default offering with monthly/annual packages configured and mapped to App Store products.
  - [ ] Public app-specific API key set as `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`.

### 3. Privacy, legal, and compliance

- [ ] iOS privacy manifest for UserDefaults present in `app.json` (`NSPrivacyAccessedAPICategoryUserDefaults` with reason CA92.1).
- [ ] Privacy Policy URL resolves and matches messaging (`getPrivacyPolicyUrl` / `EXPO_PUBLIC_PRIVACY_POLICY_URL`).
- [ ] Terms of Service URL resolves and matches messaging (`getTermsUrl` / `EXPO_PUBLIC_TERMS_URL`).
- [ ] In-app delete account flow works end‑to‑end (Settings → Delete account → Supabase user deleted → app signed out).
- [ ] Restore purchases is visible and functioning from Settings and Paywall.
- [ ] Paywall shows Terms of Service and Privacy Policy links plus billing disclosure copy.

### 4. Subscription & gating behavior

- **Free tier**
  - [ ] Brand‑new user gets exactly 2 successful imports; 3rd attempt is blocked with paywall.
  - [ ] Blocked import returns structured `blocked_upgrade_required` from backend; no silent failures.
- **Paid users**
  - [ ] After successful purchase, `hasProAccess` becomes true and imports are no longer limited.
  - [ ] `subscription_status.entitlement_active` is updated in Supabase for the purchasing user.
  - [ ] Manage Subscription entry points open the correct system screen or RevenueCat management URL.
- **Restore**
  - [ ] Restore on Settings and Paywall correctly restores entitlement for an existing subscriber.

### 5. Review build sanity

- [ ] App launches on iPhone simulator/device without red errors.
- [ ] Core flows (Import → Analysis → What‑If → Settings) are usable without crashing.
- [ ] Demo mode still works when Supabase env vars are omitted (for review/test accounts).
- [ ] No obvious placeholder assets, lorem ipsum, or dead navigation.

### 6. Store listing content

- [ ] Screenshots taken from the release build and match current UI.
- [ ] App name, subtitle, and description accurately reflect current feature set.
- [ ] User‑facing claims in description match reality (see `USER-FACING-CLAIMS.md`).
- [ ] Support URL and Privacy Policy URL match those used in‑app.

