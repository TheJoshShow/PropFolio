# QA Review: Performance, Caching, and Observability

**Scope:** Duplicate network calls, stale cache risk, retry loops, failed import recovery, logging coverage, usage event accuracy, cost spike risks.

**Overall: CONDITIONAL PASS** — several remediations required (see below).

---

## 1. Duplicate network calls

| Check | Result | Notes |
|-------|--------|-------|
| Property import cache shared? | **FAIL** | `PropertyDataService.withAppConfiguration()` is called multiple times (ImportScreen, previews); each call uses a **new** `InMemoryPropertyImportCache()`. So flowVM and addressVM have **different caches**. Same URL/address can be fetched twice if different code paths use different service instances. |
| Autocomplete debounce | **PASS** | `AddressAutocompleteService` has 0.3s delay and ViewModel cancels previous task; only the latest query runs after user pauses. |
| Throttle on autocomplete | **WEAK** | `RequestCoordinator` has `.autocomplete` category but **PropertyDataService.suggestAddresses** and the autocomplete provider path do **not** use it. Burst of suggest calls (e.g. multiple fields) could hit provider hard. |

**Remediation:**
- Use a **single shared** `PropertyImportCache` (and ideally a single shared `PropertyDataService`) for the app so all import paths share the same cache.
- Optionally run autocomplete through `RequestCoordinator.throttle(category: .autocomplete)` when calling the provider.

---

## 2. Stale cache risk

| Check | Result | Notes |
|-------|--------|-------|
| TTL and eviction | **PASS** | Listing 24h, address 1h; expired entries are removed on get. |
| Stale-while-revalidate | **N/A** | Not implemented; acceptable for MVP. |
| Cache size bound | **FIXED** | **Done:** `InMemoryPropertyImportCache` has `maxEntries: 100` (default) with FIFO eviction. `InMemoryProviderResponseCache` remains unbounded (optional follow-up: add cap). |

---

## 3. Retry loops

| Check | Result | Notes |
|-------|--------|-------|
| Max attempts bounded? | **PASS** | Default 3 attempts; exponential backoff + jitter; respects 429 Retry-After. |
| Retry only on transient errors? | **PASS** | Only `networkError` and `rateLimited` are retryable; 4xx (except 429), notFound, auth, providerUnavailable are not. |
| Whole request retried? | **PASS** | Each attempt runs full fetch (primary adapter then fallback). Worst case 3 × (1 primary + 1 fallback) = 6 calls per import. |
| Circuit breaker? | **MISSING** | No circuit breaker. If a provider is down, every user retry (e.g. "Try again") triggers another 3 attempts. Repeated taps = linear growth in calls. |

**Remediation:**
- Optional: add a simple circuit breaker (e.g. after N consecutive failures for a provider, skip it for K seconds) to avoid hammering a down provider.
- Keep current retry policy; document that "Try again" is manual and each tap triggers a full retry batch.

---

## 4. Failed import recovery

| Check | Result | Notes |
|-------|--------|-------|
| User can retry? | **PASS** | Error view offers "Try again" and "Start over". |
| Final failure logged? | **WEAK** | Each adapter failure is logged (`fetchFailed`, `noAdapterAvailable`); we do **not** log a single "import_failed_final" after all retries are exhausted. |
| No silent swallow | **PASS** | Failures surface as `phase = .error(message)`; no silent fallback that hides errors. |

**Remediation:**
- Log once when returning `.failure` after retries exhausted (e.g. `ImportLogger.importFailedFinal(key:reason:)`) for clearer analytics.

---

## 5. Logging coverage

| Area | Result | Notes |
|------|--------|-------|
| Import (parse, cache, fetch, fallback, retry, rate limit) | **PASS** | `ImportLogger` covers parse_failed, cache_hit, cache_miss, fetch_failed, fallback_used, rate_limited, retry, import_succeeded, no_adapter_available. |
| Autocomplete | **FAIL** | No structured log for suggest success/failure or rate limits. Hard to diagnose Places API issues. |
| Analysis | **PASS** | `AnalysisLogger` has insufficient_data, analysis_completed. `engineFailed` exists but is never called (engines return nil, don’t throw). |
| Usage event insert failure | **PASS** | `UsageTrackingService` logs to os_log when insert fails. |

**Remediation:**
- Add structured log (e.g. `AutocompleteLogger.suggestSucceeded(query:count:)` / `suggestFailed(query:error:)`) in the autocomplete path.
- Call `AnalysisLogger.engineFailed` from any future code path that catches engine or backend analysis errors.

---

## 6. Usage event accuracy

| Event | Result | Notes |
|-------|--------|-------|
| property_import | **PASS** | source, fromCache, hasListingId set from `PropertyImportResult`; correct for link vs address. |
| analysis_run | **WEAK** | Fired on **every** `onAppear`. Back-and-forth navigation = multiple events per analysis view. May over-count for "runs" if you want one per session or per property. |
| saved_scenario | **PASS** | scenario id, name, asBaseline from `ScenarioManager.saveScenario`. |
| portfolio_save | **N/A** | Not yet triggered (no save flow). |
| premium_feature_usage | **WEAK** | Fired on every `onAppear` (e.g. Renovation planner). Each sheet open = one event; may over-count if you want once per session. |
| future_value_predictor_call | **FAIL** | Fired on **every** cache hit and every API success. Same geography requested N times (e.g. many cache hits) = N events. Inflates usage and storage; for cost you care about API calls (fromCache: false). |

**Remediation:**
- **analysis_run:** Either keep "every view" (for engagement) or track once per navigation (e.g. with a flag or by moving to a "analysis viewed" callback that fires once per push).
- **premium_feature_usage:** Same: decide "every open" vs "once per session" and document.
- **future_value_predictor_call:** **FIXED** — Now tracked only when **fromCache: false** (actual API call). Cache hits no longer emit an event, avoiding inflated usage and cost.

---

## 7. Places where cost could spike unexpectedly

| Risk | Severity | Mitigation |
|------|----------|------------|
| Multiple property-import caches | **High** | Shared cache (and service) so same URL/address is never fetched twice across the app. |
| Unbounded cache size | **Medium** | Cap entries or document process-bound memory. |
| Future value: event per cache hit | **Medium** | Send usage event only for API calls (fromCache: false), or dedupe in backend. |
| Autocomplete not throttled | **Low** | 0.3s + cancel already limit requests; optional throttle for extra safety. |
| No circuit breaker | **Low** | Optional; reduces load on a persistently failing provider. |
| analysis_run / premium on every onAppear | **Low** | Design choice; cap or dedupe in backend if billing by "sessions" not "views." |

---

## Summary: Pass/Fail and remediation order

| Category | Pass/Fail | Priority remediation |
|----------|-----------|----------------------|
| Duplicate network calls | **FIXED** | **Done:** `withAppConfiguration()` now uses a single `sharedImportCache` so all import paths share the same cache. |
| Stale cache risk | **PASS** | **Done:** `InMemoryPropertyImportCache` has `maxEntries: 100` (FIFO eviction) to bound memory. |
| Retry loops | **PASS** | Optional circuit breaker. |
| Failed import recovery | **FIXED** | **Done:** `ImportLogger.importFailedFinal(key:reason:)` is called when returning failure after retries. |
| Logging coverage | **CONDITIONAL** | Add autocomplete logging. |
| Usage event accuracy | **CONDITIONAL** | Track future_value only for API calls (fromCache: false); optionally adjust analysis/premium semantics. |
| Cost spike | **CONDITIONAL** | Fix duplicate cache first; then FV event and cache cap. |

**Overall: CONDITIONAL PASS** — implement shared import cache (and service) first; then event accuracy (FV only when fromCache: false) and cache size cap; then logging and optional throttle/circuit breaker.
