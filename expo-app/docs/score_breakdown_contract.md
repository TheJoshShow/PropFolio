# Property Detail — Score Breakdown Contract

**Purpose:** Stable contract for property detail UI: inputs, result shape, deal score breakdown, confidence breakdown, metrics, flags, and assumptions.  
**Consumers:** Property detail screen, tests.  
**Date:** 2026-03-18

---

## 1. PropertyDetailAnalysisInput

Single input type for running the full analysis (simulation → confidence → deal score).

| Field | Type | Source | Notes |
|-------|------|--------|--------|
| **Property (required)** | | | |
| listPrice | number \| null | Direct import / DB | purchasePrice in simulation. |
| rent | number \| null | Import or user | Monthly rent; converted to annual for underwriting. |
| streetAddress | string | Direct | Display only. |
| city | string | Direct | |
| state | string | Direct | |
| postalCode | string | Direct | |
| unitCount | number \| null | Direct or default | Default 1 if null. |
| bedrooms | number \| null | Direct | |
| bathrooms | number \| null | Direct | |
| sqft | number \| null | Direct | |
| **Financing (optional overrides)** | | | |
| downPaymentPercent | number \| null | User or default | e.g. 25. |
| interestRateAnnual | number \| null | User or default | Decimal, e.g. 0.07. |
| amortizationTermYears | number \| null | Default | e.g. 30. |
| closingCosts | number \| null | Default | USD or null. |
| **Expenses (optional overrides)** | | | |
| vacancyRatePercent | number \| null | Default | e.g. 5. |
| operatingExpensesAnnual | number \| null | Inferred or override | If null, derived from % of EGI. |
| **Confidence / behavior** | | | |
| manualOverrideCount | number \| null | UI | Count of user-overridden fields; 0 if none. |

All numeric inputs are sanitized (NaN/Infinity → null) before use. Optional fields not listed (e.g. renovation, marketTailwinds) can be added later without breaking the contract.

---

## 2. PropertyDetailAnalysisResult

Single result type returned by the analysis service.

| Field | Type | Description |
|-------|------|-------------|
| dealScore | DealScoreBreakdown | Deal score result and factor breakdown. |
| confidence | ConfidenceScoreBreakdown | Confidence meter result and explanation. |
| keyMetrics | KeyMetricsSummary | Cap rate, cash flow, DSCR, etc. |
| riskFlags | RiskFlag[] | Items that reduce score or indicate risk. |
| strengthFlags | StrengthFlag[] | Items that support the score. |
| assumptions | AssumptionItem[] | List of assumptions (defaults or inferred) for transparency. |

---

## 3. DealScoreBreakdown

| Field | Type | Description |
|-------|------|-------------|
| totalScore | number \| null | 0–100 or null if insufficient data. |
| band | DealScoreBand | exceptional \| strong \| good \| fair \| weak \| poor \| insufficientData. (From `src/lib/scoring/types.ts`) |
| wasCappedByConfidence | boolean | True when score was capped at 60 due to low data confidence (rule is inside `dealScoringEngine.ts`). |
| explanationSummary | string | One-line explanation (from dealScoreExplanations.summary). |
| components | DealScoreComponent[] | Per-factor id, rawValue, subScore, weight, contribution. |

Aligned with existing DealScoreResult; may be a direct re-export or a thin wrapper for UI (e.g. factor display names).

---

## 4. ConfidenceScoreBreakdown

| Field | Type | Description |
|-------|------|-------------|
| score | number | 0–100. |
| band | ConfidenceMeterBand | high \| medium \| low \| veryLow. (From `src/lib/confidence/types.ts`) |
| explanation | ConfidenceMeterExplanation | supportingFactors, limitingFactors, summary. |
| recommendedActions | string[] | Up to 5 actions to improve confidence. |

Aligned with existing ConfidenceMeterResult.

---

## 5. KeyMetricsSummary

Subset of underwriting/simulation outputs that the property detail screen shows as “key metrics.”

| Field | Type | Description |
|-------|------|-------------|
| capRate | number \| null | Decimal, e.g. 0.065. |
| monthlyCashFlow | number \| null | USD. |
| annualCashFlow | number \| null | USD. |
| dscr | number \| null | Ratio. |
| cashOnCashReturn | number \| null | Decimal. |
| expenseRatio | number \| null | Decimal. |
| breakevenOccupancy | number \| null | Decimal. |
| noi | number \| null | USD annual. |
| totalCashToClose | number \| null | USD. |

All from UnderwritingOutputs / SimulationResult; null when not computable.

---

## 6. RiskFlag

| Field | Type | Description |
|-------|------|-------------|
| id | string | Stable id for UI (e.g. 'low_confidence_cap', 'weak_dscr'). |
| label | string | Short label. |
| description | string | Optional longer description. |
| severity | 'low' \| 'medium' \| 'high' | For styling/ordering. |

**Examples:** “Score capped by low data confidence”, “DSCR below 1.25”, “Missing rent estimate”.

---

## 7. StrengthFlag

| Field | Type | Description |
|-------|------|-------------|
| id | string | Stable id. |
| label | string | Short label. |
| description | string | Optional. |

**Examples:** “Strong rent coverage”, “Complete property data”.

---

## 8. AssumptionItem

| Field | Type | Description |
|-------|------|-------------|
| id | string | Stable id. |
| label | string | e.g. “Down payment”. |
| value | string | Display value, e.g. “25%”. |
| source | 'default' \| 'user' \| 'inferred' | Whether value came from default, user input, or inference. |

Used so the UI can show “Based on: 25% down, 7% rate, 5% vacancy…”.

---

## 9. Service Entry Point

- **Function:** `runPropertyDetailAnalysis(input: PropertyDetailAnalysisInput): PropertyDetailAnalysisResult`
- **Location:** `src/features/property-analysis/property_detail_analysis_service.ts` (or equivalent).
- **Deterministic:** Same input → same output; no async; suitable for unit tests.
- **Engines used:** simulation.run, confidence.evaluate, dealScore.fromSimulationResult + scoring.score. No changes to engine logic; only composition and mapping of inputs/outputs.

---

## 10. Backward Compatibility

- Existing types (DealScoreResult, ConfidenceMeterResult, DealScoreComponent, etc.) remain the source of truth inside the engines. Property detail types either re-export them or wrap them with the above field names so the UI has one stable contract. New optional fields on Input or Result can be added without breaking existing callers.
