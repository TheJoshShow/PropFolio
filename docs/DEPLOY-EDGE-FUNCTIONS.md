# Deploy PropFolio Edge Functions (so the app can call them)

The app calls **Supabase Edge Functions** for Google Maps (autocomplete, geocoding), RentCast (rent estimate), OpenAI (summaries), and Census (market data). The functions exist in `supabase/functions/` but must be **deployed** to your Supabase project and **secrets** must be set so they can call the APIs.

---

## 1. Prerequisites

- **Supabase project** (you have one: `imdwzvmcwzccikboppdu`).
- **Supabase CLI** installed:  
  `npm install -g supabase`  
  or use `npx supabase` from the repo root.
- **API keys** in hand (you already added them to `expo-app/.env`; you’ll copy them into Supabase secrets):
  - Google Maps (Places + Geocoding)
  - RentCast
  - OpenAI
  - Census

**Google Cloud:** For Places autocomplete and geocoding to work, enable these APIs for your key:

- [Places API (New)](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)
- [Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)

---

## 2. Log in and link the project

From the **repo root** (folder that contains `supabase/` and `expo-app/`):

```bash
supabase login
```

Open the URL it prints, sign in, then:

```bash
supabase link --project-ref imdwzvmcwzccikboppdu
```

Use your project’s DB password when prompted (or get it from Supabase Dashboard → Project Settings → Database).

---

## 3. Set secrets (API keys)

Secrets are **not** read from your local `.env`. They must be set in Supabase.

**Option A – CLI (from repo root):**

```bash
supabase secrets set GOOGLE_MAPS_API_KEY=your-google-api-key
supabase secrets set RENTCAST_API_KEY=your-rentcast-api-key
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set CENSUS_API_KEY=your-census-api-key
supabase secrets set REVENUECAT_WEBHOOK_AUTHORIZATION=your-webhook-secret
```

Replace `your-*-key` with the real values (same as in `expo-app/.env`). You can copy from `.env` but do not commit them. For `REVENUECAT_WEBHOOK_AUTHORIZATION`, use the same value you set in RevenueCat Dashboard → Webhooks → Authorization header (recommended for production).

**Option B – Dashboard:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Edge Functions** (left sidebar).
3. Click **Secrets** (or **Manage secrets**).
4. Add each key:
   - `GOOGLE_MAPS_API_KEY`
   - `RENTCAST_API_KEY`
   - `OPENAI_API_KEY`
   - `CENSUS_API_KEY`
   - `REVENUECAT_WEBHOOK_AUTHORIZATION` (optional; set if you use the RevenueCat webhook)

---

## 4. Deploy the functions

From the **repo root**:

```bash
supabase functions deploy geocode-address
supabase functions deploy places-autocomplete
supabase functions deploy rent-estimate
supabase functions deploy openai-summarize
supabase functions deploy census-data
supabase functions deploy revenuecat-webhook
supabase functions deploy delete-account
```

Or deploy all at once:

```bash
supabase functions deploy
```

You should see a URL for each function, e.g.  
`https://imdwzvmcwzccikboppdu.supabase.co/functions/v1/geocode-address`.

---

## 5. Confirm from the app

1. Ensure **Supabase** is configured in the app (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `expo-app/.env`).
2. Run the app (e.g. `npm run web` from `expo-app`).
3. Open **Import** → type an address (e.g. “123 Main St, Austin, TX”):
   - **Autocomplete** should show suggestions (Places).
   - **Use address** should geocode and then fetch a rent estimate (RentCast).

If you see “GOOGLE_MAPS_API_KEY not configured” (or similar), the function is deployed but the secret is missing or wrong — set it again in Dashboard or via CLI.

---

## 6. Function summary

| Function             | Purpose                    | Secret                 |
|----------------------|----------------------------|------------------------|
| `geocode-address`    | Address → lat/lng, formatted address | `GOOGLE_MAPS_API_KEY` |
| `places-autocomplete`| Address autocomplete       | `GOOGLE_MAPS_API_KEY`  |
| `rent-estimate`      | Rent estimate for address  | `RENTCAST_API_KEY`     |
| `openai-summarize`   | Plain-English summary      | `OPENAI_API_KEY`       |
| `census-data`        | Census data for area       | `CENSUS_API_KEY`       |
| `revenuecat-webhook` | RevenueCat webhook → sync subscription status to DB | `REVENUECAT_WEBHOOK_AUTHORIZATION` (optional) |
| `delete-account`     | In-app account deletion (App Store compliance)      | None (uses Supabase-injected env)             |

The app calls the first five and `delete-account` via `expo-app/src/services/edgeFunctions.ts` (which uses `supabase.functions.invoke`). The **revenuecat-webhook** is invoked by RevenueCat when subscription events occur; see `supabase/functions/revenuecat-webhook/README.md` for setup, secrets, and local testing. No code changes are needed in the app once the functions are deployed and secrets are set.
