# User Trust and Disclaimer Recommendations

**Purpose:** Ensure PropFolio presents scores, estimates, and analysis in a way that builds trust and avoids overstatement. Supports legal/reputational safety and product rule: "Every screen must help users feel confident they can make money" without overclaiming.

**Last updated:** 2025-03-12.

---

## 1. Confidence score as primary metric

- **Recommendation:** Treat the **Confidence Meter** as the primary trust signal, not just the Deal Score. Surfaces where the analysis is well grounded vs. where it relies on assumptions or missing data.
- **Copy:** Use existing band descriptions ("Analysis is well grounded…", "Verify key inputs", "Add data to improve confidence"). Ensure they appear wherever deal score is prominent (e.g. property detail, report).
- **Risk reduction:** If deal score is high but confidence is low, the UI should make the limitation visible (e.g. "Score is capped because data confidence is low" from dealScoreExplanations).

---

## 2. Deal score

- **Recommendation:** Always frame the deal score as **based on the inputs and assumptions provided**, not as a guarantee of outcome.
- **Suggested wording (short):** "Deal score: based on your inputs and our model."
- **Suggested wording (where space allows):** "This score reflects how the numbers look given the data you've entered. It is not a guarantee of investment performance."
- **Insufficient data:** Already clear: "We need at least cap rate or cash flow, DSCR, and data confidence to score this deal."
- **Capped by confidence:** Already good: "Your score is capped at 60 because data confidence is low. Improve data quality to unlock a higher score."

---

## 3. Rent estimate

- **Recommendation:** Always label rent from RentCast (or any API) as an **estimate**, and that it can be wrong.
- **Suggested wording:** "Estimated monthly rent" (not "Monthly rent") and, where appropriate: "Rent estimates are approximate and may not reflect actual market rent."
- **When rent is missing:** "Add a rent estimate from a listing, appraisal, or rent comp source" (confidence copy)—already good. In import flow, when rent fails: "Address found; rent estimate unavailable. You can add rent later."

---

## 4. Underwriting and financial metrics

- **Recommendation:** Treat all underwriting outputs (NOI, DSCR, cash flow, cap rate, CoC, etc.) as **results of a model** given user and system inputs, not as facts.
- **Suggested wording (near key metrics):** "Based on your inputs and our calculations." or "Model outputs—verify with your own numbers."
- **Assumptions:** Where the app shows expense ratio, vacancy, or financing assumptions, label them as "Assumptions" or "Your assumptions" so users do not treat them as verified facts.

---

## 5. Market and census data

- **Recommendation:** Census (income, home value) is for **context only**; do not imply it drives the score or that it is current.
- **Suggested wording:** "Market context" or "For context: census-derived data; may be outdated."

---

## 6. Disclaimers (legal/compliance)

- **Recommendation:** Maintain a short, visible disclaimer in settings or first-time experience, and optionally a link to full terms.
- **Suggested short disclaimer:** "PropFolio provides analysis and estimates for informational purposes only. They are not investment, tax, or legal advice. Verify all numbers and consult professionals before making decisions."
- **Rent-specific:** "Rent and value estimates are approximate and may differ from actual market outcomes."
- **Score-specific:** "Deal and confidence scores are based on our models and your inputs; they do not guarantee any investment result."

---

## 7. Error and degradation

- **Recommendation:** When data is missing or an API fails, use **clear, honest** messages and offer a path forward.
- **Examples:**
  - Geocode fails: "We couldn't verify that address. Check it and try again, or enter it manually."
  - Rent fails: "We couldn't get a rent estimate for this address. You can still add the property and enter rent yourself."
  - Import fails (retryable): "Something went wrong. Please try again."

Avoid generic "Something went wrong" when a more specific message is available; use generic only when we have no safe, specific message.

---

## 8. Implementation checklist

- [ ] **Rent label:** In import success and anywhere rent is shown from API, use "Estimated monthly rent" and optional one-line disclaimer.
- [ ] **Deal score screen:** Add one line: "Based on your inputs and our model" (or similar) near the score.
- [ ] **Confidence:** Ensure confidence band + recommended actions are visible whenever deal score is shown.
- [ ] **Settings / About:** Add short disclaimer block (informational only; not advice; verify numbers; rent/score disclaimers).
- [ ] **Analytics:** Do not send PII in event metadata; keep SAFE_METADATA_KEYS and product rule.

These recommendations are reflected in the algorithm audit and assumptions register and are implemented in code where specified in the error-handling matrix and patches.
