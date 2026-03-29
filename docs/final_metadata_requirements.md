# PropFolio — Final Metadata Requirements (App Store Connect)

**Purpose:** Single reference for App Store Connect metadata and in-app alignment before submission.  
**Source:** app_store_compliance_audit.md, release_blocker_report.md, required_metadata_checklist.md  
**Date:** 2025-03-12

---

## 1. Required App Store Connect fields

| Field | Requirement | PropFolio value / action |
|-------|-------------|---------------------------|
| **App name** | Required | PropFolio |
| **Subtitle** | Optional, recommended | e.g. "Property investment analysis" (≤30 chars). Must not overpromise; align with shipped features. |
| **Privacy Policy URL** | Required | Must match in-app: set `EXPO_PUBLIC_PRIVACY_POLICY_URL` or use default `https://prop-folio.vercel.app/privacy`. URL must resolve. |
| **Support URL** | Required | Must match in-app Contact support: set `EXPO_PUBLIC_SUPPORT_URL` or use default `https://prop-folio.vercel.app/support`. Can be support page or mailto. Must resolve. |
| **Category** | Required | e.g. Finance or Productivity; choose primary and optional secondary. |
| **Age rating** | Required | Complete questionnaire; no restricted content expected. |
| **Version** | Required | Match app.json version (e.g. 1.0.0). |
| **Build** | Required | Upload build; build number from EAS or Xcode. |

---

## 2. Subscription / In-App Purchase metadata

| Item | Requirement | PropFolio action |
|------|-------------|------------------|
| **Subscription group** | Required for auto-renewable subscriptions | Create in App Store Connect; add monthly and annual products. |
| **Product IDs** | Must match RevenueCat and app | e.g. `com.propfolio.premium.monthly`, `com.propfolio.premium.annual`; align with billing.ts and RevenueCat dashboard. |
| **Localized names and descriptions** | Required per product | Fill for each locale. |
| **Price** | Per territory | Configure in App Store Connect. |

---

## 3. In-app content alignment

| Claim / element | Where | Requirement |
|-----------------|--------|-------------|
| **Restore / Manage** | Settings, Paywall | Visible and functional; copy matches behavior. |
| **Terms / Privacy / Support** | Settings, Paywall, Sign-up | All use `openUrlSafe`; same URLs as Connect where applicable. |
| **Account deletion** | Settings | In-app path with confirmation; Edge Function deletes auth user. |
| **Paywall billing copy** | Paywall footer | Apple-compliant: charge to Apple ID, renewal, manage in device settings. |
| **Legal disclaimer** | Settings → Legal | "Informational use only; not investment, tax, or legal advice." |

---

## 4. Release environment requirements (summary)

**Client (expo-app) — set at build time (EAS or .env):**

| Variable | Required for release | Notes |
|----------|------------------------|--------|
| EXPO_PUBLIC_SUPABASE_URL | Yes | Production Supabase project URL. |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Yes | Anon key only; never service role. |
| EXPO_PUBLIC_REVENUECAT_API_KEY_IOS | Yes | RevenueCat public iOS key. |
| EXPO_PUBLIC_PRIVACY_POLICY_URL | Recommended | Must resolve; match App Store Connect. |
| EXPO_PUBLIC_TERMS_URL | Recommended | Must resolve. |
| EXPO_PUBLIC_SUPPORT_URL | Recommended (App Store) | Must resolve; match App Store Connect. |
| EXPO_PUBLIC_BILLING_HELP_URL | Optional | If set, used for Billing help link. |

**Full detail:** See `docs/production_env_matrix.md` and `docs/app_store_release_env_checklist.md`.

**Critical:** Set EXPO_PUBLIC_SUPABASE_* and EXPO_PUBLIC_REVENUECAT_API_KEY_IOS so demo mode is never active and subscriptions work. Set Privacy and Support URLs so they resolve and match App Store Connect.

---

## 5. Pre-submission verification

- [ ] All required App Store Connect fields filled.
- [ ] Privacy Policy URL and Support URL resolve and match in-app.
- [ ] In-app Terms, Privacy, Support, Restore, Manage subscription, Delete account reachable and use safe-open (Alert on link failure).
- [ ] Paywall footer shows Apple-compliant billing copy.
- [ ] Subscription products created and linked; purchase and restore tested.
- [ ] Build uploaded and selected; version and build number match app.json / EAS.
- [ ] No demo or dev-only UI in release build; production env set so demo mode is never active.
- [ ] Crash reporting (Firebase Crashlytics) is documented for engineering in `expo-app/docs/MONITORING_SETUP.md`; ensure Privacy Policy reflects Google/Firebase data processing as required.

---

*See app_store_hardening_changes.md, final_legal_and_support_matrix.md, and `../expo-app/docs/MONITORING_SETUP.md`.*
