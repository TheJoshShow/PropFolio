# Confidence Meter: UX Copy Guidelines

The Confidence Meter answers: **How confident is PropFolio that this analysis is grounded and dependable?** It is **not** the deal score (which measures deal quality). It measures **data and assumption quality**.

---

## 1. Principles

- **Simple:** Use short, clear sentences. Avoid jargon (e.g. "DSCR" is OK in context; "cap rate" is fine).
- **Confidence-building:** Explain what’s helping and what would help more. Avoid blame ("You didn’t add…") in favor of next steps ("Add or confirm…").
- **Not misleading:** Don’t imply the deal is good or bad. Don’t promise outcomes. Do say when data is thin or overrides are high.

---

## 2. What to show

- **Deal score vs confidence:** Always distinguish. Use e.g. "Deal score: how the numbers look. Confidence: how much we trust the data." (See `DealScoreExplanations.scoreVsConfidenceOneLiner()`.)
- **Score (0–100)** with a clear label: e.g. "Confidence" or "Analysis confidence," not "Score."
- **Band label:** High / Medium / Low / Very low (aligned with existing ConfidenceGrade).
- **Explanation:** One-line summary plus optional expandable "What’s helping" and "What’s reducing confidence."
- **Recommended actions:** 1–5 concrete next steps (e.g. "Complete property details," "Add a rent estimate from a listing").

---

## 3. Wording

- **Supporting factors:** Neutral, factual. E.g. "Property data is largely complete," "Rent estimate is from a reliable source."
- **Limiting factors:** Factual, not alarming. E.g. "Rent estimate is missing or from a weak source," "Several inputs were manually overridden."
- **Actions:** Start with a verb. E.g. "Complete…," "Add…," "Confirm…," "Define…," "Review…."

---

## 4. What to avoid

- Don’t tie the meter to deal quality: avoid "This deal is risky" or "This deal is strong" in the confidence UI.
- Don’t use the same labels as the deal archetype (Risky/Stable/Strong/Exceptional) for the meter; use High/Medium/Low/Very low.
- Don’t show a high confidence score when critical inputs are missing; the engine only uses present factors and can show 0 when nothing is provided.

---

## 5. Accessibility and placement

- Teaser: score + band color + one short line (e.g. "Analysis is well grounded").
- Full meter: score, band, summary, supporting/limiting lists, recommended actions.
- Screen readers: announce "Confidence: [score], [band]. [Summary]." and list actions as actionable hints.
