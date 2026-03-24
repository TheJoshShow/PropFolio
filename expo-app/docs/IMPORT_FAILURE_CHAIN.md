# Import failure chain (exact path)

End-to-end stack for **Add property** (tabs Import screen).

## 1. UI → paste link

1. `app/(tabs)/import.tsx` — `handlePasteLink`
2. `parseListingImportForImportAsync` (`listingImportParser.ts`) — `preprocessListingPaste` / `normalizeListingUrl` / optional `resolveListingShortUrlIfNeeded`
3. `parseZillowUrl` / `parseRedfinUrl` + address line helpers
4. `importByAddressLine(parsed.addressLine, provider, …)`

## 2. UI → type address + autocomplete

1. Debounced `placesAutocomplete(query)` (`edgeFunctions.ts` → `supabase.functions.invoke('places-autocomplete', { body: { input } })`)
2. **Requires:** Supabase client + **JWT** (logged-in user). Edge secret **`GOOGLE_MAPS_API_KEY`** on deployed function.
3. **Failure modes:** missing secret → JSON `{ error: "…", predictions: [] }`; network → invoke error; wrong deployment name → 404.

## 3. UI → Use address / link-derived address

1. `importByAddressLine` — session check, then `enrichAddressForImport` (`propertyImportOrchestrator.ts`)
2. `geocodeAddress` → `invoke('geocode-address', { address })` — same JWT + **`GOOGLE_MAPS_API_KEY`**
3. `rentEstimate` → `invoke('rent-estimate', { address })` — **`RENTCAST_API_KEY`**
4. Manual path may block on validation; link path is best-effort.

## 4. Persist property

1. `useExecutePropertyImport.execute` → `recordPropertyImportEnforced` (`importLimits.ts`)
2. `ensureUserReadyForImport` — session/JWT, `ensureProfileWithFallback` → **`profiles`** row
3. `ensureDefaultPortfolio` — **`portfolios`** row (`user_id` → `profiles.id`)
4. `INSERT INTO properties` — payload from `toPropertyRow` (must match DB columns; **`rent`** required column since app writes it — see migration `00023_add_properties_rent.sql`)
5. `rpc('record_property_import', { p_property_id, p_source })` — insert **`property_imports`**; trigger enforces free tier vs `subscription_status.entitlement_active`

## 5. RPC / RLS outcomes

- **check_violation** on limit → `blocked_upgrade_required` → client deletes property (already inserted) in some code paths — see `importLimits` switch
- **`auth.uid()` null in RPC** → `failed_nonretryable`
- **RLS** on `properties_insert_own` requires portfolio owned by `auth.uid()`

## 6. Env: dev vs TestFlight

- **Client:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (from `.env` locally, from `eas.json` production env or EAS Secrets for builds).
- **Server:** No Google/RentCast keys in the app binary; only Supabase Edge secrets.

Root causes fixed in code/schema for “generic import failed” included **missing `rent` column** (insert error) and **wrong zpid** from shared Zillow URLs.
