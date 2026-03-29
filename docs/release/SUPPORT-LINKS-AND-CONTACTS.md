## PropFolio – Support Links & Contact Surface

Use this as the single source of truth when filling out App Store metadata and in‑app links.

### 1. Required public URLs

- **Marketing site**
  - Canonical: `https://prop-folio.vercel.app`
  - Used in: App Store listing, website field.
- **Privacy Policy**
  - URL: `https://prop-folio.vercel.app/privacy` (or value of `EXPO_PUBLIC_PRIVACY_POLICY_URL`).
  - Used in:
    - App Store “Privacy Policy URL”.
    - In‑app Settings → Legal → Privacy Policy.
    - Paywall legal links.
- **Terms of Service**
  - URL: `https://prop-folio.vercel.app/terms` (or value of `EXPO_PUBLIC_TERMS_URL`).
  - Used in:
    - App Store “Terms / EULA” references if requested.
    - In‑app Settings → Legal → Terms of Service.
    - Paywall legal links.

### 2. Support & billing help

- **General support**
  - Email: `support@propfolio.app` (configure to your preferred inbox).
  - Shown in:
    - App Store “Support URL” (can be a simple support page that lists this email).
    - Website “Contact” section.
- **Billing / subscription help**
  - URL (internal or external FAQ): value of `EXPO_PUBLIC_BILLING_HELP_URL` (may be blank).
  - Shown in:
    - Settings → Billing help link (when non‑empty).
    - Store listing or marketing site as needed.

### 3. In‑app entry points

- Settings screen:
  - Legal:
    - Privacy Policy (`getPrivacyPolicyUrl()`).
    - Terms of Service (`getTermsUrl()`).
  - Billing:
    - Billing help (`getBillingHelpUrl()`; may be inline copy only).
  - Account:
    - Delete account (server‑side deletion via Supabase Edge Function).
    - Sign out.
- Paywall:
  - Terms of Service and Privacy Policy links rendered below the paywall footer for subscription compliance.

