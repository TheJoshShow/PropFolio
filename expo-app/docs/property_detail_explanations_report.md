# Property Detail — Explanations Report

**Purpose:** Summary of transparent explanations: deal score, confidence, and explanation drawer/accordion content.  
**Date:** 2026-03-18

---

## 1. Deal score section (enhanced)

| Element | Source | Compliance |
|---------|--------|------------|
| Overall score | `analysisResult.dealScore.totalScore` (0–100 or —) | Shown as a model output |
| Band | `analysisResult.dealScore.band` → `dealBandLabel()` | Band labels/descriptions avoid guarantees and encourage verification |
| Short summary sentence | `analysisResult.dealScore.explanationSummary` | Informational; no guarantees |
| Expandable breakdown by factor | `analysisResult.dealScore.components[]` (sub-score + weight + optional raw value) | No promises; framed as inputs/signals, not outcomes |
| Intro for breakdown | `DEAL_BREAKDOWN_INTRO` | Explicit “model output / verify locally” framing |

---

## 2. Confidence section (enhanced)

| Element | Source | Compliance |
|---------|--------|------------|
| Overall confidence | `analysisResult.confidence.score` (0–100) | Informational; not a performance prediction |
| Band | `analysisResult.confidence.band` → `confidenceBandLabel()` | Avoids guarantees |
| What confidence means | `WHAT_CONFIDENCE_MEANS` | Explains data quality/assumption burden; encourages local verification |
| Recommended next actions | Shown when band is medium / low / veryLow; from `analysisResult.confidence.recommendedActions[]` | Actionable verification steps; no guarantee language |

---

## 3. Explanation accordion (three items)

### 3.1 How the score is calculated

**Title:** "How the score is calculated"

**Body:**  
"The deal score is a **weighted combination** of several factors: cash flow quality, cash-on-cash return, cap rate, DSCR, rent efficiency, downside resilience, upside potential, and penalties (e.g. negative cash flow or very low DSCR). Each factor is scored 0–100 and combined using fixed weights. The result is **model output** for informational use only and is **not a guarantee** of future performance. If data confidence is low, the displayed score may be **capped at 60** so we don’t show a high number when inputs are weak."

### 3.2 Which fields are estimated

**Title:** "Which fields are estimated"

**Body:**  
"Fields marked **(estimated)** or **(default)** in the Assumptions section were not provided by you and were filled using our defaults or inferred from other inputs (e.g. operating expenses as a percentage of income when not provided). Estimated fields reduce confidence. **Verify important assumptions locally**—especially rent, expenses, and financing—before relying on the analysis."

### 3.3 Why the score may be capped

**Title:** "Why the score may be capped"

**Body:**  
"When **confidence is below 50**, we cap the displayed deal score at **60** even if the raw score is higher. This avoids showing a strong score when the underlying data is thin or mostly estimated. **Improve data quality** (add rent, confirm expenses, confirm financing) to unlock the full score. The cap is for transparency only; it does not guarantee that an uncapped score would be accurate."

---

## 4. Wording compliance checklist

- [x] Model output, not guarantee — Used in score intro, accordion, and disclaimers.
- [x] Informational use only — In footer disclaimer and confidence/accordion copy.
- [x] Verify important assumptions locally — In confidence copy, accordion "Which fields are estimated", and score breakdown intro.

---

## 5. Files

- **UI:** `app/(tabs)/portfolio/[id].tsx` — deal summary + expandable factor breakdown; confidence “what it means” + recommended actions for medium/low/veryLow; accordion items “How calculated” / “Estimated fields” / “Why capped”.
- **Analysis service:** `src/features/property-analysis/runPropertyDetailAnalysis.ts` (returns `dealScore`, `confidence`, `strengthFlags`, `riskFlags`, `assumptions`, `keyMetrics`).
- **Copy/constants:** `src/lib/propertyAnalysis/transparencyCopy.ts` and `src/lib/propertyAnalysis/propertyAnalysisCopy.ts` (labels + disclaimer + accordion bodies).
