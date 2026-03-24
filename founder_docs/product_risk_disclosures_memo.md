# PropFolio — Product Risk Disclosures Memo

**Purpose:** Document product and legal risk disclosures for the PropFolio app; supports consistent in-app and external messaging and investor/legal discussions.  
**Audience:** Founders, counsel, investors  
**Date:** 2025-03-12

---

## 1. Primary Disclosure: Informational Only; Not Advice

- **Statement:** PropFolio is for **informational use only**. It does **not** provide investment, tax, or legal advice.
- **In-app:** This (or equivalent) appears in Settings → Legal and should be reflected in Terms of Service and Privacy Policy.
- **User obligation:** Users are responsible for verifying all numbers and consulting qualified professionals before making any investment, tax, or legal decision.
- **Rationale:** Reduces risk of the app being characterized as providing regulated advice (investment, tax, legal); aligns with App Store and consumer protection expectations.

---

## 2. Data and Model Limitations

- **Data sources:** Property and rent data may come from third-party APIs, user input, or estimates. Data may be incomplete, stale, or inaccurate.
- **Models:** Any scores (confidence, deal score) or metrics (e.g., cap rate, cash flow) are based on models and assumptions that may not fit every property or market.
- **No guarantee:** We do not guarantee accuracy, completeness, or suitability for any particular decision. Users should independently verify all inputs and outputs.
- **In-app:** Where scores or metrics are shown, consider short disclaimers (e.g., “Based on available data; verify with your own research.”).

---

## 3. Real Estate and Investment Risk

- **General:** Real estate investing involves risk, including loss of capital, illiquidity, and market and regulatory changes.
- **No recommendation:** PropFolio does not recommend, endorse, or advise buying or selling any property. The “Should I buy this property?” framing is a decision-support tool, not a recommendation.
- **No fiduciary role:** We are not a fiduciary and do not have a duty to act in the user’s best interest in the sense of investment advice regulation.

---

## 4. Third-Party Services and APIs

- **Dependencies:** The app depends on third-party services (e.g., auth, database, payments, geocoding, rent estimates). Outages, rate limits, or changes in terms can affect functionality.
- **Attribution:** Where required, we attribute data or functionality to third parties. Privacy Policy and Terms should disclose use of third-party services and data.
- **Fallback:** The product is designed to degrade gracefully (e.g., partial results, clear error states) when APIs fail; we do not guarantee uptime or completeness.

---

## 5. Subscription and Payments

- **Apple IAP:** Subscriptions are processed through Apple; we do not store payment card data. Refunds and cancellations are per Apple’s policies.
- **No guarantee of results:** Paying for Pro does not guarantee any particular outcome (e.g., “making money”). Marketing and in-app copy should not promise investment returns. See [launch_copy_recommendations.md](../docs/launch_copy_recommendations.md) and [final_metadata_requirements.md](../docs/final_metadata_requirements.md).

---

## 6. Privacy and Data

- **Collection:** We collect account data, property data entered or imported by the user, and usage/analytics as described in the Privacy Policy.
- **No sale of personal data:** We do not sell user personal information. Data is used to operate the app, improve the product, and comply with law.
- **Security:** We use industry-standard practices (e.g., auth, encryption, secure backends); specific measures should be summarized in the Privacy Policy and, if needed, in security documentation for enterprise or investors.
- **Crash/error reporting:** Firebase Crashlytics — disclose in Privacy Policy (Google/Firebase); engineering reference [MONITORING_SETUP.md](../expo-app/docs/MONITORING_SETUP.md).

---

## 7. Regulatory and Jurisdictional Considerations

- **U.S. focus:** Current design and disclosures are aimed at U.S. users and U.S. app distribution (App Store).
- **State law:** Real estate, consumer protection, and data privacy laws vary by state. As we scale, counsel should review state-specific requirements (e.g., licensing, disclosures, privacy).
- **Securities:** We do not offer securities or investment products; the app does not facilitate trading in securities. If the product or business model evolves, reassess with counsel.

---

## 8. Checklist for Consistency

- [ ] Terms of Service and Privacy Policy include “informational only; not investment, tax, or legal advice.”
- [ ] In-app legal disclaimer (Settings → Legal) matches the above.
- [ ] App Store and marketing copy do not promise returns or guaranteed outcomes.
- [ ] Paywall and subscription copy are Apple-compliant and do not overclaim (see [app_store_hardening_changes.md](../docs/app_store_hardening_changes.md)).
- [ ] When scores or metrics are shown, consider in-context disclaimers where appropriate.
- [ ] Investors and partners are informed that product risk disclosures are documented and consistently applied.

---

## 9. Attorney Review

**[Attorney review recommended]** for: (1) final wording of Terms and Privacy Policy, (2) any state-specific disclosures, (3) securities and investment-adviser considerations, (4) updates if the product or business model changes.

---

*Part of the PropFolio founder document package. Not legal advice.*
