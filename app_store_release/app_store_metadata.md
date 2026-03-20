# PropFolio — App Store Metadata

Use this when filling out **App Store Connect → App Information** and **Version Information** for each release.

---

## App name options

- **Primary:** `PropFolio`
- **Alternates (if primary is taken):** `PropFolio – Property Analysis`, `PropFolio Real Estate`

**Note:** App name is limited to 30 characters. Subtitle is separate (30 characters).

---

## Subtitle options (30 characters max)

- `Analyze deals. Decide with confidence.`
- `Property analysis & confidence scores`
- `Should I buy this property?`

---

## Keyword sets (100 characters total, comma-separated, no spaces after commas)

**Set A (discovery):**  
`real estate,investment,property,rental,deal analysis,flip,BRRRR,cap rate,cash flow`

**Set B (features):**  
`property analysis,rent estimate,deal score,portfolio,real estate investor,rental income`

**Set C (reduced):**  
`real estate,property,investment,deal analysis,portfolio,rent estimate`

---

## Promotional text (170 characters max, updatable without new version)

- **Launch:** `Add properties by address, get rent estimates, and track your portfolio. Upgrade to Pro for unlimited imports and premium analysis.`
- **Generic:** `Real estate investment intelligence. Add properties, see your free analysis, and upgrade to Pro for unlimited imports.`

---

## Full description (4000 characters max)

```
PropFolio helps you answer one question: Should I buy this property?

Add a property by entering any U.S. address. PropFolio looks up the location and gives you an estimated monthly rent so you can quickly evaluate deals. Your first 2 property imports are free—no credit card required.

WHAT YOU GET
• Add properties by address (street, city, state, or ZIP)
• Rent estimates to help you compare deals
• Your saved properties in one place (Portfolio)
• Clear upgrade path: 2 free imports, then Pro for unlimited

PRO SUBSCRIPTION
Upgrade to Pro for unlimited property imports and to keep building your portfolio. Subscriptions are billed through your Apple ID. You can cancel or manage your subscription in your device Settings at any time.

WHO IT'S FOR
Real estate investors, side-gig landlords, and anyone comparing rental properties who wants a simple way to add and track deals without spreadsheets.

DISCLAIMER
PropFolio is for informational use only. It does not provide investment, tax, or legal advice. All estimates and data should be verified before making any decision. Use at your own risk.
```

---

## What's New template (4000 characters max per version)

**Version 1.0.0 (initial release):**
```
Welcome to PropFolio.

• Add properties by address—get rent estimates and save them to your portfolio
• 2 free property imports; upgrade to Pro for unlimited
• Sign in with email or Apple to sync your account
• Restore purchases and manage subscription in Settings

We’d love your feedback. Contact support from the app if you have questions.
```

**Future version placeholder:**
```
• [Describe new features and improvements]
• Bug fixes and performance improvements
```

---

## URL placeholders

Replace these with your live URLs before submission. They must work when opened in Safari.

| Field | Placeholder | Example / Notes |
|-------|-------------|------------------|
| **Support URL** | `https://propfolio.app/support` or `mailto:support@propfolio.app` | Required by Apple. Must match in-app Contact support link. |
| **Marketing URL** | `https://propfolio.app` | Optional. Your website or landing page. |
| **Privacy Policy URL** | `https://propfolio.app/privacy` | Required. Must match in-app Privacy Policy link. |

**In-app (env):** Set `EXPO_PUBLIC_SUPPORT_URL`, `EXPO_PUBLIC_PRIVACY_POLICY_URL`, and `EXPO_PUBLIC_TERMS_URL` so the app opens the same URLs. Terms are not a separate field in Connect but are required in-app (e.g. sign-up, paywall).

---

## Category

- **Primary:** Finance (or Productivity)
- **Secondary:** Lifestyle (optional)

---

## Age rating

Complete the questionnaire in App Store Connect. PropFolio does not contain:
- Gambling, unrestricted web browsing, or user-generated content moderation
- Simulated gambling or realistic violence

Expect **4+** or **12+** depending on how you describe “investment” content.

---

## Copyright

`© [YEAR] [Your Company Name]. All rights reserved.`

---

*Update this file when you change app name, tagline, or description. Keep keyword sets under 100 characters total.*
