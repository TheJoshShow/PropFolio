# PropFolio Assumptions Register

**Purpose:** Document silent or explicit assumptions used in algorithms and product behavior so they can be validated, tested, and disclosed where appropriate.

**Last updated:** 2025-03-12.

---

## Property import and address

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A1 | US-centric addresses: state is 2-letter code; postal is 5–10 chars. | addressParser, toPropertyRow, addressToImportData | Non-US addresses get "XX", "00000", or truncated. |
| A2 | Address format is comma-separated (street, city, state/zip) or ends with state/zip tokens. | addressParser | Unusual formats yield street-only or null city/state/zip. |
| A3 | One import record per (user_id, property_id); retries are idempotent. | RPC record_property_import, unique constraint | Double-count only if constraint missing or race. |
| A4 | Server trigger enforces free-tier limit; subscription_status.entitlement_active is source of truth for Pro. | importLimits, RPC, trigger | Over-count if trigger misconfigured; under-gate if sync delayed. |
| A5 | getImportCount on error returns permissive default (count 0, canImport true) to avoid blocking users on transient DB errors. | importLimits | Users might see paywall later when server enforces; or briefly allow over-limit. |

---

## Parsing (Zillow / Redfin)

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A6 | Zillow/Redfin URL path structure remains parseable (zpid, listingId in path/query). | zillowUrlParser, redfinUrlParser | New URL formats return unsupportedDomain or missingListingID. |
| A7 | Address slug in path is best-effort; state/city order may vary (e.g. Redfin path). | extractAddressFromPath | Wrong city/state in parsed address. |

---

## Underwriting and simulation

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A8 | Interest rate is annual; term is in years; 12 payments per year. | amortization, debtAndCashFlow | Wrong if product allows monthly rate or different frequency. |
| A9 | Down payment: if both amount and percent provided, amount takes precedence. | simulationEngine loanAmountFromInputs, cashMetrics | User expectation might be percent when amount is 0. |
| A10 | Vacancy and expense inputs are non-negative; negative operating expense → null. | incomeFlow, returnMultiplier | No support for credit/negative expense. |
| A11 | Rent input is monthly; GSR = monthly × 12 when GSR not provided. | incomeFlow | Wrong if annual rent ever passed as monthly. |
| A12 | Renovation plan contingency is a percentage of (subtotal × region multiplier). | renovation types planTotal | Misestimate if contingency model changes. |

---

## Deal scoring

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A13 | Weights sum to 1; each factor contributes subScore × weight; total normalized by totalWeight. | dealScoringEngine | Score scale or ranking changes if weights wrong. |
| A14 | Required for a score: at least one of cap rate or (annual or monthly) cash flow, plus DSCR, plus data confidence. | dealScoringEngine | Otherwise insufficientData. |
| A15 | Low data confidence (&lt; 50) caps total score at 60 when raw would be &gt; 60. | dealScoringEngine | Prevents high score with weak data. |
| A16 | Magic scaling: e.g. $30k annual cash flow → 80 sub-score; DSCR bands at 1, 1.25, 1.5, 2. | dealScoringEngine | Different markets may need different scales. |

---

## Confidence meter

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A17 | All factor values in [0, 1]; override impact = 1 - min(count, 10)/10. | confidenceMeterEngine | Values outside range ignored; &gt;10 overrides same as 10. |
| A18 | Bands: high ≥75, medium ≥50, low ≥25, veryLow &lt;25. | confidenceMeterEngine | Thresholds are product choice. |

---

## Rent and market data

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A19 | Rent from RentCast (or Edge response) is monthly; client normalizes to single `rent` field. | rent-estimate Edge, import screen | Annual rent misinterpreted as monthly would 12× overstate. |
| A20 | Rent estimate is optional; property can be saved without rent. | import flow | User may not realize analysis will be incomplete. |
| A21 | No client-side timeout for geocode/rent; Supabase Edge timeout applies. | edgeFunctions.invoke | Slow API can hang UI. |

---

## Subscription and auth

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A22 | On refresh/load error, do not revoke Pro; keep last-known or cached state. | SubscriptionContext | User may keep Pro briefly after expiry until next successful fetch. |
| A23 | Cache is keyed by userId; clear on sign-out to avoid wrong state on shared device. | subscriptionCache, SubscriptionContext | Stale cache could show wrong plan for another user if not cleared. |
| A24 | ensureProfile is called after signup and session load so FKs (portfolios, usage_events) succeed. | AuthContext, profile.ts | Missing profile can cause insert failures. |

---

## Analytics and logging

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A25 | metadata in trackEvent must not contain PII; SAFE_METADATA_KEYS allowlist for __DEV__ log. | analytics.ts | New metadata keys with PII could be logged if not allowlisted. |
| A26 | __DEV__ only logs; no secrets in diagnostics. | diagnostics, various __DEV__ logs | Production logs are minimal; dev might still log error objects that contain tokens. |

---

## Cross-cutting

| ID | Assumption | Where | Risk if wrong |
|----|------------|--------|----------------|
| A27 | All financial metrics are computed deterministically in app (underwriting, scoring); AI is not used for financial calculations. | Product rule; openai-summarize for text only | If AI were used for numbers, audit trail and reproducibility would be compromised. |
| A28 | No paid API calls from mobile client; all paid APIs (RentCast, Google, OpenAI) via Edge Functions. | edgeFunctions, product rule | Client could hit rate limits or expose keys if called directly. |

---

## Use of this register

- **Product:** Where we show "estimate" or "based on your inputs," align with A19, A20, A13–A16.
- **Engineering:** Timeout/retry (A21), input validation (A8–A12), and safe logging (A25, A26) are implemented in code.
- **Legal/Compliance:** Assumptions A1–A7 (address/import), A13–A16 (score), A19–A20 (rent) support disclaimer and trust recommendations.
