# Confidence Explanation Copy

**Purpose:** Transparent copy for the confidence score and recommended actions.  
**Rules:** Informational; verify locally; no guarantee.  
**Date:** 2025-03-12

---

## 1. Overall confidence

- **Label:** "Confidence"
- **Value:** Number 0–100.
- **Subtitle:** Band label (High / Medium / Low / Very low).

---

## 2. What confidence means

**Heading:** "What confidence means"

**Body:**  
"Confidence reflects how grounded this analysis is in the data we have. **High** means we have relatively complete, reliable inputs; **low** means many inputs are missing or estimated. Confidence does not predict whether a deal will succeed—it only indicates how much you can rely on the numbers shown. **Verify important assumptions locally** (e.g. rent, expenses, financing) before making decisions."

---

## 3. Recommended next actions (when moderate or low)

Show when `confidenceBand` is `medium`, `low`, or `veryLow`.

**Heading:** "Recommended next steps"

**Bullets (use as applicable):**

- "**Add or confirm rent** — Use a listing, appraisal, or local rent comp to improve the analysis."
- "**Add or confirm expenses** — Taxes, insurance, and maintenance estimates improve confidence."
- "**Confirm financing terms** — Rate and term affect cash flow and DSCR; lock or verify with your lender."
- "**Verify numbers locally** — This analysis is for informational use only; confirm key inputs with local sources."
- "**Review assumptions** — Check the Assumptions section and update any default values that don’t match your situation."

**Footer line:**  
"These steps improve confidence in the model output; they do not guarantee any outcome."

---

## 4. Band-specific short description

From existing `confidenceBandDescription` in propertyAnalysisCopy (already compliant):

- **High:** "Analysis is based on relatively complete and reliable data. Still verify key numbers."
- **Medium:** "Analysis is reasonably grounded; some inputs may be estimated or from limited sources."
- **Low:** "Several inputs are missing or estimated. Treat the score as indicative, not definitive."
- **Very low:** "Limited data; many assumptions. Add or confirm sources to improve confidence."
