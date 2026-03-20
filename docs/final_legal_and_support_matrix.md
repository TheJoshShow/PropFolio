# PropFolio — Final Legal and Support Matrix

**Purpose:** Single reference for legal URLs, support, in-app placement, and safe-open behavior. App Store compliance.  
**Source:** app_store_compliance_audit.md, release_blocker_report.md  
**Date:** 2025-03-12

---

## 1. URL configuration (environment)

| Purpose | Env variable | Default (if unset) | Used in |
|---------|--------------|---------------------|--------|
| **Privacy Policy** | `EXPO_PUBLIC_PRIVACY_POLICY_URL` | `https://propfolio.app/privacy` | Settings → Legal; Paywall footer; Sign-up agreement |
| **Terms of Service** | `EXPO_PUBLIC_TERMS_URL` | `https://propfolio.app/terms` | Settings → Legal; Paywall footer; Sign-up agreement |
| **Contact / Support** | `EXPO_PUBLIC_SUPPORT_URL` | `https://propfolio.app/support` | Settings → Help & support → Contact support |
| **Billing help** | `EXPO_PUBLIC_BILLING_HELP_URL` | (empty) | Settings → Help & support → "Billing help & FAQ" (row only if URL set) |

**Code:** `expo-app/src/config/legalUrls.ts` — `getPrivacyPolicyUrl()`, `getTermsUrl()`, `getSupportUrl()`, `getBillingHelpUrl()`.

**App Store Connect:** Privacy Policy URL and Support URL must match the same values (or resolve to same content). Production should set env vars and ensure pages load.

---

## 2. In-app placement and safe-open behavior

| Link / action | Screen(s) | Label / behavior | Failure handling |
|---------------|-----------|-------------------|-------------------|
| **Privacy Policy** | Settings (Legal), Paywall (footer), Sign-up (agreement) | "Privacy Policy" | `openUrlSafe()` → Alert "Cannot open link" / "The link could not be opened." if URL cannot be opened |
| **Terms of Service** | Settings (Legal), Paywall (footer), Sign-up (agreement) | "Terms of Service" | Same as above |
| **Contact support** | Settings (Help & support) | "Contact support" | Same as above |
| **Billing help** | Settings (Help & support) | "Billing help & FAQ" (only if EXPO_PUBLIC_BILLING_HELP_URL set) | Same as above |
| **Restore purchases** | Settings (Subscription), Paywall | "Restore purchases" | In-app outcome messaging (success, no purchases, failed, offline) |
| **Manage subscription** | Settings (Subscription), Paywall (already Pro) | "Manage subscription" | Opens RevenueCat or App Store URL; if open fails, Alert with fallback copy (iOS: Settings app → Subscriptions) |
| **Delete account** | Settings (Account security) | "Delete account" | Confirmation → Edge Function → sign out; error Alert on failure |

**Implementation:** All external links (Terms, Privacy, Support, Billing help) use `openUrlSafe()` from `expo-app/src/utils/openLink.ts`: `Linking.canOpenURL` → `Linking.openURL`; on failure or when `canOpenURL` is false, user sees Alert. No silent failure.

---

## 3. Subscription and billing copy (in-app)

| Location | Content |
|----------|--------|
| **Paywall footer** | "Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your device settings." |
| **Settings (iOS)** | Hint: "On iPhone: Settings → [Your Name] → Subscriptions" |
| **Manage subscription fallback** | "To manage or cancel your subscription, open the Settings app, tap your name at the top, then tap Subscriptions." |
| **Billing help (no URL)** | "Questions about your subscription? Use Manage subscription above or Contact support." |

---

## 4. Legal disclaimer (in-app)

| Location | Content |
|----------|--------|
| **Settings → Legal** | "PropFolio is for informational use only and does not provide investment, tax, or legal advice. Verify all numbers before making decisions." |

Terms and Privacy Policy documents (at the configured URLs) should state the same and cover data practices (auth, properties, usage events, RevenueCat, Sentry, third-party APIs via Edge Functions).

---

## 5. Sign-up agreement

| Location | Content |
|----------|--------|
| **Sign-up screen** | "By creating an account you agree to our Terms of Service and Privacy Policy." Links use `openUrlSafe()`. |

---

*See app_store_hardening_changes.md, sentry_privacy_decision.md, and final_metadata_requirements.md.*
