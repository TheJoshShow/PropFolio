# Environment Variables

All client-side variables **must** be prefixed with `EXPO_PUBLIC_` so they are available in the app at runtime.

## Validation

The app validates auth-related env vars via `src/config/env.ts`:

- **`validateAuthEnv()`** — Returns `{ isValid, missing }` for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. In development, a console warning is logged when either is missing.
- **`isAuthConfigured()`** — Returns true only when both Supabase vars are set and non-empty.

Auth flows (login, sign-up, forgot password) use this so the UI can show appropriate empty/disabled states when Supabase is not configured.

## Required for full functionality

None. The app runs in **demo mode** without any env vars (demo user, no real auth).

## Optional

| Variable | Description | When to set |
|----------|-------------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) | When using real auth and DB |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | When using real auth and DB |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat public API key for iOS | When using in-app subscriptions on iOS |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Full URL to your privacy policy | App Store required; in-app Settings (default: https://prop-folio.vercel.app/privacy) |
| `EXPO_PUBLIC_TERMS_URL` | Full URL to your terms of service | In-app Settings (default: https://prop-folio.vercel.app/terms) |
| `EXPO_PUBLIC_SUPPORT_URL` | Full URL for contact/support (or mailto:) | App Store required; Settings → Contact support (default: https://prop-folio.vercel.app/support) |
| `EXPO_PUBLIC_BILLING_HELP_URL` | Optional billing/FAQ page | When set, Settings shows "Billing help & FAQ" link |

If **both** Supabase vars are set, the app uses Supabase for sign-in/sign-out, session persistence, and profile creation. If either is missing, the app uses a demo user and in-memory session.

RevenueCat uses a single canonical env var in this app: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`. On web/Android, subscriptions are not configured. Get the iOS public key from the [RevenueCat dashboard](https://app.revenuecat.com) → Project → API keys.

## Setup

1. Copy `.env.example` to `.env` in the `expo-app` directory.
2. Replace placeholder values with your Supabase project URL and anon key (from Supabase dashboard → Project Settings → API).
3. Do **not** commit `.env` (it should be in `.gitignore`).
4. Restart the dev server after changing env vars (`npm run start` then choose platform).

## Crash reporting (Firebase)

Crashlytics does **not** use `EXPO_PUBLIC_*` variables. Configuration is the **`GoogleService-Info.plist`** file (or EAS file env **`GOOGLE_SERVICES_INFO_PLIST`**). See **`MONITORING_SETUP.md`**.

## References

- [Expo env vars](https://docs.expo.dev/guides/environment-variables/)
- Repo root: **`docs/SERVICES-INITIATION-GUIDE.md`** — setup for Supabase, Google Maps, RentCast, EAS, Firebase Crashlytics, OpenAI, Census, and other APIs (including which keys go in client vs server).
- Repo root: `docs/API-KEYS-AND-SUBSCRIPTIONS.md` (if present) for key management.
