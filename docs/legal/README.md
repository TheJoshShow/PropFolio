# PropFolio legal documents

This folder contains **draft** Privacy Policy and Terms of Service for counsel review and public hosting.

## Before publishing

1. Remove the **internal review** sections at the top of each `.md` file (everything above the `---` that precedes the public title), **or** copy only the “Public document” portion into your CMS.
2. Replace all `[INSERT …]` placeholders with final business/legal values.
3. Align `expo-app` env URLs (`EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_SUPPORT_URL`) with the hosted URLs.

## Phase 1 — Product & data-flow audit (codebase)

**Collected / stored (when Supabase and backends are configured)**

| Category | Details |
|----------|---------|
| **Account & identity** | Email and password (handled by Supabase Auth); optional OAuth via Google or Apple; optional magic link / OTP email flows; first/last name; optional phone number (E.164) in auth metadata and `profiles.phone_number`; profile fields such as `display_name`, `avatar_url`. |
| **Property & analysis data** | User-entered addresses, listing URLs, import metadata, normalized property records, analyses, scores, confidence metrics, scenarios, renovation line items, portfolio organization; optional latitude/longitude **derived from geocoding** user-supplied addresses (not device GPS in current app routes). |
| **Usage / product analytics** | Events written to `usage_events` (e.g. signup, import funnel, paywall, purchases, portfolio views) with **non-PII** metadata per app conventions. |
| **Subscriptions** | RevenueCat (native) for in-app purchases; server webhook syncs entitlement state to Supabase (`subscription_status`). Database schema also includes legacy Stripe-related columns on `subscriptions`; **in-app billing path in the Expo app is store purchases via RevenueCat**—confirm with counsel whether Stripe appears in production. |
| **Crash / diagnostics** | Firebase Crashlytics on iOS via `src/services/monitoring` — see **`expo-app/docs/MONITORING_SETUP.md`**. |
| **Third-party APIs (via Supabase Edge Functions)** | Google Geocoding & Places (address autocomplete/geocode); RentCast (rent estimates); OpenAI (plain-language summarization—**not** used for financial calculations in product rules); U.S. Census-related data (census-data function). |
| **Maps** | `react-native-maps` displays pins using **stored/geocoded** coordinates; no `expo-location` usage found under `expo-app/app`. |

**Account deletion**

- In-app **Delete account** calls Edge Function `delete-account`, which deletes the Supabase Auth user (cascading related data per schema). Users should be informed that residual backups or processor logs may persist for a period per vendor policies.

**Contact / URLs in code**

- Defaults: `https://propfolio.app/privacy`, `https://propfolio.app/terms`, `https://propfolio.app/support` (`expo-app/src/config/legalUrls.ts`). Replace via env for production.

**TODOs for legal / product**

- Confirm governing law, entity name, physical address, support email, and whether arbitration/class-action waiver is desired.
- Confirm any production use of Stripe vs. App Store/Google Play only.
- Align marketing claims with these documents.

---

Files: `privacy-policy.md`, `terms-of-service.md`.

## Public HTML site (deploy)

The **`website/`** folder at the repo root builds static pages from the markdown above (`npm run build`). Deploy **`website`** to your domain so these URLs work:

- `https://propfolio.app/privacy`
- `https://propfolio.app/terms`

See **`website/README.md`** for Vercel, Netlify, and preview steps.

Built pages use **`<title>`** values **PropFolio Privacy Policy** and **PropFolio Terms of Service**, with Open Graph / Twitter meta tags for SEO. Placeholders `[INSERT …]` from markdown are wrapped at build time for visibility on the public HTML.
