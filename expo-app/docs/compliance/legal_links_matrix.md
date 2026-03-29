# PropFolio — Legal & Support Links Matrix

Where each link is used and how it is configured.

---

## Source of URLs

All URLs come from **`src/config/legalUrls.ts`**. Values are read from env at build time; empty env falls back to `https://prop-folio.vercel.app/…` (override with `EXPO_PUBLIC_*` if you use a custom domain).

| Env variable | Fallback | Used for |
|--------------|----------|----------|
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | `https://prop-folio.vercel.app/privacy` | Privacy Policy |
| `EXPO_PUBLIC_TERMS_URL` | `https://prop-folio.vercel.app/terms` | Terms of Use / Terms of Service |
| `EXPO_PUBLIC_SUPPORT_URL` | `https://prop-folio.vercel.app/support` | Contact support |
| `EXPO_PUBLIC_BILLING_HELP_URL` | (none) | Billing help / FAQ (optional) |

---

## Where each link appears

| Link | Screen(s) | Label / context | Function |
|------|-----------|------------------|----------|
| **Privacy Policy** | Settings → Legal | "Privacy Policy" | `getPrivacyPolicyUrl()` |
| **Terms of Use / Terms of Service** | Settings → Legal | "Terms of Service" | `getTermsUrl()` |
| | Paywall (footer) | "Terms of Service" | `getTermsUrl()` |
| | Sign-up (agreement) | "Terms of Service" | `getTermsUrl()` |
| **Contact support** | Settings → Help & support | "Contact support" | `getSupportUrl()` |
| **Billing help** | Settings → Help & support | "Billing help & FAQ" (only if URL set) | `getBillingHelpUrl()` |

---

## App Store Connect alignment

- **Privacy Policy URL** (required): Set in App Store Connect and in app; use the same URL (or redirect) so in-app link matches.
- **Support URL** (required): Set in App Store Connect and in app; in-app "Contact support" should open this URL (or mailto).
- **Terms:** Not a separate field in Connect; required in-app (e.g. sign-up, paywall, Settings). Use `EXPO_PUBLIC_TERMS_URL` for the same document.

---

## Safe opening

- **Settings:** All links opened via `handleOpenUrl(url)`: `Linking.canOpenURL` → `Linking.openURL`; on failure or if URL cannot be opened, user sees Alert **"Cannot open link"**.
- **Paywall:** Terms and Privacy use the same safe-open pattern (try/catch + Alert).
- **Sign-up:** Terms and Privacy use `Linking.openURL`; consider reusing the same safe-open helper for consistency.

---

## Checklist before release

- [ ] `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL` point to live pages (or prop-folio.vercel.app is live).
- [ ] `EXPO_PUBLIC_SUPPORT_URL` matches App Store Connect Support URL (or mailto).
- [ ] Tap each link in Settings and confirm it opens; confirm failure path shows Alert when URL is invalid or unopenable.

---

*Update this matrix when adding new links or screens.*
