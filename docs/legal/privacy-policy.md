<!--
  INTERNAL REVIEW ONLY — DO NOT PUBLISH THIS BLOCK ON A PUBLIC WEBSITE.
  Delete everything from the start of this file through the line that reads
  "BEGIN PUBLIC PRIVACY POLICY" before hosting.
-->

### Internal summary (non-public)

- **What PropFolio does:** Real estate analysis app: accounts, property import (address/URL), stored properties, scores, summaries, and optional paid features.
- **Sensitive points for review:** Phone is not collected at account creation (MVP); legacy/synced profile phone may appear in Settings; property addresses and listing-derived data; geocoding via Google; rent data via RentCast; plain-language summaries via OpenAI (user/property context may be included in prompts—see policy); product events in Supabase; crash reporting on iOS; subscriptions via RevenueCat and app stores.
- **Not in current client paths audited:** Continuous GPS/background location in `expo-app/app` (map uses coordinates from user content/geocoding).

---

**BEGIN PUBLIC PRIVACY POLICY**

# Privacy Policy

**Effective date:** [INSERT EFFECTIVE DATE]

**Last updated:** [INSERT EFFECTIVE DATE]

---

## 1. Overview

This Privacy Policy describes how **[INSERT LEGAL ENTITY NAME]** (“**PropFolio**,” “**we**,” “**us**,” or “**our**”) collects, uses, discloses, and protects information in connection with the PropFolio mobile application and related services (collectively, the “**Services**”).

By using the Services, you agree to this Privacy Policy. If you do not agree, do not use the Services.

This policy is designed to support App Store and web publication requirements. It is a **draft** and should be reviewed by qualified legal counsel before reliance.

---

## 2. Scope

This policy applies to information we process in connection with the Services. It does not apply to third-party websites, apps, or services that we do not control, even if linked from the Services.

---

## 3. Information we collect

We collect information in the following categories, depending on how you use the Services and whether optional features (such as cloud sync or subscriptions) are enabled.

### 3.1 Information you provide

- **Account credentials and profile:** When you create an account, we collect information such as email address and password (processed by our authentication provider). We may collect name and similar profile details you choose to provide.
- **Phone number:** Account creation does not require or collect a phone number. If a phone number appears in your profile (for example, from a legacy account or a future optional Settings field), we may store it in E.164 format and use it as described in this policy.
- **Communications:** If you contact us (for example, via **[INSERT SUPPORT EMAIL]** or a support form), we collect the content of your message and related metadata needed to respond.

### 3.2 Property, listing, and analysis information

PropFolio is designed for real estate analysis. You may input or import information such as:

- Property addresses and location descriptions  
- Listing URLs and related identifiers  
- Property attributes (for example, beds, baths, size, rent assumptions, and similar inputs)  
- Notes, scenarios, analyses, scores, confidence indicators, and other app-generated or user-entered analytical content tied to your saved properties  

You should not submit information you are not authorized to share.

### 3.3 Information collected automatically

Depending on your device, settings, and configuration:

- **Device and app diagnostics:** We may collect limited technical information such as app version, device type, operating system, and crash or error reports to maintain and improve the Services.
- **Usage information:** We may log product events (for example, feature usage related to imports, subscriptions, or navigation) in our systems to operate the Services, enforce limits, and understand aggregate usage. We design these logs to avoid collecting unnecessary personal information.
- **Session replay (if enabled):** On certain platforms, we may use tools that record app sessions for debugging when errors occur, with settings intended to **mask** on-screen text and images. This feature may not capture all scenarios.

### 3.4 Location information

PropFolio is **not** designed to track your real-time device location for its core features. The Services may derive **approximate map coordinates** (latitude/longitude) by **geocoding addresses or places you enter** (for example, to show properties on a map). That processing may involve third-party mapping or geocoding providers as described below.

If we introduce continuous location collection in the future, we will update this policy and, where required, obtain appropriate permission.

### 3.5 Payment and subscription information

Paid features may be offered through **Apple App Store** or **Google Play** in-app purchases, using **RevenueCat** (or similar subscription tooling) to manage entitlements. **We do not receive your full payment card number** from those stores. We may receive subscription status, transaction identifiers, and related metadata necessary to provide access to paid features.

---

## 4. How we use information

We use information to:

- Provide, maintain, and improve the Services  
- Create and manage your account  
- Process property imports, analyses, scores, summaries, and related outputs **for informational purposes only**  
- Enforce free-tier limits, subscription entitlements, and prevent abuse  
- Communicate with you about the Services, security, or policy updates  
- Monitor and address technical issues, including through diagnostics and error reporting  
- Comply with law, enforce our terms, and protect rights, safety, and security  

We **do not** use artificial intelligence in the Services to perform regulated financial calculations on your behalf. Any AI-assisted outputs (such as plain-language explanations) are **supplemental** and may be produced using third-party models as described below.

---

## 5. How we share information

We may share information as follows:

- **Service providers:** We use third-party vendors for hosting, authentication, databases, analytics, crash reporting, subscription management, mapping/geocoding, property data, and AI summarization. They may process information on our behalf pursuant to contractual obligations.
- **Legal and safety:** We may disclose information if required by law, legal process, or governmental request, or if we believe disclosure is necessary to protect the rights, property, or safety of PropFolio, our users, or others.
- **Business transfers:** If we are involved in a merger, acquisition, financing, or sale of assets, information may be transferred as part of that transaction, subject to appropriate safeguards.

We **do not sell your personal information** for monetary consideration as a data broker. We may use analytics and advertising identifiers only as described in this policy and applicable platform rules.

---

## 6. Service providers and third-party processing

The Services may rely on subprocessors and APIs, including (as implemented or configured from time to time):

| Category | Examples of providers / types |
|----------|------------------------------|
| **Cloud, auth, and database** | Supabase or similar backend for authentication, storage, and application data |
| **Subscriptions / IAP** | RevenueCat; Apple App Store; Google Play |
| **Diagnostics** | crash reporting or similar error and performance monitoring |
| **Mapping / geocoding / places** | Google Maps Platform or similar (often via server-side APIs) |
| **Property / rent estimates** | RentCast or similar data vendors |
| **Demographic / census-style data** | U.S. Census Bureau or similar public sources (via our backend) |
| **AI summarization** | OpenAI or similar (for natural-language summaries; **not** for authoritative financial computation in the product architecture) |

When you submit addresses, listing details, or prompts, **those inputs may be sent to third-party APIs** to provide features. Third parties’ use of information is governed by their policies as well as our agreements with them.

We **do not** list every subprocessors’ name in this public draft; counsel may maintain an internal subprocessor list for enterprise customers.

---

## 7. Data retention

We retain information for as long as your account is active or as needed to provide the Services, comply with legal obligations, resolve disputes, and enforce agreements. Specific retention periods may depend on the type of data and legal requirements.

When you delete your account (where available), we **intend** to delete or irreversibly anonymize associated account data in our production systems within a reasonable period, subject to backup cycles and legal holds. Some information may remain in **aggregated**, **de-identified**, or **residual** form (for example, in security or backup systems) for a limited time.

---

## 8. Security

We implement reasonable administrative, technical, and organizational measures designed to protect information against unauthorized access, loss, or alteration. **No method of transmission or storage is 100% secure.** You use the Services at your own risk.

---

## 9. Your choices and rights

Depending on your location, you may have rights to:

- Access or receive a copy of certain personal information  
- Correct inaccurate information  
- Request deletion of your information  
- Object to or restrict certain processing  
- Withdraw consent where processing is consent-based  
- Lodge a complaint with a supervisory authority (where applicable)  

To exercise rights, contact us at **[INSERT SUPPORT EMAIL]** with sufficient detail for us to verify your request. We may need to confirm your identity before responding.

**Account deletion:** The app may offer an in-app **Delete account** feature. If you use it, we will process deletion as described in Section 7. Deleting the app from your device does not automatically delete account data in the cloud.

---

## 10. Children’s privacy

The Services are **not directed to children under 13** (or the age required by your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child, contact us at **[INSERT SUPPORT EMAIL]** and we will take appropriate steps.

---

## 11. International users

If you access the Services from outside **[INSERT PRIMARY COUNTRY OR REGION]**, your information may be processed in the United States or other countries where we or our vendors operate. Those countries may have different data protection laws. Where required, we use appropriate safeguards (such as contractual clauses) for cross-border transfers.

---

## 12. California and other U.S. state privacy rights

If you are a California or other U.S. state resident, you may have additional rights under applicable state laws (for example, rights to know, delete, and opt out of certain sharing). To submit a request, contact **[INSERT SUPPORT EMAIL]**. We will not discriminate against you for exercising privacy rights.

**California “Do Not Track”:** There is no uniform industry standard for DNT signals; we do not respond to DNT browser signals in a standardized way.

---

## 13. Changes to this Privacy Policy

We may update this Privacy Policy from time to time. We will post the updated policy with a new effective date and, where appropriate, provide additional notice (for example, in-app or by email). Your continued use of the Services after the effective date constitutes acceptance of the updated policy, to the extent permitted by law.

---

## 14. Contact us

**[INSERT LEGAL ENTITY NAME]**  
[INSERT MAILING ADDRESS]

**Email:** [INSERT SUPPORT EMAIL]

**Website:** [INSERT PUBLIC WEBSITE URL, e.g. https://prop-folio.vercel.app]

For App Store or platform-required support URLs, use the same contact channel or the support page linked from the app settings, consistent with **[INSERT SUPPORT URL IF HOSTED SEPARATELY]**.

---

*This Privacy Policy is a draft for legal and business review. It is not legal advice.*
