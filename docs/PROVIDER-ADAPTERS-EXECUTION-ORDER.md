# Provider Adapters: Execution Order and When to Call

Cost-conscious order for first-pass data sources. Always check cache first; then call providers in order until data is sufficient or list exhausted.

---

## 1. Execution order (cost-conscious)

| Order | Provider | Purpose | Relative cost | When to call |
|-------|----------|---------|---------------|--------------|
| 0 | **Cache** | All adapters | Free | Always. Check cache before any network call. |
| 1 | **Public market** | Market context (zip/county/state) | Low (often free or backend proxy) | When geography is known and market stats needed (e.g. dashboard, context). Skip if only importing one property and no market UI. |
| 2 | **Google Places autocomplete** | Address suggestions while typing | Per request | When user is typing in address field, after debounce and min 3 chars. Skip if no `GOOGLE_PLACES_API_KEY`. |
| 3 | **Google Address Validation** | Normalized address (optional) | Per request | When we have a single address to validate/normalize before storing. Skip if no key or address already normalized. |
| 4 | **ATTOM (parcel)** | Parcel/property metadata (beds, baths, sqft, year, lot) | Per address | When we have address but property details are missing or incomplete. Skip if no `ATTOM_API_KEY` or cache hit. |
| 5 | **RentCast** | Rent estimate | Per address | When we have address and need `estimatedRent`. Skip if no `RENTCAST_API_KEY` or cache hit. |
| 6 | **Zillow / Redfin** | Listing-specific data (from URL) | Per listing | When user pastes listing URL (prefer by listing ID). Skip if no key or not a listing import. |

**Rule:** Prefer listing ID over address when the user provided a URL (Zillow/Redfin). For manual address entry: cache → (optional) market → ATTOM → RentCast → merge into one `NormalizedProperty`.

---

## 2. Per-provider: request/response, cache, errors, call vs skip

### Google Places (autocomplete + validation)

| Item | Detail |
|------|--------|
| **Request** | `GooglePlacesAutocompleteRequest` (input, optional sessionToken). Validation: `GoogleAddressValidationRequest` (address lines, locality, region, postalCode). |
| **Response** | `GooglePlacesAutocompleteResponse` (suggestions with placePrediction). Validation: `GoogleAddressValidationResponse` (result.address with components). |
| **Cache** | Autocomplete: key `gp_ac:{query}`, TTL **5 min**. Validation: key `gp_val:{normalized address string}`, TTL **24 h**. |
| **Errors** | `networkError`, `rateLimited`, `authenticationFailed`, `invalidResponse`. Map HTTP 429 → rateLimited, 401/403 → authenticationFailed. |
| **Call** | When `GOOGLE_PLACES_API_KEY` is set, query length ≥ 3, and (for autocomplete) user is typing. |
| **Skip** | No API key; query &lt; 3 chars; rate limited (honor Retry-After if present). |

### RentCast

| Item | Detail |
|------|--------|
| **Request** | Address components: address, city, state, zipCode (e.g. `RentCastRequest` or query params). |
| **Response** | `RentCastResponse`: rent, rentRangeLow, rentRangeHigh, bedrooms, bathrooms, squareFeet, propertyType. |
| **Cache** | Key `rentcast:{street}:{city}:{state}:{zip}`, TTL **7 days**. |
| **Errors** | Same as above; 429 → rateLimited. |
| **Call** | When address is known and we need rent estimate; after property fetch or with address-only import. |
| **Skip** | No `RENTCAST_API_KEY`; cache hit; rate limited. |

### ATTOM (parcel)

| Item | Detail |
|------|--------|
| **Request** | address1, city, state, zip (query or body per ATTOM API). |
| **Response** | `ATTOMPropertyResponse` (property array with area, lot, building, address). |
| **Cache** | Key `attom:{street}:{city}:{state}:{zip}`, TTL **30 days**. |
| **Errors** | Same; 404/empty property → notFound. |
| **Call** | When we have address and need parcel/property details (beds, baths, sqft, year built, lot). |
| **Skip** | No `ATTOM_API_KEY`; cache hit; address already has full details from another source. |

### Public market (backend/proxy)

| Item | Detail |
|------|--------|
| **Request** | Geography: zip, or countyFips, or state (e.g. `MarketGeography`). |
| **Response** | `MarketContextResponse`: medianListPrice, medianRent, inventoryCount, daysOnMarket. |
| **Cache** | Key `market:zip:{zip}` or `market:county:{fips}` or `market:state:{state}`, TTL **24 h**. |
| **Errors** | Same; no PII in keys. |
| **Call** | When we need market context for UI or underwriting (e.g. after property geography is known). |
| **Skip** | No `PUBLIC_MARKET_DATA_URL`; cache hit; flow does not need market context. |

---

## 3. Configuration keys (AppConfiguration)

| Key | Adapter | When nil / false |
|-----|---------|-------------------|
| `GOOGLE_PLACES_API_KEY` | Google Places autocomplete (and validation) | Adapter skipped |
| `RENTCAST_API_KEY` | RentCast | Adapter skipped |
| `ATTOM_API_KEY` | ATTOM | Adapter skipped |
| `PUBLIC_MARKET_DATA_URL` | Backend market context | Adapter skipped |

---

## 4. Merging strategy

- **Property import by address:** Run cache → ATTOM (for parcel) → RentCast (for rent) → merge into one `RawPropertyData` / `NormalizedProperty`. Attach confidence per field and source.
- **Autocomplete:** Only Google (or mock) when user types; no merge.
- **Market context:** Fetch by geography after property is known; attach to UI or underwriting context, not to the property record itself.
