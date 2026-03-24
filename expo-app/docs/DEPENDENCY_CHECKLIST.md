# PropFolio External Dependency Checklist

This checklist maps each external dependency to config, keys, and key code paths.

## Client env vars (Expo)

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`

## Edge Function secrets (Supabase)

- `GOOGLE_MAPS_API_KEY` (geocode + places autocomplete)
- `RENTCAST_API_KEY` (rent estimate)
- `OPENAI_API_KEY` (summaries, optional)
- `CENSUS_API_KEY` (market/census data, optional)
- `SUPABASE_SERVICE_ROLE_KEY` (for service-level edge functions)

## Integration map

- **Zillow/Redfin parser**
  - Parser: `src/lib/parsers/zillowUrlParser.ts`, `src/lib/parsers/redfinUrlParser.ts`
  - Short-link resolver: `src/lib/parsers/listingUrlResolveShort.ts`
  - UI entry: `app/(tabs)/import.tsx`

- **Geocode + autocomplete (Google Maps via Edge)**
  - Client: `src/services/edgeFunctions.ts` (`geocodeAddress`, `placesAutocomplete`)
  - Edge: `supabase/functions/geocode-address`, `supabase/functions/places-autocomplete`
  - Persistence/backfill: `src/services/importLimits.ts`, `src/hooks/usePortfolioCoordinateBackfill.ts`

- **Rent estimate (RentCast via Edge)**
  - Client: `src/services/edgeFunctions.ts` (`rentEstimate`)
  - Orchestration: `src/services/propertyImportOrchestrator.ts`
  - Edge: `supabase/functions/rent-estimate`

- **OpenAI summary (optional)**
  - Client wrapper: `src/services/edgeFunctions.ts` (`openaiSummarize`)
  - Edge: `supabase/functions/openai-summarize`

- **Census/market (optional)**
  - Client wrapper: `src/services/edgeFunctions.ts` (`censusData`)
  - Edge: `supabase/functions/census-data`

- **Supabase persistence**
  - Import save path: `src/services/importLimits.ts`
  - Portfolio read path: `src/services/portfolio.ts`
  - Account deletion path: `src/services/edgeFunctions.ts` (`deleteAccount`) + `supabase/functions/delete-account`

- **RevenueCat + subscriptions**
  - Config: `src/config/billing.ts`
  - Runtime: `src/services/revenueCat.ts`
  - State + fallback: `src/contexts/SubscriptionContext.tsx`, `src/hooks/usePaywallState.ts`
  - UI: `app/paywall.tsx`, `src/features/paywall/PaywallContent.tsx`
  - Webhook sync (server): `supabase/functions/revenuecat-webhook`

- **Storage buckets / image hosting**
  - Current app runtime: not used in client code (`storage.from(...)` not present).

## Diagnostics

Central integration diagnostics are reported through:

- `src/services/diagnostics.ts` (`reportIntegrationStatus`, `getIntegrationDiagnosticsSnapshot`)

Current integrations report config/success/fallback/impact from:

- `src/services/edgeFunctions.ts`
- `src/services/propertyImportOrchestrator.ts`
- `src/lib/parsers/listingUrlResolveShort.ts`
- `src/services/revenueCat.ts`

## Hosted deployment verification (live)

Verified on Supabase project `imdwzvmcwzccikboppdu` via CLI:

- `geocode-address` (ACTIVE)
- `places-autocomplete` (ACTIVE)
- `rent-estimate` (ACTIVE)
- `openai-summarize` (ACTIVE)
- `census-data` (ACTIVE)
- `delete-account` (ACTIVE)
- `revenuecat-webhook` (ACTIVE)

Required edge secrets present (digest-only listed by CLI): `GOOGLE_MAPS_API_KEY`, `RENTCAST_API_KEY`, `OPENAI_API_KEY`, `CENSUS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
