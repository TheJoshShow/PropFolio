# Property Import Architecture

**Owner:** Property Data Builder  
**Scope:** Parse input → identify source → fetch → normalize → store raw + confidence.

---

## Flow (per input)

1. **Parse input** — `ImportInputParser.parse(input)` → URL (Zillow/Redfin) or typed address.
2. **Identify source** — From URL host/path → `.zillow` / `.redfin`; from typed text → `.manual`.
3. **Extract address and identifiers** — URL parsers yield `listingID` + optional `PartialAddress`; address parser yields `PartialAddress`.
4. **Fetch property data** — Cache lookup first (by `PropertyCacheKey.listing(source:id)` or `.address(normalizedKey)`). On miss: call adapter(s); fallback to mock when provider unavailable.
5. **Normalize** — `PropertyNormalizer` converts `RawPropertyData` → `NormalizedProperty` (every field is `TrackedValue<T>` with `ImportMetadata`).
6. **Store raw source records** — Caller persists `PropertyImportResult.rawRecords` to backend `imported_source_records` (property_id, source, external_id, raw_payload, fetched_at).
7. **Attach confidence** — Each `TrackedValue` has `ImportMetadata(source, fetchedAt, confidence)`. Aggregate `overallConfidence` on `NormalizedProperty`.

---

## Supported inputs

| Input | Parser | Source | Identifier | Notes |
|-------|--------|--------|------------|--------|
| Zillow desktop link | ZillowURLParser | zillow | zpid from path `*_zpid` | www.zillow.com, zillow.com |
| Zillow mobile link | ZillowURLParser | zillow | same path pattern | mobile/zillow.com |
| Redfin desktop link | RedfinURLParser | redfin | path or query `listingId` | www.redfin.com |
| Redfin mobile link | RedfinURLParser | redfin | same | m.redfin.com |
| Typed address | AddressInputParser | manual | — | Comma or space split; state/zip heuristic. Autocomplete dropdown uses `AddressAutocompleteProvider.suggest(query)` (separate from parse). |

---

## Cost and cache

- **Cache:** `PropertyImportCache` (default `InMemoryPropertyImportCache`). Keys: listing `(source, id)` or address key from `AddressNormalizer.cacheKey(for:)`. Listing TTL 24h, address TTL 1h.
- **API cost:** Prefer fetch by listing ID over fetch-by-address when ID is known. Autocomplete: use min characters + debounce; implement in UI layer.
- **Token use:** No LLM in this pipeline; all logic is deterministic parsing/normalization.

---

## Graceful fallback

- If **primary adapter** (Zillow/Redfin) is unavailable or returns error: service calls **fallback adapter** (e.g. `MockPropertyAdapter`) and returns that result so the user still gets a property (with lower confidence).
- `PropertyDataAdapter.isAvailable` — e.g. Zillow requires API key; when missing, `isAvailable == false` and service uses fallback for listing/address.
- Partial data: adapters may return `.partialData(available:raw, missing:[...])`; normalizer still builds `NormalizedProperty` from available fields and attaches confidence (e.g. `partialData` factor).

---

## Provider interfaces to implement

| Interface | File | Status | Purpose |
|-----------|------|--------|---------|
| **PropertyDataAdapter** | Adapters/PropertyDataAdapter.swift | Done | `fetchProperty(id:)`, `fetchByAddress(_:)`, `isAvailable`. Implement for each provider. |
| **ZillowAdapter** | Adapters/ZillowAdapter.swift | Stub | Use Zillow API (or backend proxy) by zpid/address. Set `apiKey` from `AppConfiguration.zillowAPIKey`; when nil, `isAvailable == false`. |
| **RedfinAdapter** | Adapters/RedfinAdapter.swift | Stub | Use Redfin API/proxy by listing ID/address. Set `configured` from `AppConfiguration.isRedfinConfigured`. |
| **AddressAutocompleteProvider** | Adapters/AddressAutocompleteProvider.swift | Done | `suggest(query:)` → `[AddressSuggestion]`. Implement with a geocode/autocomplete API (e.g. backend endpoint); use MockAutocompleteProvider for dev. |
| **MockPropertyAdapter** | Adapters/MockPropertyAdapter.swift | Done | Fallback when no provider available; returns deterministic RawPropertyData. |
| **RentcastAdapter** (future) | Adapters/RentcastAdapter.swift | Not started | Rental estimates; merge into `NormalizedProperty.estimatedRent` with its own confidence. |

---

## Files created/updated

| Area | Files |
|------|--------|
| **Models (shared)** | DataSource, ImportConfidence, ImportMetadata, TrackedValue, NormalizedAddress, PropertyType, NormalizedProperty |
| **PropertyData models** | ParsedImportInput, ParsedListingURL, RawPropertyData, URLParseError, AdapterError |
| **Parsers** | ListingURLParser, ZillowURLParser, RedfinURLParser, AddressInputParser, ImportInputParser |
| **Normalizers** | AddressNormalizer, PropertyNormalizer |
| **Adapters** | PropertyDataAdapter, AddressAutocompleteProvider, ZillowAdapter, RedfinAdapter, MockPropertyAdapter, MockAutocompleteProvider |
| **Cache** | PropertyImportCache, PropertyCacheKey, InMemoryPropertyImportCache, PropertyImportResult, RawSourceRecord |
| **Service** | PropertyDataService |

---

## Storing raw records

Backend table `imported_source_records(property_id, source, external_id, raw_payload, fetched_at)` with `UNIQUE(property_id, source, external_id)`. On insert:

- Use `DataSource.storageValue` for `source` (zillow, redfin, rentcast, manual, other).
- `external_id` = adapter’s listing ID or a stable address key.
- `raw_payload` = `RawPropertyData.rawPayload` (JSON Data).
- Upsert on re-import: update `raw_payload` and `fetched_at` for same (property_id, source, external_id).

---

## Confidence rules (reference)

| Scenario | Score | Factors |
|----------|-------|---------|
| Zillow/Redfin, recent | 0.9 | verifiedSource, recentData |
| Zillow/Redfin, >30 days | 0.65 | verifiedSource, staleData |
| Rentcast | 0.7 | verifiedSource |
| User input | 0.4 | userOverride, singleSource |
| Derived/mock fallback | 0.3 | derived |
| Missing | 0.0 | missingSource |

Implementations set these in `ImportMetadata` and `PropertyNormalizer.confidenceForSource`.
