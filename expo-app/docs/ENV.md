# Environment Variables

All client-side variables **must** be prefixed with `EXPO_PUBLIC_` so they are available in the app at runtime.

## Validation (Supabase)

The app validates auth-related env vars in **`src/config/env.ts`** (read via **`src/config/runtimeConfig.ts`** — the only place that reads `process.env` for these keys).

- **`validateAuthEnv()`** — Returns `{ isValid, missing, invalidReasons }` for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Rejects empty values, tutorial placeholders (`your-project`, `example.supabase.co`, `YOUR_PROJECT_REF`, etc.), and literal unsubstituted EAS strings (e.g. `${EXPO_PUBLIC_SUPABASE_URL}` still present in the value).
- **Release builds** (`__DEV__ === false`): URL must be **`https`** and the hostname must end with **`.supabase.co`** (hosted Supabase). Localhost URLs are rejected.
- **Development**: URL may be **`http://localhost`** / **`127.0.0.1`** / **`.local`** (local Supabase CLI) or **`https://…supabase.co`**.
- **`isAuthEnvConfigured()`** — `true` only when validation passes (not merely non-empty).
- In development, failed validation logs console warnings; **`logSupabaseAuthEnvDiagnostics()`** (startup) logs presence flags and validation outcome **without** printing secrets.

**`AuthContext`** exposes **`isAuthConfigured`**: true when env validation passes **and** the Supabase client initialized. Auth screens use this so signup/login stay disabled when configuration is invalid.

## Required for full functionality

None. The app runs in **demo mode** without any env vars (demo user, no real auth).

## Optional

| Variable | Description | When to set |
|----------|-------------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase **Project URL** from Dashboard → Settings → API (must be `https://<project-ref>.supabase.co` in production builds) | Real auth and DB |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon public** key from the same screen (**never** the service role key) | Real auth and DB |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat public API key for iOS | When using in-app subscriptions on iOS |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Full URL to your privacy policy | App Store required; in-app Settings (default: https://prop-folio.vercel.app/privacy) |
| `EXPO_PUBLIC_TERMS_URL` | Full URL to your terms of service | In-app Settings (default: https://prop-folio.vercel.app/terms) |
| `EXPO_PUBLIC_SUPPORT_URL` | Full URL for contact/support (or mailto:) | App Store required; Settings → Contact support (default: https://prop-folio.vercel.app/support) |
| `EXPO_PUBLIC_BILLING_HELP_URL` | Optional billing/FAQ page | When set, Settings shows "Billing help & FAQ" link |

If **both** Supabase vars are set **and pass validation**, the app uses Supabase for sign-in/sign-out, session persistence, and profile creation. If they are missing or invalid, auth surfaces a clear message and the app avoids broken requests (demo / degraded behavior per `AuthContext`).

### Local development

1. Copy **`expo-app/.env.example`** → **`.env`** in **`expo-app/`**.
2. Set exactly:
   - **`EXPO_PUBLIC_SUPABASE_URL`** — paste the Project URL (no quotes; no trailing `${...}`).
   - **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** — paste the **anon public** JWT only.
3. Restart the dev server after changes.

### EAS / TestFlight / store builds

`EXPO_PUBLIC_*` values are **embedded at build time**. You must:

1. In [Expo](https://expo.dev) → your project → **Environment variables**, define **`EXPO_PUBLIC_SUPABASE_URL`** and **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** for the environment used by your **preview** / **production** profile (match what `eas.json` uses).
2. Store the **literal** URL and key as values — do **not** enter another variable reference that leaves `${EXPO_PUBLIC_…}` unexpanded in the built app.
3. **Create a new build** after changing these variables; installing an old binary will not pick up new env values.

See **`eas.json`** for how env is forwarded per profile.

RevenueCat uses a single canonical env var in this app: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`. On web/Android, subscriptions are not configured. Get the iOS public key from the [RevenueCat dashboard](https://app.revenuecat.com) → Project → API keys.

## Setup (quick)

1. Copy `.env.example` to `.env` in the `expo-app` directory.
2. Fill **`EXPO_PUBLIC_SUPABASE_URL`** and **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** from Supabase → Project Settings → API (see tables above).
3. Do **not** commit `.env` (it should be in `.gitignore`).
4. Restart the dev server after changing env vars (`npm run start` then choose platform).

## Crash reporting (Firebase)

Crashlytics does **not** use `EXPO_PUBLIC_*` variables. Configuration is the **`GoogleService-Info.plist`** file (or EAS file env **`GOOGLE_SERVICES_INFO_PLIST`**). See **`MONITORING_SETUP.md`**.

## References

- **`docs/SUPABASE_EAS_SETUP.md`** — Supabase-only checklist (local `.env`, Expo Production env, rebuild requirement).
- [Expo env vars](https://docs.expo.dev/guides/environment-variables/)
- Repo root: **`docs/SERVICES-INITIATION-GUIDE.md`** — setup for Supabase, Google Maps, RentCast, EAS, Firebase Crashlytics, OpenAI, Census, and other APIs (including which keys go in client vs server).
- Repo root: `docs/API-KEYS-AND-SUBSCRIPTIONS.md` (if present) for key management.
