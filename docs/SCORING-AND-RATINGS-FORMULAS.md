# PropFolio — Scoring and Ratings: Formulas, Assumptions, and Reasoning

This document lists **all formulas and calculations** used for underwriting, deal scoring, and the confidence meter, with assumptions and reasoning. All logic is **deterministic** and **unit-tested**; no AI is used for numeric calculations.

---

## 1. Underwriting (financial metrics)

Underwriting turns user inputs (rent, expenses, purchase price, loan terms) into derived metrics. Implementation: `expo-app/src/lib/underwriting/`.

### 1.1 Income flow

| Metric | Formula | Assumptions / reasoning |
|--------|---------|-------------------------|
| **Gross scheduled rent (annual)** | `GSR = monthlyRent × 12` if GSR not provided; else `GSR = grossScheduledRentAnnual` | Single rent or annual total; no mid-lease changes. |
| **Vacancy multiplier** | `mult = 1 − (vacancyPercent / 100)` with vacancyPercent clamped to [0, 100] | Vacancy is applied linearly; default 0% if missing. |
| **Vacancy-adjusted gross income** | `VAGI = GSR × mult` | No other income in this step. |
| **Other income (annual)** | `otherIncome = input ≥ 0 ? input : 0`; missing → 0 | Laundry, fees, etc.; zero if not provided. |
| **Effective gross income (EGI)** | `EGI = VAGI + otherIncome` | EGI is the total income side before expenses. |
| **Operating expenses (annual)** | `OE = operatingExpensesAnnual` (must be ≥ 0) | User or system provides total OE; no breakdown required here. |
| **Net operating income (NOI)** | `NOI = EGI − OE` | Standard definition; negative NOI is allowed (not clamped). |

### 1.2 Debt and cash flow

| Metric | Formula | Assumptions / reasoning |
|--------|---------|-------------------------|
| **Annual debt service (ADS)** | If ADS provided directly: use it. Else: `ADS = monthlyPayment(loanAmount, rate, term) × 12` from amortization. | Amortization is full P&I; interest-only would need a different path. |
| **Monthly cash flow** | `monthlyCF = (NOI − ADS) / 12` | Cash flow after debt service. |
| **Annual cash flow** | `annualCF = NOI − ADS` | Same as monthly × 12; used for scoring and CoC. |
| **DSCR** | `DSCR = NOI / ADS` (ADS &gt; 0 required) | Standard ratio; &lt; 1 means cash flow does not cover debt. |

### 1.3 Amortization (used for ADS and paydown)

| Formula | Expression | Assumptions / reasoning |
|---------|------------|-------------------------|
| **Monthly P&I payment** | `P × (r(1+r)^n) / ((1+r)^n − 1)` with `n = termYears×12`, `r = annualRate/12` | Standard fully amortizing loan; rate is annual nominal. |
| **Balance after k months** | `B_k = P(1+r)^k − PMT × ((1+r)^k − 1)/r` | Same rate and payment; used for 5-year paydown. |
| **Annual debt service** | `ADS = monthlyPayment × 12` | No prepayment or extra principal. |

### 1.4 Return and ratio multipliers

| Metric | Formula | Assumptions / reasoning |
|--------|---------|-------------------------|
| **Cap rate** | `capRate = NOI / purchasePrice` (price &gt; 0) | Going-in cap rate; NOI and price must be consistent (same point in time). |
| **Cash-on-cash return** | `CoC = annualCashFlow / (purchasePrice − loanAmount)` (equity &gt; 0) | Return on equity; all-cash deal would divide by price. |
| **GRM** | `GRM = purchasePrice / GSR` (GSR &gt; 0) | Gross rent multiplier; useful when NOI not available. |
| **Expense ratio** | `expenseRatio = OE / EGI` (EGI &gt; 0) | Operating expenses as share of effective gross income. |
| **Break-even ratio** | `breakEven = (OE + ADS) / EGI` (EGI &gt; 0) | Minimum occupancy to cover OE + debt; &gt; 1 means cannot break even at 100% occupancy. |
| **Debt yield** | `debtYield = NOI / loanAmount` (loan &gt; 0) | Lender metric; no LTV in denominator. |
| **LTV** | `LTV = loanAmount / purchasePrice` (price &gt; 0) | Loan-to-value ratio. |

### 1.5 Unit and occupancy

| Metric | Formula | Assumptions / reasoning |
|--------|---------|-------------------------|
| **Price per unit** | `pricePerUnit = purchasePrice / unitCount` (unitCount &gt; 0) | For multifamily; single-family can use unitCount = 1. |
| **Price per sq ft** | `pricePerSqFt = purchasePrice / squareFeet` (sq ft &gt; 0) | For comparables. |
| **Breakeven occupancy** | `breakevenOcc = (OE + ADS) / (GSR + otherIncome)` clamped to [0, 1] | Fraction of rent needed to cover OE + debt; &gt; 1 means cannot break even. |
| **5-year equity paydown** | `paydown5 = loanAmount − balanceAfter(60, loanAmount, rate, monthlyPayment)` | Assumes no prepayment; 60 months or full term if shorter. |

---

## 2. Deal score (0–100)

Deal score answers: “How good is this deal financially?” Implementation: `expo-app/src/lib/scoring/dealScoringEngine.ts`. Spec: `docs/DEAL-SCORING-SPEC.md`.

### 2.1 Weights (sum = 100%)

| Factor | Weight | Rationale |
|--------|--------|-----------|
| capRate | 12% | Core yield signal; 5–10% range is typical. |
| monthlyCashFlow / annualCashFlow | 18% (single factor) | Only one of the two is used to avoid double-counting; cash flow is a primary outcome. |
| cashOnCashReturn | 10% | Return on equity; important for leveraged deals. |
| dscr | 12% | Debt coverage is critical for risk. |
| expenseRatio | 6% | High expenses erode yield. |
| vacancySensitivity (breakevenOcc) | 6% | Lower breakeven occupancy = more margin for vacancy. |
| renovationBurden | 6% | High reno burden increases risk and capital need. |
| purchaseDiscountVsValue | 5% | Optional; buying below value is a positive signal. |
| rentCoverageStrength (GSR/ADS) | 5% | Optional; rent cushion over debt. |
| dataConfidence | 12% | Data quality; also used in guardrail (cap at 60 when low). |
| marketTailwinds | 4% | Optional; future value / market context. |
| downsideResilience (stress DSCR) | 4% | Optional; resilience under stress. |

### 2.2 Sub-score formulas (each 0–100, higher = better)

Each input is mapped to a **sub-score** in [0, 100]. Missing optional factors are omitted; weights are renormalized over **present** factors only.

| Factor | Sub-score formula | Assumptions / reasoning |
|--------|-------------------|-------------------------|
| **capRate** | `min(100, max(0, capRate × 10))` (e.g. 10% → 100) | Linear in decimal; 0.05→50, 0.10→100; cap rate in decimal. |
| **annualCashFlow** | If present: `≤0 → 0`; else `min(100, (cf/30000)×80)`. If only monthly present: `min(100, (cf/1500)×80)`. | Scale to “strong” at $30k annual / $1.5k monthly; 80% of 100 at that level. |
| **cashOnCashReturn** | `min(100, max(0, CoC × 10))` (decimal; 10% → 100) | Linear; same scaling as cap rate for consistency. |
| **dscr** | &lt;1 → 0; 1 → 20; 1–1.25 → linear 20–50; 1.25–1.5 → 50–75; 1.5–2 → 75–100; ≥2 → 100. | Below 1 is critical; 1.25–1.5 is “acceptable”; 2+ is strong. |
| **expenseRatio** | ≤0.30 → 100; 0.30–0.70 → linear 100→0; ≥0.70 → 0. | Lower expense ratio is better; 70%+ is poor. |
| **vacancySensitivity** (breakevenOcc) | ≥1 → 0; 0.6–1 → linear (1−breakevenOcc)/0.4×100; ≤0.6 → 100. | Lower breakeven = better; 60% breakeven = max sub-score. |
| **renovationBurden** | 0 → 100; 0–0.20 → linear 100→0; ≥0.20 → 0. | Renovation as share of price/cash; 20%+ is full penalty. |
| **purchaseDiscountVsValue** | `min(100, (discount/0.20)×100)` (0%→0, 20%+→100) | (Value−Price)/Value; 20% discount = full score. |
| **rentCoverageStrength** | 1.0 → 0; 1.0–2.0 → linear (rc−1)×100; ≥2 → 100. | GSR/ADS; 2× coverage = strong. |
| **dataConfidence** | `min(100, max(0, confidence × 100))` (0–1 input) | Linear; used in weighted sum and in guardrail. |
| **marketTailwinds** | If 0–1: use as sub = value×100; else treat as 0–100. | Future value predictor or external score. |
| **downsideResilience** (stress DSCR) | &lt;1 → 0; 1 → 50; 1–1.25 → linear 50–100; ≥1.25 → 100. | Stress scenario (e.g. 5% rent drop, 2% higher vacancy); stress DSCR = stressed NOI / ADS. |

### 2.3 Weighted total and guardrails

- **Weighted total:**  
  `rawTotal = Σ (subScore_i × weight_i) / Σ weight_i`  
  Sum and denominator use only **present** factors (missing optionals excluded).

- **Confidence cap:**  
  If **dataConfidence sub-score &lt; 50** and **rawTotal &gt; 60**, then **totalScore = 60** (and `wasCappedByConfidence = true`).  
  **Reasoning:** Do not show “Strong” or “Exceptional” when we do not trust the data.

- **Required inputs for any score:**  
  At least one of (cap rate, monthly cash flow, annual cash flow), plus DSCR, plus data confidence. If any required is missing → `totalScore = null`, band = `insufficientData`.

- **Final total:**  
  `totalScore = min(100, max(0, rawTotal))` (after cap if applied).

### 2.4 Score bands

| Band | Score range | Label | Meaning |
|------|-------------|--------|--------|
| exceptional | 90–100 | Exceptional | Strong profitability, resilience, and data support. |
| strong | 75–89 | Strong | Solid deal; minor gaps. |
| good | 60–74 | Good | Reasonable; some risk or missing data. |
| fair | 45–59 | Fair | Marginal; material risks or weak data. |
| weak | 30–44 | Weak | Poor economics or resilience. |
| poor | 0–29 | Poor | High risk or insufficient data. |
| insufficientData | — | Insufficient data | Required inputs missing; no total score. |

---

## 3. Confidence meter (0–100)

Confidence answers: “How much do we trust this analysis?” Implementation: `expo-app/src/lib/confidence/confidenceMeterEngine.ts`.

### 3.1 Weights (sum = 100%)

| Factor | Weight | Rationale |
|--------|--------|-----------|
| propertyDataCompleteness | 18% | Completeness of property attributes. |
| rentEstimateConfidence | 18% | Source and reliability of rent estimate. |
| expenseAssumptionsConfidence | 15% | How well expense assumptions are supported. |
| renovationBudgetCertainty | 12% | Scope and certainty of renovation budget. |
| financingAssumptionsStability | 12% | Rate lock, terms stability. |
| marketDataReliabilityFreshness | 15% | Quality and freshness of market data. |
| manualOverrideImpact | 10% | Fewer overrides = higher confidence. |

### 3.2 Inputs and sub-scores

- All factors except **manualOverrideImpact** are **0–1** (fraction or “confidence level”).  
- **manualOverrideImpact** is derived from **manualOverrideCount** (number of overrides):

  **Override impact score:**  
  `overrideScore = max(0, 1 − min(count, 10) / 10)`.  
  - 0 overrides → 1 (no penalty).  
  - 10+ overrides → 0 (full penalty).  
  **Reasoning:** Many overrides mean the analysis reflects user inputs more than PropFolio data, so confidence in “data grounding” drops.

### 3.3 Weighted score and bands

- **Score:**  
  `score = (Σ value_i × weight_i) / (Σ weight_i) × 100` over present factors, clamped to [0, 100].  
  Only factors with value in [0, 1] are included.

- **Bands:**

| Band | Score range | Label | Meaning |
|------|-------------|--------|--------|
| high | 75–100 | High | Analysis is well grounded in data and assumptions. |
| medium | 50–74 | Medium | Reasonably grounded; a few gaps or overrides. |
| low | 25–49 | Low | Several assumptions or missing data; verify inputs. |
| veryLow | 0–24 | Very low | Limited data or many overrides; add sources and confirm assumptions. |

### 3.4 Supporting vs limiting factors

- **Supporting:** factor value ≥ 0.6 → contributes a “supporting” explanation line.  
- **Limiting:** factor value &lt; 0.5 → contributes a “limiting” explanation line and can trigger a recommended action.  
- If **manualOverrideCount ≥ 1**, a “manual override” limiting line is added (and for ≥3, a dedicated override recommended action).

---

## 4. Stress scenario (downside resilience)

The **downside resilience** factor in deal scoring uses a **stress DSCR** input. The **default stress scenario** (documented in spec and quant audit) is:

- **5% rent drop** and **2% higher vacancy** applied to the income side.  
- **Stress NOI** = NOI recalculated after that income reduction.  
- **Stress DSCR** = Stress NOI / ADS.  
- If the caller does not provide stress DSCR, the downside resilience factor is **omitted** from the deal score (no contribution).

---

## 5. Summary table: where each formula lives

| Area | File(s) | Spec / doc |
|------|---------|------------|
| Income (GSR, EGI, NOI) | `underwriting/incomeFlow.ts` | — |
| Debt, cash flow, DSCR | `underwriting/debtAndCashFlow.ts` | — |
| Amortization | `underwriting/amortization.ts` | — |
| Cap rate, CoC, ratios | `underwriting/returnMultiplier.ts` | — |
| Breakeven, paydown | `underwriting/unitAndOccupancy.ts` | — |
| Deal score | `scoring/dealScoringEngine.ts`, `scoring/types.ts` | `DEAL-SCORING-SPEC.md` |
| Confidence meter | `confidence/confidenceMeterEngine.ts`, `confidence/types.ts`, `confidenceMeterCopy.ts` | `QUANT-AUDIT-SCORE-ARCHETYPE-CONFIDENCE.md` |
| Weights and bands | In code above; founder guide | `FOUNDER-SCORING-WEIGHTS-GUIDE.md` |

---

## 6. Design principles

1. **Deterministic:** Same inputs always produce the same outputs; no AI in numeric calculations.  
2. **Unit-tested:** Underwriting and scoring have tests in `expo-app/src/lib/**/__tests__/`.  
3. **Guardrails:** Data confidence caps deal score at 60 when low; required inputs enforced for deal score.  
4. **Score vs confidence:** Deal score = “how the numbers look”; Confidence = “how much we trust the data.”  
5. **Single cash-flow factor:** Only one of monthly or annual cash flow is used in deal score to avoid double-counting (weight 18% total).

All formulas and assumptions above are implemented as in the codebase and may be audited against `expo-app/src/lib` and the referenced docs.
