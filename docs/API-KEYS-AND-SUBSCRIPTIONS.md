# PropFolio — API keys and subscriptions

What you need to provide for the app to run and which keys unlock which features. **Nothing is required to run the app** — it works with demo data and no login. Add keys only for the features you want.

---

## 1. Running the app (no keys required)

- **iOS (Expo):** `expo-app` — build/run or `npm run start`. No Supabase → no login; main tabs and demo data work.
- **Web:** Same **`expo-app`** codebase (React Native Web). From `expo-app`: `npm run start`, then press **`w`**, or `npm run expo-cli -- start --web`. No env vars → no login; main tabs and demo data work.
- **Settings → Use demo data:** When ON, Portfolio shows 3 sample deals; you can tap through Analysis, What-If, Import flow. No backend or API calls.

---

## 2. Login / auth (optional)

To show the **Sign in / Create account** screen and persist sessions:

| Where   | Key / variable           | Required | Where to get it |
|--------|---------------------------|----------|------------------|
| **iOS**  | `SUPABASE_URL`            | If using auth | [Supabase](https://supabase.com) → your project → Settings → API → Project URL |
| **iOS**  | `SUPABASE_ANON_KEY`       | If using auth | Same → Project API keys → `anon` (public) key |
| **Web / Android / Expo** | `EXPO_PUBLIC_SUPABASE_URL` | If using auth | Same URL as above |
| **Web / Android / Expo** | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | If using auth | Same anon key as above |

- **Supabase:** Free tier is enough for auth (email sign-in/sign-up). No paid subscription required for login.
- **Legacy Swift iOS:** Set via Xcode **Edit Scheme → Run → Environment Variables**, or Info.plist, or `Secrets.xcconfig`. See `docs/SETUP-BACKEND-CONFIG.md`.
- **expo-app (iOS, Android, Web):** Create a `.env` in **`expo-app/`** (do not commit; see `expo-app/.env.example`). Example:
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- If these are **not** set: app skips the login screen and goes straight to the main app.

---

## 3. Property import and address (optional)

Used when the user **pastes a listing link** or **types an address** (Import tab). If backend secrets are unset, flows fall back, show clear errors, or use demo paths.

### 3a. Expo app + Supabase Edge Functions (current stack)

The **client never holds** `GOOGLE_MAPS_API_KEY`, `RENTCAST_API_KEY`, `OPENAI_API_KEY`, or `CENSUS_API_KEY`. Set those names in **Supabase Dashboard → Edge Functions → Secrets**. The app calls `supabase.functions.invoke(...)`.

| Secret (Supabase)        | Purpose |
|--------------------------|---------|
| `GOOGLE_MAPS_API_KEY`    | Geocoding / Places used by Edge Functions (`geocode-address`, `places-autocomplete`). |
| `RENTCAST_API_KEY`       | Rent estimates (`rent-estimate`). |
| `OPENAI_API_KEY`         | Summaries (`openai-summarize`), if enabled. |
| `CENSUS_API_KEY`         | Census / market data (`census-data`), if enabled. |

A copy of these in **`expo-app/.env` does not configure Edge Functions**—use the Dashboard for production. Local `.env` entries are optional developer convenience only and must not be committed.

**iOS map tiles (native SDK):** `IOS_GOOGLE_MAPS_API_KEY` is read at **Expo prebuild** (see `expo-app/app.config.ts`, `eas.json`, `expo-app/docs/ENV_SETUP.md`). It is **not** an `EXPO_PUBLIC_*` variable.

### 3b. Legacy native iOS (Swift) adapters (reference only)

| Key / variable           | Platform | Notes |
|--------------------------|----------|--------|
| `ZILLOW_API_KEY`         | Legacy iOS | When nil, Zillow adapter is off. |
| `REDFIN_ENABLED`         | Legacy iOS | Backend proxy pattern. |
| `GOOGLE_PLACES_API_KEY`  | Legacy iOS | If you still use the Swift stack; Expo uses Edge + `GOOGLE_MAPS_API_KEY` on the server. |
| `RENTCAST_API_KEY`       | Legacy iOS | Prefer Supabase secret for Expo. |
| `ATTOM_API_KEY`          | Legacy iOS | Optional parcel data. |
| `PUBLIC_MARKET_DATA_URL` | Legacy iOS | Optional backend endpoint. |

- **MVP / demo:** You do **not** need live provider keys. Use **Use demo data** and Import demo options where available.
- **Rule:** Do not put paid API secrets in the client bundle; Expo uses Edge Functions.

---

## 4. Summary table

| Key / variable              | Required to run? | Required for login? | Required for live import? |
|-----------------------------|------------------|---------------------|----------------------------|
| `EXPO_PUBLIC_SUPABASE_URL` (expo-app) / Swift env `SUPABASE_URL` | No | Yes (if you want login) | No |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` / Swift env `SUPABASE_ANON_KEY` | No | Yes (if you want login) | No |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | No | No | Yes for **in-app subscriptions / paywall** on iOS |
| `IOS_GOOGLE_MAPS_API_KEY` (EAS / prebuild) | No | No | Yes for **Google map tiles** on iOS (native Maps SDK) |
| Supabase secrets `GOOGLE_MAPS_API_KEY`, `RENTCAST_API_KEY`, … | No | No | Yes for **live** geocode/places/rent/OpenAI/census via Edge Functions |
| `ZILLOW_API_KEY` (legacy Swift) | No | No | Only for legacy Zillow link import |
| `REDFIN_ENABLED`            | No | No | Only for Redfin (via proxy) |
| `GOOGLE_PLACES_API_KEY` (legacy Swift) | No | No | Legacy Swift autocomplete |
| `RENTCAST_API_KEY` (legacy / local .env) | No | No | Use Supabase secret for Expo |
| `ATTOM_API_KEY`             | No | No | Only for ATTOM parcel data |
| `PUBLIC_MARKET_DATA_URL`    | No | No | Only for live market context |

---

## 5. Subscriptions (paid services)

- **Supabase:** Free tier is enough for auth and light usage. Paid plans if you need more DB/auth usage.
- **RevenueCat (Expo iOS):** Set **`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`** (public app-specific key) in `expo-app/.env` and in **EAS production** env. Align **entitlement**, **offering**, and **App Store product IDs** with `expo-app/src/config/billing.ts` and the RevenueCat dashboard. Server: **`REVENUECAT_WEBHOOK_AUTHORIZATION`** in Supabase secrets for `revenuecat-webhook`.
- **Google (Maps):** Server key in Supabase (`GOOGLE_MAPS_API_KEY`); iOS native SDK key = `IOS_GOOGLE_MAPS_API_KEY` at build time. Restrict keys in Google Cloud Console.
- **Zillow / Redfin / RentCast / ATTOM:** Use only if you need live property/rent/parcel data; Expo path uses Edge Functions + Supabase secrets.

**Bottom line:** **No** keys → demo mode and limited UI. **Supabase `EXPO_PUBLIC_*`** → real auth and portfolio. **RevenueCat iOS key + aligned products** → subscriptions. **Supabase Edge secrets + optional `IOS_GOOGLE_MAPS_API_KEY`** → live import/maps on device.

---

## 6. Live local audit (your machine) — 2026-03-22

Automated check of **`expo-app/.env`** (keys only; values not logged):

| Item | Status |
|------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | Present and non-empty |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Present and non-empty |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | **Absent** — subscriptions/paywall won’t configure until set (also set in **EAS** for store builds) |
| `EXPO_PUBLIC_*` legal/support URLs | **Absent** — app uses **defaults** from `legalUrls.ts` / runtime config unless you set overrides |
| `IOS_GOOGLE_MAPS_API_KEY` | **Absent** — local prebuild may omit native Google Maps wiring; set for `expo prebuild` / EAS |
| `GOOGLE_MAPS_API_KEY`, `RENTCAST_API_KEY`, `OPENAI_API_KEY`, `CENSUS_API_KEY` in `.env` | Present in file — **does not** replace Supabase Edge secrets; confirm the **same values** exist in **Supabase Dashboard** for production |

`GoogleService-Info.plist` in `expo-app/` has no template markers (`REPLACE_ME` / `propfolio-placeholder`). **Firebase/EAS file secrets** must still be correct for your **store** builds.

A **comment-only template** for the missing `EXPO_PUBLIC_*` / `IOS_GOOGLE_MAPS_API_KEY` lines was appended to **`expo-app/.env`** (section `Audit template 2026-03-22`). Uncomment and fill, or delete the block if you prefer to manage vars elsewhere.

Re-run a similar audit anytime: compare `expo-app/.env` keys to `expo-app/.env.example` and `docs/production_env_matrix.md`.
