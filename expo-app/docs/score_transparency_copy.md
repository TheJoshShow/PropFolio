# Score Transparency Copy

**Purpose:** Compliant, transparent copy for the deal score on Property Detail.  
**Rules:** Model output only; no guarantee; informational use; verify locally.  
**Date:** 2025-03-12

---

## 1. Overall score

- **Label:** "Deal score"
- **Value:** Number 0–100 or "—" when insufficient data.
- **Subtitle (below value):** Band label (e.g. "Good", "Insufficient data").

---

## 2. Short summary sentence

Use `explanationCopy.dealSummary` from the analysis (e.g. "Good (72/100). Key metrics meet or exceed typical targets. Review expenses and financing for accuracy.").

**Compliance:** All band descriptions in `propertyAnalysisCopy` already state "not a guarantee" or "verify" where appropriate.

---

## 3. Factor breakdown (expandable)

Each factor is listed with a **human-readable label** and the **explanation string** from `factorExplanations[factorId]`. Labels below.

| Factor ID | Display label |
|-----------|----------------|
| cashFlowQuality | Cash flow quality |
| cashOnCashReturn | Cash-on-cash return |
| capRate | Cap rate |
| dscr | DSCR |
| rentEfficiency | Rent efficiency |
| downsideResilience | Downside resilience |
| upsidePotential | Upside potential |
| penalties | Penalties |

**Intro line for breakdown:**  
"The deal score is a weighted model output based on the factors below. It is not a guarantee of future performance. Verify important assumptions locally."

---

## 4. Compliant wording (reuse everywhere)

- **Model output:** "The score is a **model output** based on the data you provided and our formulas."
- **Not a guarantee:** "It is **not a guarantee** of future performance or returns."
- **Informational only:** "This analysis is for **informational use only**."
- **Verify locally:** "**Verify** important assumptions (rent, expenses, financing) with local sources and professionals."

---

## 5. One-line disclaimer (below score cards)

"Scores are indicative only and do not guarantee future performance."
