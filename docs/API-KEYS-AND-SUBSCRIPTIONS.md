# PropFolio — API keys and subscriptions

What you need to provide for the app to run and which keys unlock which features. **Nothing is required to run the app** — it works with demo data and no login. Add keys only for the features you want.

---

## 1. Running the app (no keys required)

- **iOS:** Build and run. No Supabase → no login screen; app opens on Home/Portfolio with demo data.
- **Web:** `npm run dev` in `web/`. No env vars → no login; main tabs and demo data work.
- **Settings → Use demo data:** When ON, Portfolio shows 3 sample deals; you can tap through Analysis, What-If, Import flow. No backend or API calls.

---

## 2. Login / auth (optional)

To show the **Sign in / Create account** screen and persist sessions:

| Where   | Key / variable           | Required | Where to get it |
|--------|---------------------------|----------|------------------|
| **iOS**  | `SUPABASE_URL`            | If using auth | [Supabase](https://supabase.com) → your project → Settings → API → Project URL |
| **iOS**  | `SUPABASE_ANON_KEY`       | If using auth | Same → Project API keys → `anon` (public) key |
| **Web**  | `VITE_SUPABASE_URL`       | If using auth | Same URL as above |
| **Web**  | `VITE_SUPABASE_ANON_KEY`  | If using auth | Same anon key as above |

- **Supabase:** Free tier is enough for auth (email sign-in/sign-up). No paid subscription required for login.
- **iOS:** Set via Xcode **Edit Scheme → Run → Environment Variables**, or Info.plist, or `Secrets.xcconfig`. See `docs/SETUP-BACKEND-CONFIG.md`.
- **Web:** Create a `.env` file in the `web/` folder (do not commit). Example:
  ```env
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- If these are **not** set: app skips the login screen and goes straight to the main app.

---

## 3. Property import and address (optional)

Used when the user **pastes a Zillow/Redfin link** or **types an address** (Import tab). If no keys are set, those flows use mock/fallback or show “use demo” and the app still runs.

| Key / variable           | Platform | Purpose | Subscription / notes |
|--------------------------|----------|---------|----------------------|
| `ZILLOW_API_KEY`         | iOS      | Zillow property data adapter | Zillow API / partner; availability varies. When nil, Zillow adapter is off. |
| `REDFIN_ENABLED`         | iOS      | Redfin adapter (e.g. backend proxy) | Set to `true` if you have a backend that proxies Redfin; no direct Redfin key in app. |
| `GOOGLE_PLACES_API_KEY`  | iOS      | Address autocomplete and validation | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → enable Places API (New) → create key. Pay-per-use; free tier available. |
| `RENTCAST_API_KEY`       | iOS      | RentCast rent/comp data | [RentCast](https://rentcast.io) — paid API. When nil, RentCastAdapter is skipped. |
| `ATTOM_API_KEY`          | iOS      | Parcel / property attributes | ATTOM (or equivalent) — paid. When nil, ATTOMAdapter is skipped. |
| `PUBLIC_MARKET_DATA_URL` | iOS      | Market context (zip/county) from your backend | Your own endpoint; optional. |

- **MVP / demo:** You do **not** need any of these. Use **Use demo data** and the Import **demo** options to test the full flow.
- **Rule:** Paid APIs are not called directly from the mobile client; use a backend proxy if you integrate paid providers.

---

## 4. Summary table

| Key / variable              | Required to run? | Required for login? | Required for live import? |
|-----------------------------|------------------|---------------------|----------------------------|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | No | Yes (if you want login) | No |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | No | Yes (if you want login) | No |
| `ZILLOW_API_KEY`            | No | No | Only for Zillow link import |
| `REDFIN_ENABLED`            | No | No | Only for Redfin (via proxy) |
| `GOOGLE_PLACES_API_KEY`     | No | No | Only for address autocomplete |
| `RENTCAST_API_KEY`          | No | No | Only for RentCast rent data |
| `ATTOM_API_KEY`             | No | No | Only for ATTOM parcel data |
| `PUBLIC_MARKET_DATA_URL`    | No | No | Only for live market context |

---

## 5. Subscriptions (paid services)

- **Supabase:** Free tier is enough for auth and light usage. Paid plans if you need more DB/auth usage.
- **Google Places:** Pay-per-use; free tier available. Restrict the key by API and (for production) by domain/app.
- **Zillow / Redfin / RentCast / ATTOM:** Each has its own signup and pricing. Use only if you need live property/rent/parcel data; the app runs and demos without them.

**Bottom line:** Provide **no** keys and the app runs with demo data and no login. Add **Supabase URL + anon key** (free) only if you want the login screen. Add property/address keys only when you’re ready for live import and autocomplete.
