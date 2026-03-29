# PropFolio App Store Hardening — Changes Log

**Source of truth:** app_store_compliance_audit.md, release_blocker_report.md  
**Date:** 2025-03-12  
**Scope:** Contact/support, Privacy/Terms, Restore, Manage subscription, Account deletion, safe links, paywall billing copy, crash reporting privacy, demo/dev messaging, release env.

---

## 1. Verification summary (implemented or already present)

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Contact support link** | ✅ | Settings → Help & support → "Contact support" opens `getSupportUrl()` (EXPO_PUBLIC_SUPPORT_URL or https://prop-folio.vercel.app/support). |
| **Privacy Policy link** | ✅ | Settings → Legal; Paywall footer; Sign-up. URL from `getPrivacyPolicyUrl()`. |
| **Terms of Service link** | ✅ | Settings → Legal; Paywall footer; Sign-up. URL from `getTermsUrl()`. |
| **Restore purchases** | ✅ | Settings and Paywall; outcome messaging (success, no purchases, failed, offline). |
| **Manage subscription** | ✅ | Settings and Paywall (when already Pro); opens RevenueCat or App Store URL; fallback copy (Settings app → Subscriptions). |
| **Account deletion** | ✅ | Settings → Delete account → confirmation → Edge Function `delete-account` → sign out. Demo mode throws only when `getSupabase()` is null (production env must be set). |

---

## 2. Safe open behavior for support/legal links

| Location | Implementation |
|----------|----------------|
| **Settings** | Contact support, Billing help, Privacy Policy, Terms of Service all use `handleOpenUrl` → `openUrlSafe(url)`. Alert shown when link cannot be opened. |
| **Paywall** | Terms and Privacy use `openUrlSafe(getTermsUrl())` and `openUrlSafe(getPrivacyPolicyUrl())`. Alert on failure. |
| **Sign-up** | Terms and Privacy use `openUrlSafe(getTermsUrl())` and `openUrlSafe(getPrivacyPolicyUrl())`. |

**Utility:** `src/utils/openLink.ts` — `openUrlSafe(url)` uses `Linking.canOpenURL` then `Linking.openURL`; on failure or when URL cannot be opened, shows Alert: "Cannot open link" / "The link could not be opened."

---

## 3. Paywall billing copy (Apple-compliant)

| Item | Status |
|------|--------|
| **Footer text** | Visible in PaywallContent: `copy.footer` (PAYWALL_COPY.footer). |
| **Content** | "Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your device settings." |
| **Restore** | "Restore purchases" visible and functional on Paywall and Settings. |

---

## 4. Crash / error monitoring posture

The legacy third-party crash SDK has been removed. The app uses `src/services/monitoring` (dev-only console stubs; production no-op until Firebase Crashlytics or similar is integrated).

**Documentation:** See **`expo-app/docs/MONITORING_SETUP.md`** for Crashlytics setup; **`docs/archive/migrations/MIGRATION_SENTRY_TO_CRASHLYTICS_AUDIT.md`** for historical migration context only.

---

## 5. Demo-mode and dev-only messaging in production

| Item | Behavior |
|------|----------|
| **Demo user** | Used only when `getSupabase()` is null (EXPO_PUBLIC_SUPABASE_* not set). **Production must set** EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY so demo mode is never active. |
| **"Account deletion is not available in demo mode"** | Thrown only when `!getSupabase()`; with production env set, this path is never hit. |
| **Debug UI** | Settings "Debug (dev only)" section and "Log state to console" wrapped in `__DEV__`; not rendered in release build. |
| **subscriptionDebugOverrides** | Getters return false when `!__DEV__`; setters no-op. |
| **Forgot-password** | When auth not configured, shows generic "Password reset is not available. Please try again later." (no "Configure Supabase" in production). |

**Requirement:** For release build, set all required client env vars so Supabase is configured and demo mode is never shown.

---

## 6. Release env documentation

Release environment requirements are documented in:

- **docs/production_env_matrix.md** — All EXPO_PUBLIC_* and backend vars; where to set; public-safe vs. secret.
- **docs/app_store_release_env_checklist.md** — Pre–App Store release checklist; required/recommended client and backend vars.
- **expo-app/.env.example** — Template with EXPO_PUBLIC_* only; server secrets in Supabase Edge Function Secrets.

**Required for production:** EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_REVENUECAT_API_KEY_IOS. **Recommended:** EXPO_PUBLIC_PRIVACY_POLICY_URL, EXPO_PUBLIC_TERMS_URL, EXPO_PUBLIC_SUPPORT_URL (must match App Store Connect).

---

## 7. Changes made in this pass

1. **Monitoring:** `app/_layout.tsx` calls `initMonitoring()` from `src/services/monitoring` (stubs until Crashlytics).
2. **No code changes** to links, paywall copy, or auth flows — all already compliant; verification only.

---

*See final_legal_and_support_matrix.md, `../expo-app/docs/MONITORING_SETUP.md`, and final_metadata_requirements.md.*
