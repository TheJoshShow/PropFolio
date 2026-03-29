# PropFolio App Store Release Readiness Audit

Audit date: March 2025. Covers iOS production requirements, privacy/legal, delete account, restore purchases, subscription compliance, metadata, links, test/demo code, and crash-prone paths.

---

## Executive summary

| Category | Status | Priority |
|----------|--------|----------|
| Delete account flow | **Missing** — required by Apple since June 2022 | P0 |
| Restore purchases | **Present** (Settings + Paywall) | — |
| Privacy & legal surfaces | **Present** (Settings: Privacy, Terms; paywall footer) | — |
| Subscription compliance | **Mostly present** (restore, footer); add Terms/Privacy links on paywall | P1 |
| iOS privacy manifest | **Not configured** (Expo supports `expo.ios.privacyManifests`) | P1 |
| Placeholder metadata | **Minor** (version 1.0.0, bundle ID set; confirm build number) | P2 |
| Demo-only code | **Safe** (DEMO_USER only when Supabase unset; __DEV__ guards) | — |
| Dead links | **Risk** (default legal URLs point to prop-folio.vercel.app; ensure live before ship) | P2 |
| Crash-prone paths | **Mitigated** (getSupabase() null checks; RevenueCat lazy-loaded) | — |

---

## 1. Missing iOS production requirements

- **Bundle identifier:** Set in `app.json` (`com.propfolio.app`). ✓  
- **Version / build:** `version: "1.0.0"` in app.json. For App Store, set build number in EAS or `expo.ios.buildNumber`.  
- **Privacy manifest (iOS 17+):** Not configured. Apple may require declarations for Required Reason APIs (e.g. UserDefaults). **Action:** Add `expo.ios.privacyManifests` in app.json per [Expo Apple privacy](https://docs.expo.dev/guides/apple-privacy).  
- **Capabilities:** No Sign in with Apple or push entitlement detected in app.json; add if used.  
- **Non-exempt encryption:** If your app uses encryption beyond HTTPS, set `expo.ios.usesNonExemptEncryption` and complete the annual self-classification if required.

---

## 2. Privacy and legal surfaces

- **Privacy Policy:** Linked from Settings → Legal → Privacy Policy. URL from `getPrivacyPolicyUrl()` (env `EXPO_PUBLIC_PRIVACY_POLICY_URL` or default `https://prop-folio.vercel.app/privacy`). ✓  
- **Terms of Service:** Linked from Settings → Legal → Terms of Service. URL from `getTermsUrl()`. ✓  
- **In-app disclosure:** Paywall footer describes billing and cancellation. ✓  
- **Gaps:** (1) Ensure default URLs (prop-folio.vercel.app) are live and correct before release. (2) Add explicit Terms and Privacy links on the paywall screen (below footer) for subscription compliance.

---

## 3. Delete account flow (missing — P0)

Apple requires that apps that support account creation **allow users to initiate account deletion within the app** (since June 2022). The flow must be easy to find (e.g. in Settings) and result in **full account and data deletion** (or a clear path to complete it, e.g. link to web).

- **Current state:** Settings has “Update password” and “Log out” only. No “Delete account” option.  
- **Required:** Add a “Delete account” control (e.g. in Account security). User confirms → backend deletes auth user (and optionally related data) → app signs out and shows confirmation.  
- **Implementation:** Use a Supabase Edge Function that verifies the caller’s JWT, then uses the service role to delete that user from `auth.users`. Client calls the function then signs out. See “Prioritized fix plan” below.

---

## 4. Restore purchases flow

- **Settings:** “Restore purchases” button; calls `restore()` from SubscriptionContext; shows outcome via `getRestoreOutcome()`. ✓  
- **Paywall:** “Restore purchases” link; `handleRestore` in usePaywallState; outcome card (success / no purchases / failed). ✓  
- **Compliance:** Restore is visible and functional on both surfaces. ✓  

---

## 5. Subscription compliance surfaces

- **Manage subscription:** Settings and paywall (when already Pro). Opens RevenueCat management URL or platform fallback. ✓  
- **Paywall footer:** Renewal, cancellation (24 hours before period end), and “Manage in device settings” disclosed. ✓  
- **Terms / Privacy on paywall:** Not linked on the paywall screen. **Action:** Add “Terms of Service” and “Privacy Policy” links below the paywall footer (P1).

---

## 6. Placeholder metadata and links

- **app.json:** `name: "PropFolio"`, `slug: "propfolio"`, `version: "1.0.0"`, `bundleIdentifier: "com.propfolio.app"`. No obvious test placeholders.  
- **Legal URLs:** Defaults `https://prop-folio.vercel.app/privacy` and `https://prop-folio.vercel.app/terms`. **Action:** Before release, ensure these URLs are live and that production env overrides are set if different.  
- **Billing help:** `getBillingHelpUrl()` returns empty if env unset; Settings shows inline help. ✓  
- **Product IDs:** `billing.ts` uses placeholder IDs (`com.propfolio.premium.monthly`, etc.). Replace with real App Store / Play product IDs when creating products.

---

## 7. Dead links and hardcoded test values

- **Dead links:** No hardcoded test URLs in app code. Risk is default legal URLs (prop-folio.vercel.app) returning 404 if not yet published.  
- **Hardcoded test values:** None found. Demo user (`demo@propfolio.app`) is only used when Supabase env is unset; production should have env set.  
- **Simulate at limit:** Dev-only (__DEV__); toggle handler exists but the Switch UI may be missing from the Debug card in Settings (state/handler present, no Switch in current render). Low impact; dev-only.

---

## 8. Demo-only and __DEV__ code

- **AuthContext:** `DEMO_USER` used only when `getSupabase()` is null (no Supabase env). Production with env set never uses demo user. ✓  
- **subscriptionDebugOverrides:** All getters/setters no-op when `!__DEV__`. ✓  
- **Diagnostics / analytics:** Logs and diagnostics guarded by `__DEV__`. ✓  
- **Settings Debug section:** Entire block wrapped in `__DEV__`. ✓  

No demo-only code paths run in production when configured correctly.

---

## 9. Crash-prone code paths

- **getSupabase():** Returns null when env missing; callers (auth, import, subscription) handle null. ✓  
- **RevenueCat:** Lazy `require('react-native-purchases')` in try/catch; returns null on web or when unavailable. ✓  
- **crash reporting:** Dynamic require in _layout.tsx; null on failure. ✓  
- **Edge Function invoke:** `edgeFunctions.ts` checks getSupabase() and handles error. ✓  
- **Optional:** Ensure any `Linking.openURL` / `handleOpenUrl` has try/catch (already present in Settings).

---

## 10. Prioritized fix plan

| Priority | Item | Action |
|----------|------|--------|
| **P0** | Delete account | Add Edge Function `delete-account`; add `deleteAccount()` in AuthContext; add “Delete account” in Settings with confirmation. |
| **P1** | Paywall Terms/Privacy | Add “Terms of Service” and “Privacy Policy” links below paywall footer (use legalUrls). |
| **P1** | iOS privacy manifest | **Done.** `expo.ios.privacyManifests` in app.json (UserDefaults CA92.1). |
| **P2** | Legal URL verification | Before release, verify default or env legal URLs resolve; document in launch checklist. |
| **P2** | Build number | Ensure iOS build number is set for each submission (EAS or app.json). |
| **P2** | Simulate at limit UI | Optionally add Switch in Settings Debug section for QA (low priority). |

---

## 11. Manual configuration steps (outside codebase)

- **Supabase:** Deploy the new `delete-account` Edge Function (e.g. `supabase functions deploy delete-account` from repo root). No extra secrets required; Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for Edge Functions.  
- **App Store Connect:** Provide privacy policy URL in app metadata; complete App Privacy “nutrition” labels; set up subscription group and products.  
- **Legal:** Publish privacy policy and terms at the URLs used by the app (or set env to your URLs).  
- **EAS / build:** Configure iOS build number and version for each build.

---

## 12. QA checklist (post-fixes)

- [ ] Delete account: Tap “Delete account” in Settings → confirm → account deleted and signed out; cannot sign back in with same user.  
- [ ] Restore purchases: Settings and Paywall restore flows show correct outcome.  
- [ ] Privacy Policy / Terms: Open from Settings and from Paywall; URLs load.  
- [ ] Paywall: Subscription disclosure and Terms/Privacy links visible.  
- [ ] Build: Production iOS build succeeds; no crash when Supabase/RevenueCat configured.  
- [ ] Demo mode: With Supabase env unset, app runs with demo user; with env set, no demo user.

---

## 13. Implemented changes (this pass)

- **P0 Delete account:** `supabase/functions/delete-account/index.ts` (Edge Function); `edgeFunctions.deleteAccount()`; `AuthContext.deleteAccount()`; Settings "Delete account" with confirmation and loading state.
- **P1 Paywall legal links:** `PaywallContent.tsx` — Terms of Service and Privacy Policy links below footer (native only).
- **P1 iOS privacy manifest:** `app.json` — `expo.ios.privacyManifests` with UserDefaults (CA92.1).

---

## 14. Files created, changed, or deleted

| Action | File | Why |
|--------|------|-----|
| Created | `docs/APP-STORE-READINESS-AUDIT.md` | Audit and prioritized fix plan. |
| Created | `supabase/functions/delete-account/index.ts` | Edge Function to delete authenticated user (App Store requirement). |
| Changed | `expo-app/src/services/edgeFunctions.ts` | Added `deleteAccount()` to invoke `delete-account` function. |
| Changed | `expo-app/src/contexts/AuthContext.tsx` | Added `deleteAccount()`; calls API then clears session. |
| Changed | `expo-app/app/(tabs)/settings.tsx` | Added "Delete account" with confirmation and loading state; only when `isAuthConfigured`. |
| Changed | `expo-app/src/features/paywall/PaywallContent.tsx` | Terms of Service and Privacy Policy links below footer (subscription compliance). |
| Changed | `expo-app/app.json` | Added `expo.ios.privacyManifests` (UserDefaults CA92.1). |
| Changed | `docs/APP-STORE-READINESS-AUDIT.md` | Updated manual steps; added implemented changes and file list. |
