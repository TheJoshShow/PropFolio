# PropFolio App Review Risk Register

**Purpose:** Identify and mitigate risks that could lead to App Store rejection or follow-up questions.  
**Date:** 2025-03-12.

---

## 1. High priority

| Risk | Description | Mitigation | Status |
|------|-------------|------------|--------|
| **No in-app Contact/Support** | Reviewer or user cannot find how to contact support. | Added Settings → Help & support → "Contact support" (getSupportUrl()). | ✅ Done |
| **Sentry sendDefaultPii: true** | Sending default PII to Sentry may conflict with Privacy Policy or trigger review questions. | Set `sendDefaultPii: false` in Sentry.init. | ✅ Done |
| **Legal URLs not set in production** | Default propfolio.app URLs may 404 if site not live. | Set EXPO_PUBLIC_PRIVACY_POLICY_URL and EXPO_PUBLIC_TERMS_URL in production; verify URLs resolve before submit. | Checklist |

---

## 2. Medium priority

| Risk | Description | Mitigation | Status |
|------|-------------|------------|--------|
| **Investment claims** | Wording could be read as promising returns. | Keep "Should I buy this property?" as decision support; ensure Terms/Privacy state app is informational only, not investment advice; add short disclaimer near score if needed. | Doc + optional copy |
| **Rent/property estimates** | Rent or value estimates could be seen as guarantees. | Already using "Estimated monthly rent" and "estimate only; verify with local sources"; keep and ensure same pattern elsewhere. | ✅ Done |
| **Account deletion scope** | User may assume all data everywhere is deleted. | Privacy Policy should state: auth and app data deleted; RevenueCat/store may retain purchase history per their policies. | Doc |
| **Restore purchases visibility** | Must be easy to find. | Already on Settings and Paywall; ensure not buried in nested screens. | ✅ Done |
| **Manage subscription** | Must open system or clear fallback. | Implemented with RevenueCat URL and App Store subscriptions fallback; fallback copy explains Settings → Subscriptions. | ✅ Done |

---

## 3. Lower priority

| Risk | Description | Mitigation | Status |
|------|-------------|------------|--------|
| **Demo mode in review** | Reviewer without backend may see demo user. | Document in Review Notes that test account or backend URL can be provided; demo mode is intentional when backend not configured. | Review notes |
| **Debug section** | If __DEV__ were misconfigured, debug UI could ship. | Debug section and overrides are gated by __DEV__; production build has __DEV__ false. | ✅ Safe |
| **Broken external links** | Terms/Privacy/Support links 404. | Pre-submit: verify all configured URLs resolve; use env for production. | Checklist |
| **Subscription product IDs** | Placeholder IDs in code (e.g. com.propfolio.premium.monthly). | Ensure App Store Connect product IDs match config used by RevenueCat; document in metadata checklist. | Checklist |

---

## 4. Legal and disclosure

| Risk | Description | Mitigation | Status |
|------|-------------|------------|--------|
| **Terms/Privacy not accepted** | Apple may expect clear acceptance flow for in-app accounts. | Terms and Privacy are linked at sign-up (if present) and in Settings; consider adding "By signing up you agree to Terms and Privacy Policy" on sign-up screen. | Optional |
| **Subscription terms** | Must be clear about renewal and cancellation. | Paywall footer states charge to Apple ID, auto-renewal, and manage in device settings. | ✅ Done |
| **Data collection disclosure** | Must match Privacy Nutrition Labels and Privacy Policy. | Use privacy_data_map.md to fill labels and policy; no hidden collection. | Doc |

---

## 5. Crashes and stability

| Risk | Description | Mitigation | Status |
|------|-------------|------------|--------|
| **Crash on launch** | Misconfiguration or missing env. | Demo mode allows run without backend; validate production env and test account before submit. | Test |
| **Crash when deleting account** | Edge Function or auth failure. | Delete flow shows error alert; recommend testing with real account. | Test |

---

## 6. Summary of required actions

1. **Code:** Add Contact/Support URL and Settings row; set Sentry `sendDefaultPii: false`.
2. **Config:** Ensure production env has Privacy Policy URL, Terms URL, and Support URL (or mailto); verify links work.
3. **Docs:** Privacy Policy updated to match privacy_data_map.md; state account deletion scope and Sentry/RevenueCat retention where relevant.
4. **Review notes:** Offer test account or backend instructions if reviewer needs full experience.
