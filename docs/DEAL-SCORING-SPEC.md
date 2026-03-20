# Deal Scoring Engine Spec

**Purpose:** Help buyers feel confident they will make money. Score 0–100 with sub-scores, weights, and guardrails.

---

## 1. Score Bands

| Band   | Score range | Label       | Meaning |
|--------|-------------|-------------|--------|
| Top    | 90–100      | Exceptional | Strong profitability, resilience, and data support. |
| Strong | 75–89       | Strong     | Solid deal; minor gaps. |
| Good   | 60–74       | Good       | Reasonable; some risk or missing data. |
| Fair   | 45–59       | Fair       | Marginal; material risks or weak data. |
| Weak   | 30–44       | Weak       | Poor economics or resilience. |
| Poor   | 0–29        | Poor       | High risk or insufficient data. |

---

## 2. Inputs (to sub-scores)

Each input is normalized to a **sub-score 0–100** (higher = better for the deal). Missing optional inputs omit that component and weights are renormalized among present components.

| # | Input | Description | Units | Sub-score mapping | Weight |
|---|--------|-------------|--------|-------------------|--------|
| 1 | **Cap rate** | NOI / purchase price | decimal (e.g. 0.06) | 0%→0, 5%→50, 10%→100 (linear); >10%→100 | 12% |
| 2–3 | **Cash flow** (one of) | Monthly or annual (NOI − ADS) | USD | Only one used to avoid double-counting. Annual preferred if both present. ≤0→0; scale to 0–100. | 18% |
| 4 | **Cash on cash return** | Annual CF / equity | decimal (e.g. 0.05) | 0%→0, 5%→50, 10%→100 (linear); >10%→100 | 10% |
| 5 | **DSCR** | NOI / ADS | ratio | <1→0; 1.0→20; 1.25→50; 1.5→75; 2.0+→100 | 12% |
| 6 | **Expense ratio** | OE / EGI | decimal (e.g. 0.45) | 30%→100, 50%→50, 70%→0 (linear); <30%→100 | 6% |
| 7 | **Vacancy sensitivity** | Breakeven occupancy (0–1) | decimal | 1.0→0, 0.8→50, 0.6→100 (lower breakeven = better); >1→0 | 6% |
| 8 | **Renovation burden** | Renovation total / total cash or price | decimal | 0%→100, 10%→50, 20%+→0 (linear) | 6% |
| 9 | **Purchase discount** | (Est. value − price) / value | decimal; optional | 0%→0, 10%→50, 20%+→100; missing→omit | 5% |
| 10 | **Rent coverage strength** | GSR / ADS (gross rent multiple) | ratio; optional | 1.0→0, 1.5→50, 2.0+→100; missing→omit | 5% |
| 11 | **Data confidence** | 0–1 confidence score | decimal | Linear 0→0, 1→100. **Guardrail:** used to cap overall score | 12% |
| 12 | **Market tailwinds** | Future value predictor score | 0–100 or decimal | If 0–100, use as-is; if decimal, scale to 100 | 4% |
| 13 | **Downside resilience** | Stress DSCR (see below) | ratio | Stress DSCR ≥1.25→100, 1.0→50, <1→0. Optional; omitted if not provided. | 4% |

**Weight sum:** 12+18+10+12+6+6+6+5+5+12+4+4 = 100%.

**Default stress scenario (for downside resilience):** 5% rent drop and 2% higher vacancy. Stress DSCR = NOI after that ÷ annual debt service. If not provided by caller, factor is omitted.

---

## 3. Sub-score formulas (0–100)

- **Cap rate:** `min(100, max(0, capRate * 1000))` (5%→50, 10%→100).
- **Monthly cash flow:** `≤0 → 0`; else `min(100, (cf/1500)*80)` with floor at 0 (e.g. $500→~27, $1500→80).
- **Annual cash flow:** `≤0 → 0`; else `min(100, (cf/30000)*80)` (scale similarly).
- **Cash on cash:** `min(100, max(0, cashOnCashReturn * 1000))` (5%→50, 10%→100).
- **DSCR:** `<1 → 0`; `1→20`; linear 1–1.25→20–50, 1.25–1.5→50–75, 1.5–2→75–100; `≥2→100`.
- **Expense ratio:** as decimal; `≥0.70→0`, `≤0.30→100`, linear 0.30–0.70→100–0.
- **Vacancy sensitivity (breakeven occ):** as decimal 0–1; `≥1→0`; linear 1.0–0.6→0–100 (so `(1 - breakevenOcc) / 0.4 * 100` capped).
- **Renovation burden:** ratio reno/(price or total cash); 0→100, 0.20→0, linear.
- **Purchase discount:** (value−price)/value; 0→0, 0.10→50, 0.20+→100, linear.
- **Rent coverage:** GSR/ADS; 1→0, 1.5→50, 2+→100, linear.
- **Data confidence:** 0–1 → 0–100 linear.
- **Market tailwinds:** if 0–1 scale → *100; else use as 0–100.
- **Downside resilience:** stress DSCR (e.g. from 5% rent drop + 2% vacancy); <1→0, 1→50, ≥1.25→100. Optional.

---

## 4. Weighted score and guardrails

- **Weighted sum:** For each present input, sub_score_i × weight_i; sum / sum(weights for present). Optional inputs (purchase discount, rent coverage) if missing: exclude and renormalize remaining weights to sum to 1.
- **Guardrails:**
  - If **data confidence** sub-score < 50: **cap overall score at 60** (cannot show “Strong” or “Exceptional” with low confidence).
  - If **required inputs** are missing (e.g. cap rate, DSCR, cash flow, confidence), **do not return a total score** (return nil or a “Insufficient data” state); or return a partial score with a flag that key inputs are missing.
- **Required for a valid total score:** at least cap rate OR cash flow, DSCR, and data confidence. If any of these are missing, total score = nil and explanation = “Need more data to score.”

---

## 5. Outputs

- **Total score:** 0–100 (integer or one decimal).
- **Score band:** enum (exceptional / strong / good / fair / weak / poor).
- **Sub-scores:** All 13 components with name, raw value, sub-score 0–100, weight, and “contribution” (sub_score × weight) for explanation.
- **Explanation:** Short list of “why this score” (e.g. “Strong cap rate and DSCR; score capped by low data confidence.”).

---

## 6. Normalization when inputs are missing

- **Optional:** purchase discount, rent coverage, market tailwinds, downside resilience. If missing, set contribution = 0 and **renormalize**: total = sum(contributions) / sum(weights of present components). So denominator excludes missing optional weights.
- **Required:** cap rate or (monthly + annual) cash flow, DSCR, data confidence. If required missing → no total score (or capped at 40 with “Insufficient data” band).
