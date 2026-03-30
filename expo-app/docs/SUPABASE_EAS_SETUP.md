# Supabase environment setup (Expo client)

The PropFolio Expo app talks to Supabase only through the JavaScript client in `src/services/supabase.ts`. That client reads **exactly** these build-time variables:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co` for store builds). |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Anon (public) JWT** from Supabase Dashboard → Settings → API. Never use the **service role** key in the app. |

## Local development

1. In **`expo-app/`**, copy `.env.example` to `.env` (gitignored).
2. Set both variables to real values from the Supabase Dashboard (no quotes; no trailing `${...}`).
3. Restart Metro (`npm run start`) after changes.

`process.env` for these keys is centralized in **`src/config/runtimeConfig.ts`**. Do not add alternate names (e.g. `SUPABASE_URL`) in app code.

## Expo.dev / EAS production (and preview)

1. Open [expo.dev](https://expo.dev) → your project → **Environment variables**.
2. Create **`EXPO_PUBLIC_SUPABASE_URL`** and **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** for the environment that matches your **EAS build profile** (e.g. **Production** for `eas.json` → `production` → `"environment": "production"`).
3. Values must be the **final** strings (the real URL and anon key). If the built app still contains a literal `${EXPO_PUBLIC_SUPABASE_URL}`, EAS did not substitute them; fix the variable definition and rebuild.
4. **`EXPO_PUBLIC_*` variables are embedded at build time.** After changing them, run a **new** `eas build` and install that binary. Old TestFlight/App Store builds will keep old values.

See also: **`docs/ENV.md`**, **`eas.json`** (env forwarding per profile), **`src/config/env.ts`** (validation and user-facing errors).
