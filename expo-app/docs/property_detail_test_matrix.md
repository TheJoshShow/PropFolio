# Property Detail — Test Matrix

Scenarios to cover for the property detail scoring experience. Use for unit tests, component tests, and manual QA.

## 1. Data completeness

| Scenario | Input / setup | Expected behavior |
|----------|----------------|-------------------|
| **Complete imported property** | Full row: list_price, rent, address, fetched_at; analysis service called with default financing. | Numeric deal + confidence scores; deal band not insufficientData; strengths/risks/assumptions populated; factor breakdown components non-empty (Pro); cap note only if confidence < 50 and raw > 60. |
| **Manually entered sparse property** | Only list_price + monthlyRent (no operatingExpensesAnnual, no confidence signals). | Analysis runs; confidence lower (defaults for missing signals); assumptions show (default)/(estimated) where inferred; no crash. |
| **Missing rent estimate** | purchasePrice set, monthlyRent and grossScheduledRentAnnual null. | rawDealScore null; dealBand insufficientData; risks include insufficient_data; explanationCopy.dealSummary explains need for rent. |
| **Missing taxes** | No operatingExpensesAnnual; rent and price set. | Expenses inferred from default ratio; assumptions mark operating expenses as inferred/estimated; metrics and scores still computed. |

## 2. Edge values and outliers

| Scenario | Input / setup | Expected behavior |
|----------|----------------|-------------------|
| **Unrealistic outlier values** | e.g. price 1, rent 1M; or cap rate 50%; or DSCR 0.1. | Scores clamped 0–100; no NaN/Infinity; deal/confidence bands valid; no crash. |
| **Negative cash flow property** | Rent/expenses/debt set so NOI < debt service. | monthlyCashFlow ≤ 0; risk "negative_cf" present; penalties factor reduces deal score; displayed score still 0–100. |
| **Low-confidence with strong raw economics** | High rent, low loan, strong metrics; confidence signals all low (e.g. sourceCompleteness 0.2, assumptionBurden 0.9, estimatedFieldCount 8). | rawDealScore high; confidenceScore < 50; displayedDealScore capped at 60; wasCappedByConfidence true; cap note shown; explanationCopy.capApplied set. |

## 3. Premium vs free gating

| Scenario | Setup | Expected behavior |
|----------|--------|-------------------|
| **Free user taps Factor breakdown** | hasProAccess false. | premium_lock_viewed tracked; navigate to paywall; no expand. |
| **Free user taps About these scores accordion item** | hasProAccess false. | premium_lock_viewed tracked; navigate to paywall; no expand. |
| **Pro user expands Factor breakdown** | hasProAccess true. | Section expands; score_explanation_opened tracked; factor list and intro visible. |
| **Pro user expands accordion** | hasProAccess true. | Accordion item expands; body copy visible. |

## 4. Data fetch and session

| Scenario | Setup | Expected behavior |
|----------|--------|-------------------|
| **Offline data fetch** | getPropertyById fails (network error or Supabase unreachable). | Error state shown; message indicates connection/problem; Back/Retry available; no crash. |
| **Stale property record** | Row returned with old fetched_at; no re-fetch in scope. | Detail renders with current analysis from row; last updated shows stale date; no crash. |
| **Deleted property** | getPropertyById returns null (not found or not in portfolio). | Error state: "Property not found" (or equivalent); Back available; no crash. |
| **Session expired while loading detail** | userId null when fetch runs (e.g. session expired after navigation). | No crash; error or sign-in prompt; do not render main content with null analysisResult. |

## 5. Null/undefined safety

| Scenario | Condition | Expected behavior |
|----------|-----------|-------------------|
| **analysisResult null** | After load, row null or session null. | Do not render main detail; show error or loading. |
| **propertyRow null with analysisResult** | Inconsistent state. | Do not render main content; guard and show error. |
| **explanationCopy.dealSummary missing** | Defensive. | Use fallback string (e.g. "Insufficient data") so label never undefined. |
| **explanationCopy.capApplied** | Only set when wasCappedByConfidence. | Cap note only rendered when both true and capApplied truthy. |
| **metricsSummary fields null** | e.g. dscr, monthlyCashFlow null. | formatCurrency/formatPercent and DSCR cell show "—"; no .toFixed on null. |
| **strengths/risks empty** | insufficientData or minimal inputs. | Sections not rendered (length > 0 check); no crash. |

## 6. Score labels and disclaimers

| Scenario | Expected behavior |
|----------|-------------------|
| **Deal band label** | All DealBand values (including insufficientData) map to a string via dealBandLabel; no "undefined". |
| **Confidence band label** | All ConfidenceBand values map to a string via confidenceBandLabel. |
| **Score disclaimer** | Single disclaimer line always present below score cards (e.g. "Scores are indicative only..."). |
| **Displayed score** | When displayedDealScore is null, show "—" in badge and score card; when number, show Math.round(score). |

## Implementation notes

- **Unit tests:** buildPropertyDetailAnalysis for: missing rent, missing taxes (inferred expenses), negative cash flow, low-confidence cap, outlier clamping, insufficientData, explanation copy and factorExplanations.
- **Component tests:** If using React Native Testing Library, property detail screen: render with mock analysis (complete + insufficientData); ensure no throw when explanationCopy or metrics are partial.
- **Manual QA:** Use qa_checklist_property_detail.md on device; cover offline, deleted property, and session expiry manually.
