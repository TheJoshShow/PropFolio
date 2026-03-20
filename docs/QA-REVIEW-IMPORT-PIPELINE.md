# QA Review: Full Import Pipeline

**Reviewer:** QA Reviewer  
**Scope:** Parse → fetch → normalize → cache → UI for property import (Zillow/Redfin URLs, manual address, autocomplete).  
**Verdict:** **CONDITIONAL PASS** — core pipeline is sound; apply fixes below and add test cases before release.

---

## 1. Verdict Summary

| Area | Status | Notes |
|------|--------|--------|
| Desktop/mobile Zillow links | **PASS** | Path pattern and _zpid extraction cover www/mobile; host check uses hasSuffix("zillow.com"). |
| Desktop/mobile Redfin links | **PASS** | Path and query listingId; m.redfin.com in canParse. |
| Malformed URLs | **FAIL** | No explicit malformed-URL handling; ambiguous input can be treated as address. |
| Missing address components | **PASS** | AddressNormalizer fills "Unknown"/"XX"; PartialAddress optional; normalizer handles nil. |
| Provider timeouts | **FAIL** | No explicit timeout on URLSession; timeout errors not mapped. |
| Duplicate imports | **PASS** | Cache by listing(source,id) and by address; second import returns cached result. |
| Field confidence tagging | **PASS** | PropertyNormalizer attaches ImportMetadata per field; source + staleness; new DataSource cases handled. |
| Caching behavior | **PASS** | Cache-first; TTL listing 24h, address 1h; key from normalizer for address. |
| Empty states in Import UI | **PARTIAL** | Loading/no-results/error in autocomplete; no URL-paste path; no “nothing entered” empty state. |

**Overall:** **CONDITIONAL PASS** — fix malformed-URL handling, provider timeouts, and URL-paste flow; add tests.

---

## 2. Test Cases (Recommended)

### 2.1 URL parsing

| ID | Input | Expected |
|----|--------|----------|
| T1 | `https://www.zillow.com/homedetails/123-Main-St-Austin-TX/12345678_zpid/` | Success; source zillow; listingID 12345678. |
| T2 | `https://zillow.com/homedetails/98765432_zpid` | Success; listingID 98765432; address optional. |
| T3 | `https://mobile.zillow.com/homedetails/555_zpid/` | Success; host covered by hasSuffix. |
| T4 | `https://www.redfin.com/TX/Austin/123-Main-St-78701/unit/1234567890` | Success; listingID 1234567890; address from path. |
| T5 | `https://m.redfin.com/something/999` | Success if path ends with numeric ID. |
| T6 | `https://www.redfin.com/home/1234567890?listingId=1234567890` | Success; prefer query listingId. |
| T7 | `https://evil.com/homedetails/123_zpid/` | Failure unsupportedDomain. |
| T8 | `https://www.zillow.com/homedetails/` | Failure missingListingID. |
| T9 | `  https://www.zillow.com/homedetails/1_zpid/  ` | Success after trim. |
| T10 | `not a url` | Treated as address (manual). |
| T11 | `https://zillow.com/ bad` | Currently: URL may be nil → address; or valid URL with " bad" → Zillow parse can fail. **Gap.** |

### 2.2 Malformed / ambiguous input

| ID | Input | Expected |
|----|--------|----------|
| T12 | `` (empty) | Failure (parse returns .malformedURL for empty). |
| T13 | `   ` | Failure. |
| T14 | `https://zillow.com` (no path) | Failure missingListingID. |
| T15 | `zillow.com/homedetails/1_zpid` (no scheme) | Treated as address today; could treat as URL. **Design choice.** |

### 2.3 Missing address components

| ID | Scenario | Expected |
|----|----------|----------|
| T16 | PartialAddress all nil | NormalizedAddress: street/city "Unknown", state "XX", postalCode "". |
| T17 | PartialAddress only postalCode | street/city "Unknown", state "XX", postalCode set. |
| T18 | RawPropertyData missing optional fields | Normalizer produces TrackedValue only for non-nil; no crash. |

### 2.4 Provider / network

| ID | Scenario | Expected |
| T19 | Adapter returns .networkError | PropertyImportError.fetchFailed; fallback adapter tried. |
| T20 | Adapter returns .rateLimited | .fetchFailed(rateLimited); no retry loop. |
| T21 | Request timeout | **Gap:** no explicit timeout; need URLSession timeout or withTimeout and map to .networkError or .timeout. |
| T22 | Primary adapter .notFound, fallback success | Success with fallback result. |

### 2.5 Duplicate imports

| ID | Scenario | Expected |
|----|----------|----------|
| T23 | Same Zillow URL imported twice | Second request returns cache hit; same PropertyImportResult. |
| T24 | Same address typed twice | Second request returns cache hit (same address key). |
| T25 | Same property, different URL form (e.g. mobile vs desktop) | Different cache keys (different listing ID or same); if same listing ID, cache hit. |

### 2.6 Confidence tagging

| ID | Scenario | Expected |
|----|----------|----------|
| T26 | Raw from Zillow, fetchedAt now | All fields high confidence. |
| T27 | Raw from Zillow, fetchedAt > 30 days ago | All fields mediumStale. |
| T28 | Raw from RentCast | estimatedRent medium; other fields per source. |
| T29 | Raw from manual | userInput confidence. |
| T30 | Raw from .attom / .googlePlaces | High (or mediumStale if stale). |

### 2.7 Caching

| ID | Scenario | Expected |
|----|----------|----------|
| T31 | Get listing key then set | get returns value within TTL. |
| T32 | Get after TTL | get returns nil. |
| T33 | Address key from NormalizedAddress | Same normalized string → same key; "123 Main St" vs "123 Main Street" → different keys unless normalized. **Possible gap:** no normalization before address cache key. |

### 2.8 Import UI empty / states

| ID | Scenario | Expected |
|----|----------|----------|
| T34 | User opens Import, no input | Placeholder text; no error; no loading. |
| T35 | User types 2 chars | No suggestion request (min 3); no loading. |
| T36 | User types 3+ chars | Loading then suggestions or noResults or failed. |
| T37 | User pastes Zillow URL in address field | **Gap:** currently triggers suggest(query: urlString); should detect URL and run importProperty(from:). |
| T38 | No suggestions, "Use this text as address" | Hydrates; lookup section appears. |
| T39 | API failure | Error message in phase; user can retry or use manual. |

---

## 3. Missing Edge-Case Handling

### 3.1 Malformed URLs (fix)

- **Issue:** Input like `https://zillow.com/ path` or URLs with spaces may produce nil or odd URL; then treated as address.
- **Recommendation:** In `ImportInputParser`, if `URL(string: trimmed)` is non-nil and has http/https scheme, treat as URL only if host is non-nil and path is not empty (or allow path and let Zillow/Redfin return missingListingID). Reject clearly invalid URLs (e.g. host not in allowlist) and do not fall through to address for strings that look like broken URLs (e.g. start with "http" but fail parse).
- **Optional:** If input starts with `http://` or `https://` but domain is not Zillow/Redfin, return .unsupportedDomain instead of falling through to address.

### 3.2 Provider timeouts (fix)

- **Issue:** No explicit timeout on `URLSession` or adapter requests; no `.timeout` or similar in `AdapterError`.
- **Recommendation:**  
  - Use `URLSessionConfiguration.timeoutIntervalForRequest` (e.g. 30s) or pass a custom `URLSession` with timeout.  
  - Map `URLError.timedOut` in adapter catch blocks to `AdapterError.networkError(underlying:)` or add `AdapterError.timeout(retryAfter: TimeInterval?)`.  
  - Document in execution-order doc that timeouts are surfaced and optionally retried.

### 3.3 URL paste on Import screen (fix)

- **Issue:** Import screen has a single address field. Pasting a Zillow/Redfin URL triggers autocomplete suggest, not `PropertyDataService.importProperty(from:)`.
- **Recommendation:**  
  - In the Import screen or view model, on submit (or on paste if detectable): if `ImportInputParser.parse(input)` returns `.listing`, call `importProperty(from: input)` and show result/error; if `.address`, keep current autocomplete/address flow.  
  - Alternatively, add a dedicated “Paste link” control that sets a URL-only field and runs import on paste or tap “Import”.

### 3.4 Address cache key normalization (optional)

- **Issue:** Cache key is `addr:street:city:state:postalCode`. Variants like "123 Main St" vs "123 Main Street" produce different keys.
- **Recommendation:** Use a single normalization (e.g. USPS or same as AddressNormalizer) before building the key, or accept that minor variants miss cache.

### 3.5 Empty state when nothing entered (optional)

- **Issue:** When the user has not typed anything, there is no explicit “empty” illustration or hint beyond placeholder.
- **Recommendation:** Add an optional empty-state view (e.g. icon + “Paste a link or type an address”) that hides once the user focuses or types.

---

## 4. Files to Touch for Fixes

| Fix | File(s) |
|-----|--------|
| Malformed URL / URL vs address | `ImportInputParser.swift` |
| Timeouts | Adapters (e.g. Zillow, Redfin, Google, RentCast, ATTOM): use URLSession with timeout; map URLError.timedOut to AdapterError. Optionally add `AdapterError.timeout`. |
| URL paste flow on Import | `RootTabView.swift` (ImportScreen) and/or `AddressAutocompleteViewModel` or new Import VM: detect URL, call `importProperty(from:)`, show result. |
| Confidence for new sources | `PropertyNormalizer.swift` — **done** (googlePlaces, attom, publicMarket added). |
| Empty state | `ImportScreen` or `AddressAutocompleteInputView`: optional empty-state view. |

---

## 5. Sign-Off Checklist

- [ ] PropertyNormalizer handles all DataSource cases (googlePlaces, attom, publicMarket) — **done**
- [ ] Malformed-URL handling and optional “starts with http but wrong domain” behavior
- [ ] URLSession or adapter timeout and timeout error mapping
- [ ] Import screen (or VM) runs `importProperty(from:)` when input is a listing URL
- [ ] Test cases T1–T15 and T19–T22, T23–T25, T26–T30, T31–T33, T34–T39 added to test target (or QA runbook)
- [ ] Empty state (optional) and copy reviewed

Once the above are done, re-run this checklist and mark the pipeline **PASS**.
