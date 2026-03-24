# PropFolio Environment Setup

This app reads client env values from one module: `src/config/runtimeConfig.ts`.

## Canonical client env names

Use these exact names everywhere (local, simulator, EAS, TestFlight, production):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL` (optional)
- `EXPO_PUBLIC_TERMS_URL` (optional)
- `EXPO_PUBLIC_SUPPORT_URL` (optional)
- `EXPO_PUBLIC_BILLING_HELP_URL` (optional)

## iOS Google Maps SDK (native, not `EXPO_PUBLIC_*`)

`react-native-maps` with the Google provider on iOS needs an **iOS Maps SDK key** at **prebuild** time. It is **not** read from `CLIENT_EXPO_PUBLIC_ENV_KEYS` and is **not** embedded as a JS env var.

- **Local:** set `IOS_GOOGLE_MAPS_API_KEY` in your shell or in a file that `app.config.ts` can read (Expo loads `.env` for config resolution).
- **EAS production:** create an EAS secret `IOS_GOOGLE_MAPS_API_KEY` and ensure `eas.json` production `env` forwards it (already wired in-repo). Restrict the key to **iOS apps** / bundle id in Google Cloud Console.
- If the key is missing, builds still succeed but **map tiles are often blank** (no guaranteed JS crash).

## Never put these in client env

Set these only in Supabase Edge Function Secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_MAPS_API_KEY`
- `RENTCAST_API_KEY`
- `OPENAI_API_KEY`
- `CENSUS_API_KEY`
- `REVENUECAT_WEBHOOK_AUTHORIZATION`

## Where to set env values

- Local development / simulator: `expo-app/.env` (from `.env.example`)
- EAS development build profile: EAS project variables/secrets
- EAS preview build profile: EAS project variables/secrets
- EAS production/TestFlight/App Store: EAS project variables/secrets

`eas.json` production profile forwards required keys using `${...}` placeholders.

## Validation behavior

- **Development:** `validateRuntimeConfigForDev()` logs which `EXPO_PUBLIC_*` values are missing; the app **does not** throw on boot so you can work on UI with partial config.
- **Recommended for real auth / billing / imports on device:** set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and on iOS `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` (Android: `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`).
- **EAS production iOS builds:** `eas-build-post-install` runs `scripts/verify-eas-production-client-env.mjs`. If `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, or `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` resolve **empty** on the worker (e.g. dashboard vars not set), the **build fails** so TestFlight never ships a binary with dead Supabase/RevenueCat wiring.
- **Runtime on device:** If a non-EAS build omits keys, integrations degrade as before (errors when those features run).

## EAS checklist

Set these in EAS project variables before building:

1. `EXPO_PUBLIC_SUPABASE_URL`
2. `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
4. `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` (required for Android builds; safe to set now)
5. `IOS_GOOGLE_MAPS_API_KEY` — **iOS native** Maps SDK key for `react-native-maps` (see section above); optional for build success but **recommended** so map tiles load.
6. `ASC_API_KEY_PATH` — **required** for `eas submit` and for **`npm run eas:release:ios`** (`--auto-submit`). Must be the **absolute path** to your App Store Connect API key file (`.p8`) on the machine running the CLI, **or** configure the same as an EAS [file secret](https://docs.expo.dev/eas/environment-variables/) so `${ASC_API_KEY_PATH}` resolves when submitting. Create a key: [expo.fyi/creating-asc-api-key](https://expo.fyi/creating-asc-api-key). If this is unset, `eas:release:ios` fails with `"ascApiKeyPath" is not allowed to be empty`. **Do not commit** the `.p8` file or debug logs that echo this path.

**Examples (one shell session; use a path on *your* machine — never a teammate’s path):**

```powershell
# Windows PowerShell — prefer Join-Path / $PWD over hand-typed drive letters
$env:ASC_API_KEY_PATH = Join-Path $PWD 'AuthKey_XXXXXXXXXX.p8'
```

```bash
# macOS / Linux
export ASC_API_KEY_PATH="$HOME/Downloads/AuthKey_XXXXXXXXXX.p8"
```

Optional:

- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EXPO_PUBLIC_SUPPORT_URL`
- `EXPO_PUBLIC_BILLING_HELP_URL`
- `EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS` — internal release-readiness / stability test UI (see `MONITORING_VERIFICATION.md`)

**Firebase Crashlytics (iOS):** uses **`GoogleService-Info.plist`** or EAS **`GOOGLE_SERVICES_INFO_PLIST`** — not listed here as `EXPO_PUBLIC_*`. See **`MONITORING_SETUP.md`** and `.env.example` comments.
