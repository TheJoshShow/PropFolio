# PropFolio – Required Metadata Checklist (App Store Connect)

**Purpose:** Ensure all required and recommended App Store Connect metadata and in-app content are complete before submission.  
**Date:** 2025-03-12.

---

## 1. App Store Connect – Required fields

| Field | Requirement | PropFolio value / action |
|-------|-------------|---------------------------|
| **App name** | Required | PropFolio |
| **Subtitle** | Optional but recommended | e.g. "Property investment analysis" – keep under 30 chars. |
| **Privacy Policy URL** | Required | Same as in-app: `https://propfolio.app/privacy` or EXPO_PUBLIC_PRIVACY_POLICY_URL. Must resolve. |
| **Support URL** | Required | e.g. `https://propfolio.app/support` or mailto page; must resolve. Match in-app Contact/Support. |
| **Category** | Required | e.g. Finance or Productivity; choose primary and secondary. |
| **Age rating** | Required | Complete questionnaire; no restricted content expected. |
| **Version** | Required | Match app.json version (e.g. 1.0.0). |
| **Build** | Required | Upload build; build number from EAS or Xcode. |

---

## 2. Subscription / In-App Purchase metadata

| Item | Requirement | PropFolio action |
|------|-------------|------------------|
| **Subscription group** | If using auto-renewable subscriptions | Create in App Store Connect; add monthly and annual products. |
| **Product IDs** | Must match RevenueCat and app config | e.g. com.propfolio.premium.monthly, com.propfolio.premium.annual; ensure billing.ts / RevenueCat dashboard align. |
| **Localized names and descriptions** | Required for each product | Fill for each locale. |
| **Price** | Set for each territory | Configure in App Store Connect. |

---

## 3. Screenshots and preview

| Item | Requirement | PropFolio action |
|------|-------------|------------------|
| **iPhone screenshots** | Required (various sizes) | Capture from release build; show Home, Import, Portfolio, Settings (with Restore / Legal visible). |
| **Optional: iPad** | If supports iPad | app.json has supportsTablet: true; provide if marketing iPad. |
| **App Preview video** | Optional | Not required. |

---

## 4. In-app content alignment

| Claim / element | Where | Ensure |
|-----------------|--------|--------|
| **"Should I buy this property?"** | Home subtitle | Described as decision support; no return guarantee. |
| **Deal score / confidence** | Analysis screens | Framed as model output; consider short disclaimer (see user_trust_and_disclaimer_recommendations.md). |
| **Rent estimate** | Import success | "Estimated monthly rent" and "estimate only" already used. |
| **Free tier** | Import, paywall | "2 free imports" and "3rd blocked" match behavior. |
| **Restore / Manage** | Settings, Paywall | Visible and working; copy matches behavior. |
| **Terms / Privacy** | Settings, Paywall | Links open correct URLs. |
| **Contact / Support** | Settings | Add row; opens support URL or mailto. |

---

## 5. Optional but recommended

| Item | Notes |
|------|--------|
| **Terms (EULA)** | If Apple asks for EULA, point to Terms of Service URL. |
| **Keywords** | Use for search; avoid competitor names and misleading terms. |
| **Promotional text** | Can be updated without new version. |
| **What's New** | For first release, brief description of features. |

---

## 6. Pre-submission verification

- [ ] All required App Store Connect fields filled.
- [ ] Privacy Policy URL and Support URL resolve.
- [ ] In-app Terms, Privacy, Support, Restore, Manage subscription, Delete account all reachable and correct.
- [ ] Subscription products created and linked; purchase and restore tested.
- [ ] Build uploaded and selected for submission.
- [ ] Version and build number match app.json / EAS.
- [ ] No placeholder or test-only content in production build (debug UI is __DEV__ only).
- [ ] Review notes prepared (test account or demo instructions if needed).

Use this checklist together with **app_store_compliance_audit.md** and **app_review_risk_register.md** for submission.
