# PropFolio App Store Compliance Audit

**Role:** iOS release compliance engineer  
**Goal:** Prepare for App Store submission and reduce rejection risk.  
**Date:** 2025-03-12.

---

## 1. Apple App Review expectations – alignment

| Expectation | Status | Notes |
|-------------|--------|--------|
| **Account creation** | ✅ | Sign-up (email/password, OAuth, magic link) and sign-in; profile created server-side. |
| **Account deletion** | ✅ | In-app path: Settings → Delete account → confirmation → Edge Function deletes auth user → sign out. Demo mode throws clear message. |
| **Restore purchases** | ✅ | Settings and Paywall both expose "Restore purchases"; outcome messaging (success, no purchases, failed, offline) is clear. |
| **Manage subscription** | ✅ | Settings and Paywall have "Manage subscription"; opens RevenueCat management URL or App Store subscriptions URL with fallback copy. |
| **Terms of Use** | ✅ | Settings → Legal → Terms of Service; Paywall footer links. URL from `getTermsUrl()` (env or https://prop-folio.vercel.app/terms). |
| **Privacy Policy** | ✅ | Settings → Legal → Privacy Policy; Paywall footer links. URL from `getPrivacyPolicyUrl()` (env or https://prop-folio.vercel.app/privacy). |
| **Contact / Support** | ✅ | Settings → Help & support → "Contact support" opens getSupportUrl() (EXPO_PUBLIC_SUPPORT_URL or https://prop-folio.vercel.app/support). |
| **Subscription billing copy** | ✅ | Paywall footer: "Payment will be charged to your Apple ID… Manage subscriptions in your device settings." |
| **No mandatory sign-in for non-account features** | ✅ | App is account-centric (portfolio, imports); demo mode when Supabase not configured. |
| **No hidden or unclear subscriptions** | ✅ | Paywall shown when free limit reached; plan selection and restore are visible. |

---

## 2. Privacy disclosures and data collection transparency

- **Privacy Policy URL:** Configurable; must resolve and describe data practices (auth, properties, usage events, RevenueCat, crash reporting, third-party APIs via Edge Functions). See **privacy_data_map.md**.
- **In-app:** Privacy Policy linked from Settings and Paywall; no in-app full policy text required if URL is accessible.
- **Data use:** Analytics (`usage_events`) and crash reporting should be disclosed in Privacy Policy; avoid collecting PII in event metadata (current design uses allowlisted non-PII keys).
- **crash reporting:** Currently `sendDefaultPii: true`; consider `false` for App Store and document in privacy policy what is sent (crashes, breadcrumbs, device/OS). See **app_review_risk_register.md**.

---

## 3. Subscription and billing expectations

- **Restore purchases:** Present and functional on Settings and Paywall.
- **Manage subscription:** Opens system/RevenueCat flow; fallback copy instructs user to use Settings app → Subscriptions.
- **Clear pricing:** Plan cards and copy from RevenueCat offerings; no in-app cancellation (handled by Apple).
- **Billing help:** Settings section; when `EXPO_PUBLIC_BILLING_HELP_URL` is set, link shown; otherwise inline "contact support from the app" – add explicit Contact/Support link.

---

## 4. Permission prompts

- **Current:** No location, camera, photo library, or microphone usage in app code.
- **Storage:** AsyncStorage (UserDefaults on iOS) used for auth session and subscription cache; covered by existing privacy manifest (`NSPrivacyAccessedAPICategoryUserDefaults`, CA92.1).
- **Network:** All API calls over HTTPS; no custom permission strings required for network.
- **Recommendation:** If future features add location or camera, add corresponding `NS*UsageDescription` and Privacy Nutrition Labels.

---

## 5. Misleading claims and investment disclaimers

- **Deal score / confidence:** Copy describes "how the numbers look" and "how much we trust the data"; bands (e.g. "Strong deal") are model outputs, not guarantees. Recommend keeping and adding one-line disclaimer where score is prominent (see **user_trust_and_disclaimer_recommendations.md**).
- **Rent estimates:** Shown as "Estimated monthly rent" with "estimate only; verify with local sources" in import success.
- **"Should I buy this property?"** – Framed as decision support; no promise of profit. Acceptable if Privacy Policy / Terms state that the app is for informational use only and not investment advice.
- **Paywall benefits:** "Compare more deals with confidence", "Access premium scoring and insights" – confidence in the process, not guaranteed returns. Acceptable with legal disclaimer.

---

## 6. Broken links and placeholder content

- **Legal URLs:** Default to `https://prop-folio.vercel.app/privacy` and `https://prop-folio.vercel.app/terms`. Production should set `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL` and ensure pages resolve.
- **Billing help:** `EXPO_PUBLIC_BILLING_HELP_URL` may be empty; inline copy used. No broken link.
- **Support:** No in-app support URL yet; add `getSupportUrl()` (mailto or support page) and Settings row.

---

## 7. Demo/test content in production

- **Demo user:** Used only when Supabase is not configured (`getSupabase()` null); not shown when backend is configured.
- **Debug UI:** Settings "Debug (dev only)" section and "Simulate at limit" toggle are wrapped in `__DEV__`; not in production build.
- **subscriptionDebugOverrides:** Getters return false in production; setters no-op. Safe.

---

## 8. Crash risk and stability

- **Error boundary:** expo-router `ErrorBoundary` in use.
- **crash reporting:** Optional (when DSN set); captures crashes and errors; replay masks text/images.
- **Guards:** Null Supabase, missing session, and failed API calls handled with fallbacks and user messages.

---

## 9. Legal text presence

- **Terms of Service:** Linked in Settings and Paywall.
- **Privacy Policy:** Linked in Settings and Paywall.
- **Subscription terms:** Covered by Paywall footer (charge to Apple ID, renewal, manage in device settings).
- **Recommendation:** Add short in-app disclaimer in Settings or About (e.g. "PropFolio is for informational use only; not investment, tax, or legal advice") and ensure Terms/Privacy state the same.

---

## 10. Required code/copy updates (from this audit)

1. **Contact / Support:** Add `getSupportUrl()` and a "Contact support" or "Help & support" row in Settings that opens support URL or mailto.
2. **crash reporting PII:** Set `sendDefaultPii: false` unless product explicitly requires it; document in Privacy Policy.
3. **Metadata:** Ensure App Store Connect has Support URL, Privacy Policy URL, and optional Terms/EULA link (see **required_metadata_checklist.md**).

All other in-app paths (Terms, Privacy, Restore, Manage subscription, Account deletion) are present and implemented.
