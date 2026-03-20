# PropFolio — App Store Submission Audit

**Audit focus:** App icons, launch screen, permission strings, privacy references, external links, placeholder copy.  
**Scope:** expo-app (iOS).  
**Date:** [DATE]

---

## 1. App icons

| Item | Status | Notes |
|------|--------|------|
| **App icon path** | ⚠️ Verify | `app.json` references `./assets/images/icon.png`. Expo/iOS requires this (or generated variants) for the home screen icon. |
| **Icon presence** | ⚠️ Verify | Ensure `expo-app/assets/images/icon.png` exists. Recommended: **1024×1024 px** (Expo generates sizes). If missing, add a 1024×1024 PNG; build will fail or use default otherwise. |
| **Adaptive icon (Android)** | N/A | iOS-only submission; Android icon not required for App Store. |

**Action:** Confirm `expo-app/assets/images/icon.png` exists and is 1024×1024 (or at least a square PNG). If the folder `assets/images/` is missing, create it and add `icon.png` and `splash-icon.png`.

---

## 2. Launch screen (splash)

| Item | Status | Notes |
|------|--------|------|
| **Splash image path** | ⚠️ Verify | `app.json` references `./assets/images/splash-icon.png` with `resizeMode: "contain"` and `backgroundColor: "#ffffff"`. |
| **Splash presence** | ⚠️ Verify | Ensure `expo-app/assets/images/splash-icon.png` exists. If missing, the build may fail or show a blank/Expo default splash. |
| **Background color** | OK | Set to `#ffffff`; matches common light launch. |
| **Resize mode** | OK | `contain` is appropriate for a logo. |

**Action:** Confirm `expo-app/assets/images/splash-icon.png` exists. Prefer a simple logo or wordmark that looks good centered on white. No placeholder text (e.g. "Splash") in the image.

---

## 3. Permission strings (iOS)

| Permission | Required? | Status | Notes |
|------------|-----------|--------|------|
| **Camera** | No | Not requested | App does not use camera. |
| **Photo Library** | No | Not requested | App does not access photos. |
| **Location** | No | Not requested | Address entry uses backend geocoding; no direct location API in client. |
| **Microphone** | No | Not requested | Not used. |
| **UserDefaults (privacy manifest)** | Yes | OK | `app.json` includes `privacyManifests.NSPrivacyAccessedAPITypes` with `NSPrivacyAccessedAPICategoryUserDefaults` and reason CA92.1 (required for App Store if you use UserDefaults). |

**Action:** None for current feature set. If you add camera, photo library, or location later, add the corresponding `usageDescription` keys under `expo.ios.infoPlist` (or via a config plugin).

---

## 4. Privacy references

| Item | Status | Notes |
|------|--------|------|
| **Privacy Policy URL** | OK | In-app (Settings, Paywall) and config: `getPrivacyPolicyUrl()`; fallback `https://propfolio.app/privacy`. Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` for production. |
| **Terms of Service URL** | OK | In-app (Settings, Paywall, Sign-up); fallback `https://propfolio.app/terms`. Set `EXPO_PUBLIC_TERMS_URL` for production. |
| **In-app disclosure** | OK | Settings includes disclaimer: "PropFolio is for informational use only and does not provide investment, tax, or legal advice." |
| **App Store Connect** | ⚠️ Before submit | Privacy Policy URL field must be set and must match (or redirect to) the in-app link. |

**Action:** Ensure production env has correct `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL`. Before submission, confirm the same URLs are in App Store Connect and that they load in Safari.

---

## 5. External links

| Link | Used in | Config / Fallback | Status |
|------|---------|-------------------|--------|
| Privacy Policy | Settings, Paywall | `legalUrls.ts`: env or `https://propfolio.app/privacy` | ⚠️ Placeholder domain |
| Terms | Settings, Paywall, Sign-up | `legalUrls.ts`: env or `https://propfolio.app/terms` | ⚠️ Placeholder domain |
| Support | Settings | `legalUrls.ts`: env or `https://propfolio.app/support` | ⚠️ Placeholder domain |
| Billing help | Settings (if URL set) | `EXPO_PUBLIC_BILLING_HELP_URL` or empty | Optional |
| Subscription management | Settings, Paywall | System URL (Apple) or fallback message | OK |

**Broken links:** The fallback domain `https://propfolio.app` is a placeholder. If that domain is not yet live, either (1) set env vars to your real hosted URLs, or (2) deploy a simple site at propfolio.app with `/privacy`, `/terms`, and `/support` (or redirects). In-app links use safe open (try/catch + Alert) in Settings and Paywall; Sign-up uses `Linking.openURL` directly—consider wrapping in the same safe-open helper for consistency.

**Action:** Before submission, set production env so all three (Privacy, Terms, Support) point to live, working URLs. Verify in Safari. No broken links during review.

---

## 6. Placeholder copy

| Location | Type | Status | Notes |
|----------|------|--------|-------|
| **Input placeholders** | Placeholder text in fields | OK | "you@example.com", "••••••••", "At least 8 characters", "123 Main St, City, ST 12345", etc. These are appropriate hints, not marketing placeholders. |
| **Paywall / benefits** | In-app copy | OK | `paywallCopy.ts`: real benefits and footer; no "Lorem" or "TBD". |
| **Billing config** | Code comment | OK | `billing.ts` mentions "placeholder" product IDs; values are real identifiers (e.g. `com.propfolio.premium.monthly`). Replace with your App Store Connect product IDs if different. |
| **Import (Zillow/Redfin)** | User-facing message | OK | Previously "coming soon"; updated to actionable copy: "Use Or enter address below to add this property by address." |
| **Portfolio empty state** | In-app copy | OK | "No properties yet" and CTA to Add property—not placeholder. |

**Action:** None. No remaining user-facing placeholder or "Lorem" copy identified in app code.

---

## Summary

| Area | Result | Action before submit |
|------|--------|----------------------|
| App icons | Verify files exist | Add `assets/images/icon.png` (1024×1024) if missing. |
| Launch screen | Verify file exists | Add `assets/images/splash-icon.png` if missing. |
| Permission strings | OK | No extra permissions needed for current features. |
| Privacy references | OK | Set env URLs; match Connect. |
| External links | Set live URLs | Use real Privacy, Terms, Support URLs; test in Safari. |
| Placeholder copy | OK | No changes required. |

---

*Re-run this audit when adding permissions, new links, or new screens. Use `release_checklist.md` for per-version submit steps.*
