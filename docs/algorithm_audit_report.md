# PropFolio Logic and Algorithm Audit Report

**Scope:** Property import pipeline, parsing/normalization, scoring engine, investment analysis, rent/market assumptions, error handling, async/retries, caching, API timeouts, confidence/explanation text, subscription gating, onboarding, analytics, logging/PII, edge cases.

**Audit date:** 2025-03-12.

---

## 1. Property import pipeline

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/importLimits.ts`, `expo-app/src/hooks/useExecutePropertyImport.ts`, `expo-app/app/(tabs)/import.tsx`, `supabase/migrations/00020_record_property_import_rpc.sql` |
| **Purpose** | Create property row, record import via RPC, enforce free-tier limit (2 imports); server is authoritative. |
| **Inputs** | `PropertyImportData` (streetAddress, city, state, postalCode, countryCode?, unit?, listPrice?, bedrooms?, bathrooms?, sqft?, rent?); `ImportSource`; authenticated Supabase client. |
| **Outputs** | `RecordPropertyImportResult`: `allowed_free`/`allowed_paid` + propertyId; `blocked_upgrade_required`; `failed_retryable`/`failed_nonretryable` + error. |
| **Dependencies** | Supabase auth, `property_imports` table, `record_property_import` RPC, `subscription_status.entitlement_active`, trigger on `property_imports` enforcing limit, `portfolios` (default portfolio). |
| **Failure modes** | Supabase null → non-retryable "Not configured". No portfolio → non-retryable. Property insert failure → retryable. RPC error → retryable. RPC returns blocked → rollback property insert, return blocked. Unknown RPC status → retryable. |
| **Silent assumptions** | `getImportCount` on error returns permissive defaults (count 0, canImport true). RPC is idempotent (unique on user_id, property_id). |
| **Legal/reputational risk** | Low. Limit enforcement is server-side; over-counting imports could frustrate users; under-counting could allow free-tier abuse until server catches up. |

---

## 2. Parsing and normalization logic

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/lib/parsers/addressParser.ts`, `expo-app/src/lib/parsers/zillowUrlParser.ts`, `expo-app/src/lib/parsers/redfinUrlParser.ts`, `expo-app/src/lib/parsers/types.ts`, `expo-app/src/services/importLimits.ts` (`addressToImportData`, `toPropertyRow`) |
| **Purpose** | Parse address string or Zillow/Redfin URL into structured components; normalize to DB row and `PropertyImportData`. |
| **Inputs** | Address: free-form string. URL: string. Import: `formattedAddress`, optional `rent`. |
| **Outputs** | `PartialAddress` (streetAddress, city, state, postalCode); `ParseURLResult` (ok + value or error); `PropertyImportData`; property row (state 2-char, postal 5–10). |
| **Dependencies** | None (pure parsing). `addressToImportData` uses `parseAddress` and applies fallbacks (Unknown city, XX state, 00000 zip, slice 200 for street). |
| **Failure modes** | Invalid URL → `unsupportedDomain` or `missingListingID`. Empty address → all null. `toPropertyRow`: non-2-char state → `XX`; postal not 5–10 → slice and pad to 5. |
| **Silent assumptions** | US-centric (state 2 letters, 5-digit zip). Address comma-separated format. Zillow/Redfin path structures may change. Redfin state/city from path can be swapped (state/city in path order). |
| **Legal/reputational risk** | Low. Bad parsing yields "Unknown" or placeholder data; user can correct. Wrong address from link could direct analysis to wrong property if user does not verify. |

---

## 3. Scoring engine

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/lib/scoring/dealScoringEngine.ts`, `expo-app/src/lib/scoring/types.ts`, `expo-app/src/lib/scoring/dealScoreExplanations.ts`, `expo-app/src/lib/scoring/dealScoreInputsFromSimulation.ts` |
| **Purpose** | Compute 0–100 deal score and band from underwriting/simulation inputs; cap score when data confidence is low; produce explanation summary. |
| **Inputs** | `DealScoreInputs` (capRate, cash flows, dscr, expenseRatio, breakevenOccupancy, renovationBurdenRatio, purchaseDiscountVsValue, rentCoverageStrength, dataConfidence, marketTailwinds, stressDSCR). |
| **Outputs** | `DealScoreResult`: totalScore (or null), band, components, wasCappedByConfidence, explanationSummary. |
| **Dependencies** | Fixed weights per factor; `bandFromScore`; explanation copy. Inputs typically from `fromUnderwriting` / `fromSimulationResult`. |
| **Failure modes** | Missing required inputs (cap rate or cash flow, DSCR, data confidence) → `insufficientData` band, totalScore null. totalWeight 0 → insufficientData. Confidence &lt; 50 and raw &gt; 60 → score capped at 60. |
| **Silent assumptions** | Weights sum to 1. Sub-scores clamped 0–100. Magic numbers: e.g. $30k annual / $1.5k monthly for cash flow scaling; DSCR bands 1, 1.25, 1.5, 2. |
| **Legal/reputational risk** | Medium. Score presented as primary decision metric; if formulas are wrong or inputs stale, users could over-trust a "strong" deal. Capping by confidence reduces but does not eliminate risk. |

---

## 4. Investment analysis calculations (underwriting + simulation)

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/lib/underwriting/underwritingEngine.ts`, `incomeFlow.ts`, `debtAndCashFlow.ts`, `returnMultiplier.ts`, `unitAndOccupancy.ts`, `amortization.ts`, `expo-app/src/lib/simulation/simulationEngine.ts`, `expo-app/src/lib/renovation/types.ts` |
| **Purpose** | Deterministic underwriting (GSR, EGI, NOI, ADS, cash flow, DSCR, cap rate, CoC, etc.) and simulation (cash to close, equity, renovation total). |
| **Inputs** | `UnderwritingInputs` / `SimulationInputs` (purchase price, loan terms, rent, vacancy, expenses, units, sqft, renovation plan/costs). |
| **Outputs** | `UnderwritingOutputs`; `SimulationResult` (underwriting + totalCashToClose, equityInvested, renovationTotal). |
| **Dependencies** | Amortization (monthly payment, balance after k months), renovation plan totals by tier. |
| **Failure modes** | Null/negative inputs → null outputs for that metric. Division by zero guarded (e.g. egi &gt; 0, purchasePrice &gt; 0). |
| **Silent assumptions** | Linear amortization; 12 payments/year. Down payment: amount takes precedence over percent; percent capped 100%. Rent = monthly per unit × units. |
| **Legal/reputational risk** | Medium–high. Wrong NOI/DSCR/cash flow could lead to bad investment decisions. All formulas are deterministic and testable per product rules. |

---

## 5. Rent and market assumptions

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/edgeFunctions.ts` (rentEstimate, censusData), `supabase/functions/rent-estimate/index.ts`, `supabase/functions/census-data/index.ts`, import screen (rent passed to `addressToImportData`) |
| **Purpose** | Rent: external RentCast API via Edge Function for rent estimate. Census: market context (income, home value). |
| **Inputs** | Rent: address, optional bedrooms, propertyType. Census: state/county/tract or lat/lng. |
| **Outputs** | Rent: `RentEstimateResult` (rent or monthlyRent/rentAmount normalized to .rent). Census: population, median income, median home value. |
| **Dependencies** | RentCast API key, Google (census Edge Function if used). Client does not call paid APIs directly. |
| **Failure modes** | Missing API key → 503. Missing address → 400. RentCast/upstream error → 502/500. Client receives { data, error }; import flow shows alert on rent error but can still add property (no rent). |
| **Silent assumptions** | Rent is monthly. Normalized to single `rent` field. No client-side timeout; Supabase Edge default timeout applies. |
| **Legal/reputational risk** | Medium. Rent estimate shown as "Estimated monthly rent"; if wrong, user could overbid or misunderwrite. Census used for context only. |

---

## 6. Error handling and fallback logic

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/edgeFunctions.ts` (invoke), `importLimits.ts`, `useExecutePropertyImport.ts`, `expo-app/app/(tabs)/import.tsx`, AuthContext, SubscriptionContext |
| **Purpose** | Central invoke returns { data, error }; callers show alerts or fallback. Import: structured result and callbacks. Auth/session: demo user when Supabase null. |
| **Failure modes** | getSupabase() null → demo mode; getImportCount(null) returns safe permissive defaults. RevenueCat/refresh failure → keep last state, do not revoke Pro. record_property_import: rollback property on blocked. |
| **Gaps** | No explicit timeout on Edge invocations. No retry wrapper for transient failures. Generic "Something went wrong" in some paths. |

---

## 7. Async jobs and retries

| Item | Detail |
|------|--------|
| **Source files** | `useExecutePropertyImport.ts`, import screen (resume after paywall), `recordPropertyImportEnforced` |
| **Purpose** | Single in-flight import; duplicate-submit guard. Resume pending import after upgrade. RPC idempotent so retries do not double-count. |
| **Failure modes** | Concurrent execute → "Please wait". Retry on failed_retryable is manual (user taps Try again). No automatic backoff. |
| **Gaps** | No retry for geocode/rent-estimate Edge calls; no queue for async jobs. |

---

## 8. Caching

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/subscriptionCache.ts`, SubscriptionContext (cachedSnapshot), RevenueCat SDK |
| **Purpose** | Persist last subscription state (hasProAccess, expiration, planName) by userId for offline/failed refresh. |
| **Dependencies** | AsyncStorage, userId. |
| **Failure modes** | Parse error or invalid shape → null, no crash. setItem failure → __DEV__ warn only. |
| **Gaps** | No cache for normalized property records per product rule "Cache all normalized property records"; no cache for geocode/rent by address. |

---

## 9. API timeout behavior

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/edgeFunctions.ts`, Supabase client `functions.invoke` |
| **Purpose** | Call Edge Functions (geocode, rent, census, openai, delete-account). |
| **Failure modes** | No client-side timeout; relies on Supabase/Edge default. Long RentCast/Google response can hang UI. |
| **Gaps** | No AbortController or timeout wrapper; no user-visible "Request timed out" message. |

---

## 10. User-facing confidence/explanation text

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/lib/scoring/dealScoreExplanations.ts`, `expo-app/src/lib/confidence/confidenceMeterCopy.ts`, `confidenceMeterEngine.ts` |
| **Purpose** | Deal: band sentence, insufficient-data reason, summary with top drivers, cap-by-confidence message. Confidence: band label/description, supporting/limiting factors, recommended actions. |
| **Outputs** | Copy is deterministic from score/band/components; no AI in financial metrics. |
| **Risks** | Wording must not overstate certainty. "Well grounded" / "reasonably grounded" and "verify key inputs" are appropriate. |

---

## 11. Subscription gating logic

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/importLimits.ts`, `expo-app/src/hooks/useImportLimit.ts`, `expo-app/src/contexts/SubscriptionContext.tsx`, `expo-app/src/config/billing.ts`, RPC and trigger in `00020_*` |
| **Purpose** | canImport = (freeRemaining &gt; 0) \|\| hasProAccess. Server enforces via trigger; RPC returns blocked when limit exceeded and not entitled. |
| **Inputs** | property_imports count, subscription_status.entitlement_active (synced from RevenueCat). |
| **Failure modes** | getImportCount error → canImport true (permissive). Dev override can force "at limit" for QA. |
| **Silent assumptions** | entitlement_active synced when user has Pro; slight delay possible after purchase. |

---

## 12. Onboarding/account creation logic

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/contexts/AuthContext.tsx`, `expo-app/src/services/profile.ts`, `expo-app/app/(auth)/*`, `update-password.tsx` |
| **Purpose** | Sign-up, sign-in (email/password, OAuth, magic link), forgot password, ensure profiles row, delete account. |
| **Inputs** | Email, password, optional first/last name; OAuth provider; new password. |
| **Outputs** | Session or error; SignUpResult (needsEmailConfirmation); MagicLinkResult; ResetPasswordResult. |
| **Dependencies** | Supabase Auth, ensureProfile after signup/session load. |
| **Failure modes** | ensureProfile failure logged; auth flows surface error to user. deleteAccount calls Edge Function then signs out. |
| **Legal/reputational risk** | Low; standard auth. Profile required for FKs (portfolios, usage_events). |

---

## 13. Analytics events

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/analytics.ts` |
| **Purpose** | Funnel events to usage_events (Supabase); __DEV__ log with sanitized metadata only. |
| **Inputs** | Event type, optional resourceType, metadata (non-PII only). |
| **Failure modes** | No Supabase or no user → no-op. insert failure → __DEV__ warn. |
| **PII** | SAFE_METADATA_KEYS allowlist; no user id, email, or tokens in logs. |

---

## 14. Logging and PII exposure

| Item | Detail |
|------|--------|
| **Source files** | `expo-app/src/services/analytics.ts`, `expo-app/src/services/diagnostics.ts`, scattered `__DEV__` console.warn/log (importLimits, subscriptionCache, Auth, etc.) |
| **Purpose** | Diagnostics: entitlement, offerings, usage, purchase/restore outcome—__DEV__ only, no PII. Analytics: sanitizeForLog. |
| **Failure modes** | Logging never throws. Risk: accidental logging of error object that contains tokens or PII. |
| **Gaps** | No centralized "safe logger" that redacts known secret keys. Edge Functions log errors (could leak in server logs if error objects contain sensitive data). |

---

## 15. Edge cases and invalid inputs

| Area | Edge case | Current behavior |
|------|-----------|------------------|
| Address | Empty string | parseAddress returns all null; addressToImportData uses "Unknown", "XX", "00000". |
| Address | No commas | Treated as single token; state/zip extracted if pattern matches. |
| Import | state not 2 chars | toPropertyRow → "XX". |
| Import | postalCode length &lt; 5 or &gt; 10 | slice(0,10).padEnd(5,'0'). |
| Underwriting | negative expense | operatingExpensesAnnual returns null. |
| Underwriting | zero purchase price | cap rate, LTV, etc. return null. |
| Amortization | zero rate | monthlyPayment = principal/n; balanceAfter linear paydown. |
| Deal score | All optional inputs null | insufficientData band, totalScore null. |
| Confidence | No contributions | score 0, band veryLow. |
| Subscription | Refresh fails | Keep cached/last state; do not revoke Pro. |
| Import | RPC returns unknown status | Treated as failed_retryable. |

---

## Summary of high-impact gaps

1. **No client-side timeout** for Edge Function calls (geocode, rent-estimate, etc.).
2. **No retry** for transient Edge failures (network, 5xx).
3. **Rent estimate** shown without "estimate" disclaimer in some copy.
4. **No input validation** on numeric simulation/underwriting inputs (e.g. negative price, NaN).
5. **Deal score** could be shown without explicit "estimate" or "based on your inputs" where shown in UI.
6. **Caching**: normalized property records not cached per product rule.
7. **Error messages**: some paths show generic "Something went wrong"; could expose internal error in __DEV__ only.

These are addressed in the assumptions register, error-handling matrix, user-trust recommendations, and code patches.
