# Underwriting Formula Spec

PropFolio investment calculation engine: formulas, inputs, units, edge-case rules, and missing-data handling. All calculations are deterministic; use `Decimal` for money and ratios. No AI/ML.

---

## 1. Income & expense flow

| Metric | Formula | Required inputs | Units | Edge cases | Missing data |
|--------|---------|-----------------|-------|------------|--------------|
| **Gross Scheduled Rent (GSR)** | `monthlyRent × 12` or `grossScheduledRentAnnual` | One of: `monthlyRent`, `grossScheduledRentAnnual` | $/year | If both provided, prefer `grossScheduledRentAnnual`. Negative → nil. | No rent input → nil. |
| **Vacancy-adjusted Gross Income** | `GSR × (1 - vacancyPercent/100)` | GSR, `vacancyPercent` (0–100) | $/year | vacancyPercent &lt; 0 or &gt; 100 → clamp to [0, 100]. | Missing GSR → nil; missing vacancy → use 0 (no vacancy). |
| **Other Income** | Input only | `otherIncomeAnnual` | $/year | Negative → treat as 0. | Missing → 0. |
| **Effective Gross Income (EGI)** | `vacancyAdjustedGrossIncome + otherIncomeAnnual` | Vacancy-adjusted gross income, other income | $/year | — | Missing vacancy-adjusted → nil; other → 0. |
| **Operating Expenses** | Input only | `operatingExpensesAnnual` | $/year | Negative → nil. | Missing → nil. |
| **Net Operating Income (NOI)** | `EGI - operatingExpenses` | EGI, operating expenses | $/year | — | Either missing → nil. |

---

## 2. Debt & cash flow

| Metric | Formula | Required inputs | Units | Edge cases | Missing data |
|--------|---------|-----------------|-------|------------|--------------|
| **Annual Debt Service (ADS)** | Input or derived: `PMT(rate/12, term×12, -loanAmount)×12` | `annualDebtService` **or** (`loanAmount`, `interestRateAnnual`, `termYears`) | $/year | If ADS derived: term or loanAmount ≤ 0 → nil; rate &lt; 0 → nil. | Cannot compute → nil. |
| **Monthly Cash Flow** | `(NOI - ADS) / 12` | NOI, ADS | $/month | — | Either missing → nil. |
| **Annual Cash Flow** | `NOI - ADS` | NOI, ADS | $/year | — | Either missing → nil. |
| **Debt Service Coverage Ratio (DSCR)** | `NOI / ADS` | NOI, ADS | ratio (dimensionless) | ADS ≤ 0 → nil. | Either missing → nil. |

---

## 3. Returns & multipliers

| Metric | Formula | Required inputs | Units | Edge cases | Missing data |
|--------|---------|-----------------|-------|------------|--------------|
| **Cap Rate** | `NOI / purchasePrice` | NOI, `purchasePrice` | decimal (e.g. 0.06 = 6%) | purchasePrice ≤ 0 → nil. | Either missing → nil. |
| **Cash on Cash Return** | `annualCashFlow / equityInvested` | Annual cash flow, `equityInvested` (= purchasePrice - loanAmount) | decimal | equityInvested ≤ 0 → nil. | Either missing → nil. |
| **Gross Rent Multiplier (GRM)** | `purchasePrice / GSR` | Purchase price, GSR (annual) | ratio (years) | GSR ≤ 0 → nil; purchasePrice ≤ 0 → nil. | Either missing → nil. |
| **Expense Ratio** | `operatingExpenses / EGI` | Operating expenses, EGI | decimal | EGI ≤ 0 → nil. | Either missing → nil. |
| **Break-even Ratio** | `(operatingExpenses + ADS) / EGI` | Operating expenses, ADS, EGI | decimal | EGI ≤ 0 → nil. | Any missing → nil. |
| **Debt Yield** | `NOI / loanAmount` | NOI, `loanAmount` | decimal | loanAmount ≤ 0 → nil. | Either missing → nil. |
| **Loan to Value (LTV)** | `loanAmount / purchasePrice` | Loan amount, purchase price | decimal (e.g. 0.75 = 75%) | purchasePrice ≤ 0 → nil. | Either missing → nil. |

---

## 4. Per-unit & per-SF

| Metric | Formula | Required inputs | Units | Edge cases | Missing data |
|--------|---------|-----------------|-------|------------|--------------|
| **Price per Unit** | `purchasePrice / unitCount` | Purchase price, `unitCount` | $/unit | unitCount ≤ 0 → nil. | Either missing → nil. |
| **Price per Square Foot** | `purchasePrice / squareFeet` | Purchase price, `squareFeet` | $/sq ft | squareFeet ≤ 0 → nil. | Either missing → nil. |

---

## 5. Occupancy & paydown

| Metric | Formula | Required inputs | Units | Edge cases | Missing data |
|--------|---------|-----------------|-------|------------|--------------|
| **Breakeven Occupancy** | `(operatingExpenses + ADS) / (GSR + otherIncomeAnnual)`; cap at 1.0 | OE, ADS, GSR, other income | decimal (0–1) | Denominator ≤ 0 → nil. Result &gt; 1 → 1. | Any missing → nil. |
| **5-year equity paydown (simple)** | `loanAmount - balanceAtMonth60`; balance from standard amortization | `loanAmount`, `interestRateAnnual`, `termYears` | $ | term &lt; 5 years → use balance at final month. rate &lt; 0 or loan ≤ 0 → nil. | Any missing → nil. |
| **IRR** | Scaffolding only | Explicit cash flow schedule (dates + amounts) | decimal | Not computed in MVP. | Return placeholder: "IRR requires explicit cash flow schedule." |

---

## 6. Input summary

**UnderwritingInputs** (all optional where noted):

- **Purchase / value:** `purchasePrice`
- **Financing:** `loanAmount`, `interestRateAnnual` (decimal, e.g. 0.065), `termYears`, `annualDebtService` (if provided, used instead of deriving)
- **Income:** `monthlyRent` or `grossScheduledRentAnnual`, `vacancyPercent` (default 0), `otherIncomeAnnual` (default 0)
- **Expenses:** `operatingExpensesAnnual`
- **Property:** `unitCount`, `squareFeet`

**Derived in engine (in order):** GSR → vacancy-adjusted gross income → EGI → NOI; ADS (if not provided) from loan/rate/term; then all ratios and cash flows.

---

## 7. Amortization (for ADS and 5-year paydown)

- Monthly payment: `PMT = P × (r(1+r)^n) / ((1+r)^n - 1)` where `P` = loan amount, `r` = monthly rate (annual/12), `n` = number of months.
- Balance at month `k`: standard amortization schedule (payments reduce principal). Use 60 months for 5-year paydown.
- All in `Decimal`; round monetary results to 2 decimal places for display; internal precision as needed for stability.

---

## 8. Human-readable explanations (UI)

Each metric has a short **name**, **formula sentence**, and **interpretation** string for tooltips or detail screens. See `MetricExplanations` in the codebase.
