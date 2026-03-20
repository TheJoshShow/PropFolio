# Property Detail Engine Audit

**Purpose:** Audit scoring, confidence, underwriting, and simulation logic for use by a live property detail screen.  
**Source:** Existing codebase as source of truth.  
**Date:** 2026-03-18

---

## 1. Audited Areas

### 1.1 `src/lib/scoring/dealScoringEngine.ts`

- **Entry:** `score(inputs: DealScoreInputs): DealScoreResult`
- **Inputs:** DealScoreInputs (cap rate, cash flow, DSCR, expense ratio, breakeven occupancy, renovation burden, purchase discount, rent coverage, data confidence, market tailwinds, stress DSCR). All optional; many can be null.
- **Required to produce a numeric score:** At least one of cap rate / monthly cash flow / annual cash flow (profitability), plus DSCR, plus data confidence. Otherwise returns `totalScore: null`, `band: 'insufficientData'`.
- **Low-confidence capping:** If `dataConfidence` subScore < 50 and raw total > 60, **total score is capped at 60** and `wasCappedByConfidence: true`. Logic at lines 161–164.
- **Output:** totalScore (0–100 or null), band, components (factor-level subScores and contributions), wasCappedByConfidence, explanationSummary.
- **No refactor needed** for UI; call as-is with DealScoreInputs.

### 1.2 `src/lib/scoring/dealScoreInputsFromSimulation.ts`

- **Entry:** `fromUnderwriting(underwriting, options): DealScoreInputs` and `fromSimulationResult(simulationResult, options): DealScoreInputs`.
- **Inputs:** UnderwritingOutputs (or SimulationResult.underwriting) plus options: totalCashToClose, renovationTotal, purchasePrice, dataConfidence, marketTailwinds, stressDSCR, purchaseDiscountVsValue.
- **Maps:** cap rate, cash flows, DSCR, expense ratio, breakeven occupancy from underwriting; rent coverage from GSR/ADS; renovation burden from renovationTotal and totalCashToClose/purchasePrice. **dataConfidence, marketTailwinds, stressDSCR, purchaseDiscountVsValue** are **not** in underwriting; they must be supplied in options (or left null).
- **Gap for property detail:** We need to supply **dataConfidence** (and optionally others) when building DealScoreInputs. dataConfidence can be derived from ConfidenceMeterResult.score (e.g. score/100) or from a simple heuristic (e.g. rent + list price present → 0.6, else 0.3).
- **No refactor needed**; use fromSimulationResult and pass options from property-detail layer.

### 1.3 `src/lib/confidence/confidenceMeterEngine.ts`

- **Entry:** `evaluate(inputs: ConfidenceMeterInputs): ConfidenceMeterResult`
- **Inputs:** propertyDataCompleteness, rentEstimateConfidence, expenseAssumptionsConfidence, renovationBudgetCertainty, financingAssumptionsStability, marketDataReliabilityFreshness, manualOverrideCount. All 0–1 or count; optional.
- **Output:** score (0–100), band (high/medium/low/veryLow), explanation (supportingFactors, limitingFactors, summary), recommendedActions.
- **No refactor needed**; call as-is. We need to **build ConfidenceMeterInputs** from property + analysis context (e.g. which fields are present, which are defaults).

### 1.4 `src/lib/underwriting/**`

- **Entry:** `calculate(inputs: UnderwritingInputs): UnderwritingOutputs`
- **UnderwritingInputs:** purchasePrice, loanAmount, interestRateAnnual, termYears, annualDebtService, monthlyRent, grossScheduledRentAnnual, vacancyPercent, otherIncomeAnnual, operatingExpensesAnnual, unitCount, squareFeet.
- **UnderwritingOutputs:** grossScheduledRentAnnual, vacancyAdjustedGrossIncome, effectiveGrossIncome, operatingExpensesAnnual, noi, annualDebtService, monthlyCashFlow, annualCashFlow, dscr, capRate, cashOnCashReturn, grm, expenseRatio, breakEvenRatio, debtYield, ltv, pricePerUnit, pricePerSquareFoot, breakevenOccupancy, equityPaydown5Year.
- **Deterministic;** no refactor needed. Underwriting is called indirectly via simulation.

### 1.5 `src/lib/simulation/**`

- **Entry:** `run(inputs: SimulationInputs): SimulationResult`; `toUnderwritingInputs(s: SimulationInputs): UnderwritingInputs`
- **SimulationInputs:** purchasePrice, downPaymentPercent, downPaymentAmount, interestRateAnnual, amortizationTermYears, closingCosts, monthlyRentPerUnit, unitCount, vacancyRatePercent, otherIncomeAnnual, squareFeet, taxesAnnual, insuranceAnnual, propertyManagementAnnual, repairsAndMaintenanceAnnual, utilitiesAnnual, capitalReservesAnnual, renovationPlan, renovationEstimateTier, renovationCosts.
- **SimulationResult:** underwriting (UnderwritingOutputs), totalCashToClose, equityInvested, renovationTotal.
- **Gap for property detail:** We have **property-level** data (address, list_price, bedrooms, bathrooms, sqft, rent). We do **not** have financing or expense breakdown in the current import. So we need a **property → SimulationInputs** step with **inferred defaults** (e.g. purchasePrice = list_price, monthlyRentPerUnit = rent when single unit, unitCount = 1, default expense % or flat defaults for taxes/insurance/etc.).
- **No change to simulation engine**; add a builder in the property-detail service that maps PropertyDetailAnalysisInput → SimulationInputs with defaults.

### 1.6 `src/features/property-analysis/**` and `src/features/portfolio/**`

- **Current state:** `src/features/property-analysis/` already implements:
  - `property_detail_types.ts` (UI contract)
  - `property_detail_analysis_service.ts` (composition layer: simulation → confidence → deal score)
  - Unit tests for determinism and output shape.
- `src/features/portfolio/` is currently a placeholder; portfolio list/detail UI lives under `app/(tabs)/portfolio/*` and hooks under `src/hooks/*`.

---

## 2. Inputs: What Exists vs. Missing

### 2.1 Available from property / import today

| Source | Fields | Notes |
|--------|--------|--------|
| **PropertyImportData / DB row** | streetAddress, city, state, postalCode, unit, listPrice, bedrooms, bathrooms, sqft, rent | Current `PropertyRow` includes `rent` (nullable). |
| **Inferred** | unitCount | Can default to 1 for SFR. |
| **Inferred** | purchasePrice | list_price if present. |
| **Inferred** | monthlyRent / grossScheduledRentAnnual | From rent (monthly × 12) when available. |

### 2.2 Missing for full simulation / score (supplied as defaults or optional overrides)

| Input | Source | Default / note |
|-------|--------|----------------|
| downPaymentPercent / downPaymentAmount | User or default | e.g. 25% default for conventional. |
| interestRateAnnual | User or default | e.g. 0.07 (7%). |
| amortizationTermYears | Default | e.g. 30. |
| closingCosts | Default | e.g. 2–3% of purchase price or 0. |
| vacancyRatePercent | Default | e.g. 5. |
| taxesAnnual, insuranceAnnual, etc. | Default | e.g. % of price or regional defaults; or derive from expense ratio (e.g. 40%). |
| dataConfidence | Derived | From confidence score (e.g. confidenceResult.score / 100) or heuristic. |
| marketTailwinds, stressDSCR, purchaseDiscountVsValue | Optional | Leave null unless we add UI for them. |
| manualOverrideCount | Optional | 0 if no overrides; or count of user-overridden fields. |
| renovationTotal | Optional | 0 or null for MVP. |

### 2.3 Direct imports vs. inferred defaults

- **Direct (from property/import):** list_price → purchasePrice, rent → monthly rent (× unitCount), bedrooms, bathrooms, sqft, unitCount (default 1).
- **Inferred defaults in service:** downPaymentPercent (e.g. 25), interestRateAnnual (e.g. 0.07), termYears (30), closingCosts (e.g. 0 or % of price), vacancyRatePercent (5), operating expenses (e.g. 40% of EGI or flat estimates from price).
- **Derived after underwriting:** `dataConfidence` is set from confidence meter score (`confidenceResult.score / 100`). Service order: build SimulationInputs → run simulation → evaluate confidence → build DealScoreInputs with `dataConfidence` → score deal.

---

## 3. Low-Confidence Score Capping (Already in Engine)

- **Location:** `dealScoringEngine.ts` lines 161–164.
- **Rule:** If the **dataConfidence** component’s subScore < 50 and the raw weighted total > 60, then rawTotal is set to 60 and `wasCappedByConfidence = true`. Final totalScore is then min(100, max(0, rawTotal)).
- **Intent:** Prevent a high deal score when data quality is low. Preserve as-is.

---

## 4. Refactor Summary

- **No changes** to dealScoringEngine, confidenceMeterEngine, underwritingEngine, simulationEngine.
- **New:** Property-detail layer that:
  1. Accepts **PropertyDetailAnalysisInput** (property fields + optional financing/expense overrides).
  2. Builds **SimulationInputs** with defaults for missing financing/expense.
  3. Runs **run(simulationInputs)** → SimulationResult.
  4. Builds **ConfidenceMeterInputs** from property completeness + rent/expense presence + optional manualOverrideCount.
  5. Runs **evaluate(confidenceInputs)** → ConfidenceMeterResult.
  6. Builds **DealScoreInputs** via **fromSimulationResult** with options.dataConfidence = confidenceResult.score / 100 (and optional stressDSCR, etc.).
  7. Runs **score(dealScoreInputs)** → DealScoreResult.
  8. Assembles **PropertyDetailAnalysisResult** (deal breakdown, confidence breakdown, key metrics, risk/strength flags, assumptions).

---

## 5. References

- dealScoringEngine.ts, dealScoreInputsFromSimulation.ts, types.ts
- confidenceMeterEngine.ts, types.ts, confidenceMeterCopy.ts
- underwritingEngine.ts, types.ts
- simulationEngine.ts, types.ts
- importLimits.ts (PropertyImportData, toPropertyRow)
