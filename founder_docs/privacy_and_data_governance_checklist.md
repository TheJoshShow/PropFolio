# PropFolio — Privacy and Data Governance Checklist

**Purpose:** Privacy policy, data handling, and governance practices for the iOS app and backend; supports launch and due diligence.  
**Audience:** Founders, product, engineering  
**Date:** 2025-03-12

---

## 1. Privacy Policy

| # | Item | Status |
|---|------|--------|
| 1 | Privacy Policy published at a stable URL (e.g., prop-folio.vercel.app/privacy) | ☐ |
| 2 | URL matches in-app links and App Store Connect ([final_metadata_requirements.md](../docs/final_metadata_requirements.md)) | ☐ |
| 3 | Policy describes: what data is collected (account, property, usage), how it’s used, storage, sharing, and user rights | ☐ |
| 4 | Third-party services disclosed (e.g., Supabase, RevenueCat, analytics; crash SDK if added) | ☐ |
| 5 | Crash/error reporting (Firebase Crashlytics) disclosed; no PII by default ([MONITORING_SETUP.md](../expo-app/docs/MONITORING_SETUP.md)) | ☐ |
| 6 | Data retention and deletion (e.g., account deletion) described | ☐ |
| 7 | Contact for privacy questions (e.g., support URL or email) included | ☐ |
| 8 | Policy updated when practices change; last updated date shown | ☐ |

**[Attorney review recommended]** for Privacy Policy wording and jurisdiction-specific requirements (e.g., CCPA, state laws).

---

## 2. In-App and Platform Alignment

| # | Item | Status |
|---|------|--------|
| 9 | In-app links to Privacy Policy (Settings, Paywall, Sign-up) use safe open; Alert on failure | ☐ |
| 10 | Account deletion available in-app with confirmation; backend removes or anonymizes user data per policy | ☐ |
| 11 | No collection of sensitive data (e.g., SSN, payment card) in-app; payments via Apple IAP only | ☐ |
| 12 | App Store Connect Privacy Nutrition Labels / App Privacy form completed accurately | ☐ |
| 13 | iOS privacy manifests (e.g., NSPrivacyAccessedAPITypes) current if required | ☐ |

---

## 3. Data Handling Practices

| # | Item | Status |
|---|------|--------|
| 14 | Auth and user data stored in Supabase (or equivalent) with access control and encryption at rest/transit | ☐ |
| 15 | Property and portfolio data scoped to user (row-level or equivalent); no cross-user access | ☐ |
| 16 | Usage/analytics: no PII in default config; __DEV__ logs sanitized; production events minimal and documented | ☐ |
| 17 | No paid or sensitive API keys in client; secrets in backend/Edge Function secrets only | ☐ |
| 18 | Subscriptions: RevenueCat/Apple only; no card data stored by Company | ☐ |

---

## 4. Governance and Operations

| # | Item | Status |
|---|------|--------|
| 19 | Owner for privacy and data governance designated (e.g., CTO or CEO) | ☐ |
| 20 | Process for handling user data requests (access, deletion, portability) documented and tested | ☐ |
| 21 | Process for handling breaches or incidents (notification, remediation) outlined; counsel involved as needed | ☐ |
| 22 | Contractors and vendors that process user data are under contract (confidentiality, data use limits) | ☐ |
| 23 | No sale of user personal information; stated in Privacy Policy and honored in practice | ☐ |

---

## 5. PropFolio-Specific References

- **Legal URLs:** [expo-app/src/config/legalUrls.ts](../expo-app/src/config/legalUrls.ts) — Privacy Policy URL from env or default.
- **Account deletion:** Edge Function `delete-account`; in-app flow in Settings; see [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md).
- **Crash reporting:** Firebase Crashlytics — document Google/Firebase processing in Privacy Policy; engineering details in [MONITORING_SETUP.md](../expo-app/docs/MONITORING_SETUP.md).
- **Terms and support:** [final_legal_and_support_matrix.md](../docs/final_legal_and_support_matrix.md).

---

## 6. Review Cadence

- **Before launch:** Full checklist; Privacy Policy and in-app links verified.
- **After material product or data changes:** Update Privacy Policy and checklist.
- **Annually or before major release:** Re-review with counsel for regulatory and platform changes.

---

*Part of the PropFolio founder document package. Not legal advice.*
