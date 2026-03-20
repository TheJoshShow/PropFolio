# Quant Audit: Score Engine, Archetypes, Confidence Meter

**Scope:** Score inflation risk, overweighted/duplicated factors, poor-confidence labeling, score vs confidence comprehension, stress-case logic.

---

## 1. Verdict Summary

| Check | Pass/Fail | Notes |
|-------|-----------|--------|
| Score inflation risk | **CONDITIONAL** | Renormalization when factors missing can inflate; cap at 60 when confidence &lt; 50 mitigates. **Revision:** avoid double-counting cash flow. |
| Overweighted / duplicated factors | **FAIL → FIX** | Monthly and annual cash flow are the same signal (×12); double-counted (18% combined). **Revision:** use single cash-flow factor. |
| Poor-confidence deal labeled too strongly | **PASS** | Confidence &lt; 50 caps score at 60 (max "Good"). **Revision:** surface cap in archetype when capped. |
| User comprehension: score vs confidence | **CONDITIONAL** | Docs separate them; UI needs explicit labels and one-liner. **Revision:** add copy for UI. |
| Stress-case logic fair and understandable | **CONDITIONAL** | Formula is clear; default scenario not documented. **Revision:** document stress definition. |

**Overall: CONDITIONAL PASS** — apply revisions below.

---

## 2. Score Inflation Risk

- **Risk:** When many factors are missing, the score is the weighted average over **present** factors only. A deal with only cap rate, DSCR, and data confidence can score high if those three are strong, even though cash flow, expense ratio, vacancy, etc. are unknown. So the score can be "optimistic" when data is thin.
- **Mitigation:** (1) Required inputs (cap rate or cash flow, DSCR, data confidence) must be present for any score. (2) Data confidence &lt; 50 caps at 60, so low confidence prevents Strong/Exceptional. (3) Confidence Meter is separate and can be shown next to the score so users see "analysis confidence" when it's low.
- **Revision:** None beyond ensuring the confidence cap is always surfaced when active. Optional: consider a "minimum number of factors" before allowing score &gt; 75 (e.g. at least 6 factors present). Deferred; current guardrail is sufficient if UI shows confidence.

---

## 3. Overweighted / Duplicated Factors

- **Issue:** Monthly cash flow (10%) and annual cash flow (8%) are the same quantity (annual = monthly × 12). Including both gives cash flow 18% weight and double-counts one signal.
- **Revision:** Use a **single cash-flow factor**: when both are present, score from one only (e.g. annual); when only monthly is present, derive annual for scoring. Weight for the single factor = 18%. Implemented in code.

---

## 4. Poor-Confidence Deal Labeled Too Strongly

- **Current:** Data confidence sub-score &lt; 50 → total score capped at 60 → band at most "Good", archetype at most "Stable". So we never show Strong/Exceptional when confidence is low.
- **Gap:** The archetype badge (e.g. "Stable") does not indicate that the score was capped. A user might think "Stable" is the full picture.
- **Revision:** When `wasCappedByConfidence` is true, archetype callout or badge should qualify (e.g. "Stable — score capped; improve data to see full score"). Add a `DealArchetype` or `DealScoreResult`-based copy helper that returns a qualifier when capped.

---

## 5. User Comprehension: Score vs Confidence

- **Current:** Confidence Meter doc says it is "not the deal score"; deal score measures deal quality, confidence measures data/assumption quality. Labels differ (Deal score vs Confidence / Analysis confidence).
- **Revision:** Add a single **score-vs-confidence one-liner** for UI: e.g. "Deal score: how the numbers look. Confidence: how much we trust the data." Use in headers or tooltips. Implemented in copy.

---

## 6. Stress-Case Logic

- **Current:** Downside resilience uses a single `stressDSCR` input. The **definition** of the stress scenario (e.g. 5% rent drop, 2% higher vacancy) is not in code or user-facing copy.
- **Fairness:** If the scenario is mild and consistent, the logic is fair. Sub-score &lt;1→0, 1→50, ≥1.25→100 is understandable.
- **Revision:** Document the **default stress scenario** in spec and in factor explanation: e.g. "Stress scenario: 5% rent drop and 2% higher vacancy. Stress DSCR = NOI after that / debt service. Optional; if not provided, this factor is omitted from the score."

---

## 7. Revisions Implemented

1. **Deal score:** Single cash-flow factor — when both monthly and annual are present, score only from annual (one component, weight 18%); when only monthly present, use it (weight 18%). Test added: `testCashFlow_singleFactorWhenBothPresent_noDoubleCount`.
2. **Archetype:** `DealArchetype.qualifierWhenCapped(whenCappedByConfidence:)` returns "Score capped; improve data to see full score." when true; nil otherwise. Show under badge when capped.
3. **Copy:** `DealScoreExplanations.scoreVsConfidenceOneLiner()` = "Deal score: how the numbers look. Confidence: how much we trust the data." Confidence Meter UX guidelines updated to reference it.
4. **Stress scenario:** `factorExplanation(.downsideResilience)` and DEAL-SCORING-SPEC now document default: 5% rent drop and 2% higher vacancy; stress DSCR = NOI after ÷ ADS; factor optional.
