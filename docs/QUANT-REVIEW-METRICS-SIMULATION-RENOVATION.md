# Quant Review: Metrics Engine, What-If Engine, Renovation Model

**Scope:** Underwriting (metrics) engine, simulation (what-if) engine, renovation planning model.  
**Checks:** Formula correctness, unit consistency, zero/missing handling, sign conventions, double-counting risk, renovation → cash needed, scenario recompute.

---

## 1. Verdict Summary

| Area | Pass/Fail | Notes |
|------|-----------|--------|
| **Metrics (underwriting) formulas** | **PASS** | Formulas match standard definitions; zero/negative guarded. |
| **Unit consistency** | **PASS** | All money USD; rates decimal; annual vs monthly explicit. |
| **Zero / missing handling** | **PASS** | Nils and guards throughout; no divide-by-zero. |
| **Sign conventions** | **PASS** | Income/expense signs consistent; negative inputs rejected or clamped. |
| **Double-counting risk** | **PASS** | Operating expenses vs renovation separate; no overlap. |
| **Renovation → cash needed** | **PASS** | Renovation total feeds total cash to close correctly. |
| **Cash on cash vs total cash** | **CONDITIONAL** | CoC uses equity = down + closing only; reno not in denominator (see §8). |
| **Scenario recompute** | **PASS** | Any change to `inputs` triggers full recompute. |
| **Renovation plan edge cases** | **FIX APPLIED** | Region multiplier clamped to ≥ 1 to avoid negative/zero totals. |

**Overall: PASS** (with one code fix and optional CoC clarification).

---

## 2. Formula Correctness

- **Income/expense:** GSR = monthlyRent×12 or input; vacancy-adjusted = GSR×(1−vacancy/100); EGI = vacancy-adjusted + other; NOI = EGI − OE. All correct.
- **Debt/cash flow:** ADS = input or PMT formula; monthly CF = (NOI−ADS)/12; annual CF = NOI−ADS; DSCR = NOI/ADS. Correct.
- **Returns:** Cap rate = NOI/price; CoC = annual CF/(price−loan); GRM = price/GSR; expense ratio = OE/EGI; break-even = (OE+ADS)/EGI; debt yield = NOI/loan; LTV = loan/price. Correct.
- **Per-unit/occupancy:** Price per unit, price per sq ft, breakeven occupancy (OE+ADS)/(GSR+other) capped at 1, 5-year paydown from amortization. Correct.
- **Renovation:** Subtotal(tier), subtotal×regionMultiplier (clamped ≥1), contingency = subtotalWithRegion×contingencyPercent/100, total = subtotalWithRegion + contingency. Correct.

---

## 3. Unit Consistency

Money in USD; rates as decimal (0.065 = 6.5%); vacancy/contingency as 0–100; annual vs monthly explicit. **PASS.**

---

## 4. Zero / Missing Handling

Metrics: missing → nil; division guarded (price>0, ADS>0, EGI>0, etc.). Simulation: nil expenses → 0 in sum. Renovation: empty tier → 0. Amortization: rate=0 handled. **PASS.**

---

## 5. Sign Conventions

Income/expense non-negative where required; negative other income → 0; cash flow can be negative. **PASS.**

---

## 6. Double-Counting Risk

Operating expenses (recurring) vs renovation (one-time) are separate. Plan-level contingency is % of subtotal; line item "permits/contingency" is for permit fees. **PASS** (document in UI).

---

## 7. Renovation Totals Feed Cash Needed

`totalCashToClose = downPayment + closing + renoTotal`; reno from plan.total(tier) or legacy renovationCosts.total. **PASS.**

---

## 8. Cash on Cash vs Total Cash (Recommendation)

Current: `equityInvested = down + closing`; CoC = annualCashFlow/equityInvested. Renovation is **not** in the CoC denominator. Optional: document "equity invested = down + closing" or add "total cash invested" = down + closing + reno and a separate metric (e.g. CF / total cash invested).

---

## 9. Scenario Recompute

`SimulationViewModel.inputs` didSet → `recompute()` → `result = SimulationEngine.run(inputs)`. loadScenario sets inputs → recompute. **PASS.**

---

## 10. Fix Applied

**RenovationPlan.subtotalWithRegion:** `regionMultiplier` values < 1 now treated as 1 so totals stay non-negative.

---

## 11. Extra Tests Added

- Underwriting: cap rate at NOI=0; expense ratio at OE=0; DSCR when NOI < ADS; breakeven when ratio > 1 (capped at 1).
- Simulation: reno plan with all nil for tier → total 0; total cash = down + closing.
- Renovation: region multiplier 0 or negative → total = subtotal (mult treated as 1); contingency 0% and 100%.
- Scenario: loadScenario then result matches engine run on loaded inputs.
