# PropFolio — App Store Launch Governance Checklist

**Purpose:** Pre–App Store launch governance and compliance; ensures legal, support, and platform requirements are met.  
**Audience:** Founders, product, engineering  
**Date:** 2025-03-12

---

## 1. Required URLs and Legal

| # | Item | Reference | Status |
|---|------|-----------|--------|
| 1 | Privacy Policy URL live and matches in-app and App Store Connect | [final_metadata_requirements.md](../docs/final_metadata_requirements.md) | ☐ |
| 2 | Terms of Service URL live and linked in-app (Settings, Paywall, Sign-up) | [final_legal_and_support_matrix.md](../docs/final_legal_and_support_matrix.md) | ☐ |
| 3 | Support URL live and matches App Store Connect | [final_metadata_requirements.md](../docs/final_metadata_requirements.md) | ☐ |
| 4 | All support/legal links use safe open with failure Alert | [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md) | ☐ |
| 5 | In-app legal disclaimer: “Informational only; not investment, tax, or legal advice” | [product_risk_disclosures_memo.md](product_risk_disclosures_memo.md) | ☐ |

---

## 2. Account and Subscription

| # | Item | Reference | Status |
|---|------|-----------|--------|
| 6 | Account deletion available in-app with confirmation; backend removes/anonymizes user data | [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md) | ☐ |
| 7 | Restore purchases on Paywall and Settings with clear outcome messaging | [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md) | ☐ |
| 8 | Manage subscription: link to RevenueCat or App Store; fallback copy (Settings app → Subscriptions) | [final_legal_and_support_matrix.md](../docs/final_legal_and_support_matrix.md) | ☐ |
| 9 | Paywall footer: Apple-compliant billing copy (charge to Apple ID, renewal, manage in device settings) | [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md) | ☐ |
| 10 | Subscription product IDs and metadata in App Store Connect aligned with app (RevenueCat) | [final_metadata_requirements.md](../docs/final_metadata_requirements.md) | ☐ |

---

## 3. Store Copy and Positioning

| # | Item | Reference | Status |
|---|------|-----------|--------|
| 11 | App Store subtitle and description do not overclaim (no “confidence score” or “deal score” unless shipped) | [launch_copy_recommendations.md](../docs/launch_copy_recommendations.md), [feature_claims_gap_report.md](../docs/feature_claims_gap_report.md) | ☐ |
| 12 | In-app copy matches MVP (no promise of scoring or “see in Portfolio” list until implemented) | [mvp_truthfulness_plan.md](../docs/mvp_truthfulness_plan.md), [launch_copy_recommendations.md](../docs/launch_copy_recommendations.md) | ☐ |
| 13 | No demo or dev-only messaging in production build; production env set so demo mode is off | [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md) | ☐ |

---

## 4. Environment and Build

| # | Item | Reference | Status |
|---|------|-----------|--------|
| 14 | Production env set: EXPO_PUBLIC_SUPABASE_*, EXPO_PUBLIC_REVENUECAT_API_KEY_IOS, legal URLs | [final_metadata_requirements.md](../docs/final_metadata_requirements.md), [production_env_matrix.md](../docs/production_env_matrix.md) | ☐ |
| 15 | No __DEV__-only UI or debug menus in release build | [release_blocker_report.md](../expo-app/release_blocker_report.md) | ☐ |
| 16 | Crash reporting (Firebase Crashlytics): production-safe config; Privacy Policy discloses crash/error reporting | [MONITORING_SETUP.md](../expo-app/docs/MONITORING_SETUP.md) | ☐ |
| 17 | Version and build number match app.json and EAS; build uploaded and selected in App Store Connect | [final_metadata_requirements.md](../docs/final_metadata_requirements.md) | ☐ |

---

## 5. App Store Connect Metadata

| # | Item | Reference | Status |
|---|------|-----------|--------|
| 18 | App name, category, age rating completed | [final_metadata_requirements.md](../docs/final_metadata_requirements.md) | ☐ |
| 19 | Privacy Policy URL and Support URL entered and resolve correctly | [final_metadata_requirements.md](../docs/final_metadata_requirements.md) | ☐ |
| 20 | Subscription group and products created; pricing and localized names/descriptions filled | [final_metadata_requirements.md](../docs/final_metadata_requirements.md) | ☐ |
| 21 | Screenshots and previews (if required) uploaded; no placeholder or dev content | ☐ |

---

## 6. Governance and Sign-Off

| # | Item | Status |
|---|------|--------|
| 22 | Owner for launch compliance designated (e.g., CTO or CEO) | ☐ |
| 23 | Pre-submission checklist in [final_metadata_requirements.md](../docs/final_metadata_requirements.md) completed | ☐ |
| 24 | Decision to launch (or delay) documented (e.g., founder/board memo or consent) | ☐ |
| 25 | Post-launch: monitor review feedback and support for compliance issues; update governance docs as needed | ☐ |

---

## 7. Cross-References

- **Hardening and legal matrix:** [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md), [final_legal_and_support_matrix.md](../docs/final_legal_and_support_matrix.md)
- **Metadata and env:** [final_metadata_requirements.md](../docs/final_metadata_requirements.md), [production_env_matrix.md](../docs/production_env_matrix.md)
- **Product risk:** [product_risk_disclosures_memo.md](product_risk_disclosures_memo.md)
- **Privacy:** [privacy_and_data_governance_checklist.md](privacy_and_data_governance_checklist.md)
- **Release blocker sweep:** [release_blocker_report.md](../expo-app/release_blocker_report.md)

---

*Part of the PropFolio founder document package. Not legal advice.*
