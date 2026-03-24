# PropFolio — Release Checklist

Use this for **each version** you submit to App Store Connect (TestFlight or App Store release).

---

## Versioning checklist

- [ ] **CFBundleShortVersionString** (Marketing version): Bump in `app.json` under `expo.version` (e.g. `1.0.0` → `1.0.1` or `1.1.0`). Must match **Version** in App Store Connect.
- [ ] **Build number** (CFBundleVersion): Bump in `app.json` under `expo.ios.buildNumber` (or in Xcode / EAS). Must be **strictly greater** than the last accepted build for this version. Example: first 1.0.0 build = `1`, next = `2`.
- [ ] **Consistency:** Same version + build number in: `app.json`, Xcode project (if used), EAS build (if used), and the build you upload.
- [ ] **Release notes:** "What's New" text prepared (see `app_store_metadata.md`).

---

## Build number checklist

- [ ] Current **last build number** for this version (from App Store Connect or last upload): ________
- [ ] New build number for this upload: ________ (must be greater)
- [ ] If using EAS: `app.json` or `eas.json` has correct `ios.buildNumber` (or auto-increment strategy).
- [ ] If using Xcode: Current Project → General → Identity → Build is updated.

---

## Signing checklist

- [ ] **Distribution certificate** valid (not expired). Check in Apple Developer → Certificates.
- [ ] **Provisioning profile** for App Store distribution includes the correct App ID and certificate.
- [ ] **Capabilities:** Push (if used), In-App Purchase, Sign in with Apple (if used) are enabled in the App ID and in the project.
- [ ] Archive is built with **Release** configuration and **Any iOS Device** (or correct destination).
- [ ] No development-only code paths that could cause rejections (e.g. debug menu in release).

---

## Final legal links checklist

Before submission, confirm these open correctly in **Safari** (not just in-app):

- [ ] **Privacy Policy URL** (App Store Connect + in-app): ________  
  - In-app: Settings → Privacy Policy. Env: `EXPO_PUBLIC_PRIVACY_POLICY_URL` or fallback `https://propfolio.app/privacy`.
- [ ] **Terms of Service URL** (in-app only; required for IAP/sign-up): ________  
  - In-app: Settings → Terms; Paywall footer; Sign-up agreement. Env: `EXPO_PUBLIC_TERMS_URL` or fallback `https://propfolio.app/terms`.
- [ ] **Support URL** (App Store Connect + in-app): ________  
  - In-app: Settings → Contact support. Env: `EXPO_PUBLIC_SUPPORT_URL` or fallback `https://propfolio.app/support`.
- [ ] **Marketing URL** (optional in Connect): ________  

**Rule:** The URLs in App Store Connect must match (or redirect to) the same content as the in-app links. Support URL must be valid and monitored during review.

---

## Final subscription product checklist

- [ ] **App Store Connect → In-App Purchases:** Subscription products exist (e.g. monthly, annual) and are **Approved**.
- [ ] **Product IDs** match the app (e.g. `com.propfolio.premium.monthly`, `com.propfolio.premium.annual`). See `expo-app/src/config/billing.ts` and RevenueCat.
- [ ] **RevenueCat:** Products attached to correct offering (e.g. `default`); entitlement (e.g. `pro_access`) matches app code.
- [ ] **Subscription metadata in Connect:** Display name, description, price, duration. Reviewers see these.
- [ ] **Restore purchases:** Works in the build; no gate that blocks app access if restore is not pressed.
- [ ] **Sandbox:** You (or a tester) completed at least one Sandbox purchase and saw Pro state.

---

## Final crash-free verification checklist

- [ ] **Crash reporting:** When Firebase Crashlytics is integrated, confirm production configuration and Privacy Policy disclosure (see repo root migration doc).
- [ ] **Last internal run:** No crash on cold start, login, import, paywall, restore, settings, account deletion.
- [ ] **TestFlight:** If a previous build had crashes, confirm the new build has fixes and no new crashes in the first 24 hours.
- [ ] **Symbols:** If using crash reporting, source maps / dSYMs uploaded so crashes are symbolicated.

---

## Pre-submit snapshot

Before clicking **Submit for Review**:

- [ ] Version and build number match the uploaded build.
- [ ] Screenshots and previews are for the correct device size and locale.
- [ ] App description, keywords, and "What's New" are filled and spell-checked.
- [ ] Age rating and Export Compliance (and any other compliance questions) are answered.
- [ ] Review notes (see `review_notes.md`) are pasted or adapted in App Review Information.
- [ ] Contact info for review is valid (phone/email).

---

*Duplicate this checklist for each release (e.g. copy to `release_checklist_1.0.0.md`) and tick items as you go.*
