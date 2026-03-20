# Supabase Edge Functions

These functions proxy third-party APIs so API keys never ship to the client.

## Functions

| Function | Purpose | Secrets |
|----------|---------|---------|
| `geocode-address` | Google Geocoding: address → lat/lng, formatted address | `GOOGLE_MAPS_API_KEY` |
| `places-autocomplete` | Google Places: autocomplete suggestions | `GOOGLE_MAPS_API_KEY` |
| `rent-estimate` | RentCast: rent estimate for an address | `RENTCAST_API_KEY` |
| `openai-summarize` | OpenAI: plain-English summary (no financials) | `OPENAI_API_KEY` |
| `census-data` | Census API: demographics for state/county/tract or lat/lng | `CENSUS_API_KEY` |
| `revenuecat-webhook` | RevenueCat webhook: sync subscription events to `subscription_status` | `REVENUECAT_WEBHOOK_AUTHORIZATION` (optional but recommended) |

## Deploy and set secrets

**Full step-by-step:** See **`docs/DEPLOY-EDGE-FUNCTIONS.md`** (enable Google APIs, link project, set secrets, deploy).

**Quick reference (from repo root):**

1. `supabase login` then `supabase link --project-ref imdwzvmcwzccikboppdu`
2. Set secrets (Dashboard → Edge Functions → Secrets, or CLI):
   - `GOOGLE_MAPS_API_KEY`, `RENTCAST_API_KEY`, `OPENAI_API_KEY`, `CENSUS_API_KEY`
   - `REVENUECAT_WEBHOOK_AUTHORIZATION` (for RevenueCat webhook; value must match the header set in RevenueCat Dashboard)
3. `supabase functions deploy` (or deploy each: `geocode-address`, `places-autocomplete`, `rent-estimate`, `openai-summarize`, `census-data`)

## How the app calls them

From `expo-app`, the client uses `getSupabase().functions.invoke('function-name', { body: { ... } })`.  
See `expo-app/src/services/edgeFunctions.ts` and the Import screen (`app/(tabs)/import.tsx`) for geocode, autocomplete, and rent estimate.

## Request/response (summary)

- **geocode-address**: POST `{ address }` → `{ lat, lng, formatted_address, place_id }`
- **places-autocomplete**: POST `{ input }` → `{ predictions: [{ description, place_id }] }`
- **rent-estimate**: POST `{ address, bedrooms?, propertyType? }` → RentCast JSON (e.g. rent, comps)
- **openai-summarize**: POST `{ text, prompt? }` → `{ summary }`
- **census-data**: POST `{ state?, county?, tract? }` or `{ lat, lng }` → `{ data: { name, population, median_household_income, median_home_value } }`
