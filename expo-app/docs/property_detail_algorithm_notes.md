# Property Detail — Day-One Analysis Algorithm Notes

**Purpose:** Transparent notes on the property analysis pipeline: weights, formulas, confidence cap, and safe defaults.  
**No guarantee of performance; estimated fields are marked.**  
**Date:** 2026-03-18

---

## 1. Pipeline Overview

1. **Sanitize** all inputs (NaN/Infinity → null; clamp where applicable).
2. **Derive metrics** from raw inputs if not provided (NOI, cap rate, DSCR, cash flow, CoC, expense ratio, breakeven occupancy).
3. **Compute confidence score** (0–100) from six categories; compute **confidence band**.
4. **Compute raw deal score** (0–100) from eight categories; compute **deal band**.
5. **Apply confidence cap:** if confidence &lt; 50, displayed deal score = min(rawDealScore, 60).
6. **Build** strengths, risks, assumptions, and explanation copy.

---

## 2. Deal Score (0–100)

### 2.1 Categories and Weights

| Category | Weight | Description |
|----------|--------|-------------|
| cashFlowQuality | 0.18 | Monthly/annual cash flow level |
| cashOnCashReturn | 0.12 | CoC return (decimal → score) |
| capRate | 0.12 | Cap rate (decimal → score) |
| dscr | 0.15 | Debt service coverage ratio |
| rentEfficiency | 0.10 | Rent relative to price |
| downsideResilience | 0.12 | Breakeven occupancy + DSCR |
| upsidePotential | 0.08 | Cap rate as upside proxy |
| penalties | 0.13 | Negative CF or DSCR &lt; 1 reduce score |

Sum of weights = 1. Penalties contribute `(100 - penaltyScore) * weight` so that high penalty lowers the total.

### 2.2 Sub-Score Formulas (0–100 each)

- **cashFlowQuality:** `min(100, annualCashFlow / 15000 * 80)`; ≤0 → 0.
- **cashOnCashReturn:** `min(100, coc * 500)`; &lt;0 → 0.
- **capRate:** `min(100, capRate * 1000)`; &lt;0 → 0.
- **dscr:** &lt;1 → `dscr * 30`; ≥2 → 100; else linear 40–100.
- **rentEfficiency:** `min(100, (gsr/price) * 1500)`.
- **downsideResilience:** average of (1 − breakevenOccupancy)*80 and DSCR-based score (1.25+ → 100, 1+ → 60, else lower).
- **upsidePotential:** `min(100, capRate * 800)`.
- **penalties:** 0–100 penalty score; 50 if negative CF, +50 if DSCR &lt; 1; then `100 - penalty` is the contribution.

All intermediate values are clamped to avoid NaN/Infinity. Missing metrics yield 0 for that category (or null and then 0 in the weighted sum).

### 2.3 Minimum Inputs for a Score

We require: **purchase price &gt; 0**, **rent (or GSR) &gt; 0**, and **financing** (annual debt service or loan amount). Otherwise we return `rawDealScore: null`, `dealBand: 'insufficientData'`.

---

## 3. Confidence Score (0–100)

### 3.1 Categories and Weights

| Category | Weight | Description |
|----------|--------|-------------|
| sourceCompleteness | 0.22 | How many key fields are present |
| sourceReliability | 0.20 | API vs user vs default |
| freshness | 0.18 | How recent the data is |
| crossSourceAgreement | 0.15 | Agreement across sources |
| assumptionBurden | 0.15 | Fewer defaults/estimates = higher score |
| outlierChecks | 0.10 | Values in plausible range |

Inputs are 0–1 (or count for assumption burden). **Assumption burden** is inverted: high burden → low score. We also use `estimatedFieldCount` to reduce score (e.g. 100 − count×15, clamped).

### 3.2 Defaults When Not Provided

- sourceCompleteness, freshness, crossSourceAgreement, outlierChecks: default **0.5** (50% when input null).
- sourceReliability: default **0.4**.
- assumptionBurden: derived from `estimatedFieldCount` and optional 0–1 burden input.

---

## 4. Confidence-Based Cap

- **Threshold:** confidence &lt; **50**.
- **Cap:** displayed deal score = **min(rawDealScore, 60)** when cap applies.
- **Intent:** Avoid showing a high deal score when data quality is low. UI can show “Score capped; improve data to unlock.”

---

## 5. Metrics Derivation (When Not Provided)

- **GSR:** `grossScheduledRentAnnual ?? monthlyRent * 12`.
- **EGI:** `GSR * (1 - vacancyPercent/100)`; default vacancy 5%.
- **NOI:** `EGI - operatingExpensesAnnual`. If expenses missing, we default **operating expenses = 40% of EGI** (see `DEFAULT_EXPENSE_RATIO_EGI` in the builder) and mark expense ratio as estimated.
- **Debt service:** from input `annualDebtService` or derived from loan amount, rate, term if available.
- **Cap rate:** `NOI / purchasePrice`.
- **Cash flow:** `(NOI - ADS) / 12` monthly; annual analog.
- **DSCR:** `NOI / ADS`.
- **Cash-on-cash:** `annualCashFlow / equity`; equity = down + closing (down from downPaymentPercent or 25% default; closing 2% default).
- **Expense ratio:** `operatingExpenses / EGI`.
- **Breakeven occupancy:** `(OE + ADS) / GSR`.

Any derived metric that was not in the input is marked **estimated** in `metricsSummary.isEstimated` for UI.

---

## 6. Safe Defaults and Defensive Math

- All numeric inputs are sanitized: `null`/`undefined` preserved; NaN/Infinity → null.
- All sub-scores and final scores are clamped to 0–100 (or 0–1 where documented).
- Division by zero avoided (check denominator &gt; 0).
- Copy never implies guaranteed performance; “estimated” and “verify” language used.

---

## 7. Files

- **Types:** `src/lib/propertyAnalysis/propertyAnalysisTypes.ts`
- **Pipeline:** `src/lib/propertyAnalysis/buildPropertyDetailAnalysis.ts`
- **Copy:** `src/lib/propertyAnalysis/propertyAnalysisCopy.ts`
- **Tests:** `src/lib/propertyAnalysis/__tests__/buildPropertyDetailAnalysis.test.ts`

Weights and cap threshold are in `buildPropertyDetailAnalysis.ts` as constants for easy adjustment.
