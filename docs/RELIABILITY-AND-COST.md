# Reliability and Cost Control

Production-minded reliability in PropFolio: cache, idempotency, rate limiting, retry, logging, and provider fallbacks. This reduces **API cost** and **token spend** by avoiding duplicate calls and making failures visible.

---

## 1. Cache and freshness

| Layer | What is cached | Freshness (TTL) | Effect on cost |
|-------|----------------|-----------------|----------------|
| **Property import** | Normalized property + raw records by listing ID or address key | Listing: 24h. Address: 1h. (`InMemoryPropertyImportCache`) | Same URL or same normalized address re-import returns cache → **no provider call**. |
| **Provider responses** | Raw API responses (Google Places, RentCast, ATTOM, market) | Per-adapter (e.g. autocomplete 5min, RentCast 7d) | Duplicate requests for same key within TTL → **no external request**. |

- **Idempotent imports:** Pasting the same Zillow/Redfin URL or typing the same address (after normalization) within the TTL returns the cached result. No duplicate fetch to Zillow/Redfin/fallback.
- **Token spend:** No AI/LLM calls in the import path; token impact is from future features (e.g. explanations). Caching and idempotency reduce **provider API cost** (fewer Zillow/Redfin/Places/RentCast calls).

---

## 2. Avoiding repeated expensive calls

- **Cache-first:** `PropertyDataService` checks `PropertyImportCache` before any adapter. Cache hit → return immediately.
- **Shared provider cache:** `ProviderAdapterFactory` uses a single `InMemoryProviderResponseCache` for autocomplete, rent, ATTOM, market. Same key → cache hit → no network.
- **Throttling:** `RequestCoordinator` enforces a minimum interval between requests per category (e.g. 0.5s for property fetch, 0.3s for autocomplete). Reduces burst 429s and duplicate concurrent calls.

---

## 3. Idempotent imports

- **Listing:** Key = `(source, listingID)`. Same URL → same key → cache hit if within TTL.
- **Address:** Key = normalized address string (`street:city:state:zip`). Same typed address → same key → cache hit if within TTL.
- **Structured logging:** `ImportLogger.importSucceeded(..., fromCache: true/false)` so you can see cache hits in Console (subsystem `com.propfolio`, category `import`).

---

## 4. Rate-limit aware orchestration

- **RequestCoordinator** (actor): Before each provider call, call `throttle(category:work:)`. It waits if the last request in that category was too recent, then runs the work.
- **Categories:** `propertyFetch`, `autocomplete`, `marketData`, `rentEstimate` with configurable min intervals.
- **Effect:** Fewer 429s; fewer redundant calls when the user triggers multiple imports or suggestions quickly.

---

## 5. Structured logging (import and analysis)

- **Import:** `ImportLogger` (OSLog, subsystem `com.propfolio`, category `import`). Events: `parse_failed`, `cache_hit`, `cache_miss`, `fetch_failed`, `fallback_used`, `rate_limited`, `retry`, `import_succeeded`, `no_adapter_available`.
- **Analysis:** `AnalysisLogger` (category `analysis`). Events: `insufficient_data`, `engine_failed`, `analysis_completed`. Use when building dashboard state or when a backend analysis API is added.
- **Effect:** Failures and fallbacks are visible in Console; fewer blind retries and easier diagnosis without extra token spend.

---

## 6. Retry strategy

- **RetryPolicy:** Configurable max attempts (default 3), exponential backoff with jitter, optional `Retry-After` from 429.
- **Retryable:** `networkError`, `rateLimited`. Not retryable: `notFound`, `authenticationFailed`, `providerUnavailable`, `invalidResponse`, `partialData`.
- **Used in:** `PropertyDataService` wraps fetch (by listing or by address) in retry. One transient network or 429 doesn’t force the user to tap “Import” again.
- **Effect:** Fewer user-initiated retries and fewer duplicate calls from repeated taps.

---

## 7. Provider fallbacks

- **Property import:** Primary adapters (Zillow, Redfin) by source; if none succeed, `fallbackAdapter` (e.g. mock) is tried. No second call to the same primary after failure.
- **Address fetch:** Try Zillow then Redfin; if both fail, fallback. Logged via `ImportLogger.fallbackUsed`.
- **Effect:** When one provider is down or rate-limits, another (or mock) can still return a result; logging makes fallback usage visible.

---

## Summary: how this reduces API cost and token spend

| Mechanism | API cost | Token spend |
|-----------|----------|-------------|
| Cache (import + provider) | Fewer Zillow/Redfin/Places/RentCast calls | N/A (no LLM in import) |
| Idempotent import | Same paste/address = no new call | N/A |
| Throttling | Fewer 429s and burst traffic | N/A |
| Retry | Fewer “user retry” duplicate imports | N/A |
| Fallbacks | One failing provider doesn’t force extra calls to the same provider | N/A |
| Structured logging | No direct cost; faster diagnosis so fewer support-driven retries | No AI calls in logging path |

**Token spend** is reduced when you add AI features (e.g. explanations): keep AI out of the hot path (no AI for scoring/underwriting); cache and dedupe any AI inputs so the same property/analysis doesn’t re-trigger prompts.
