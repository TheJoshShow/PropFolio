# Live Scoring Launch Readiness

PropFolio ships as a **day-one live scoring/confidence app**. This document confirms that in-app deal and confidence scores are visible, copy is truthful, and disclaimers are in place for App Store and legal compliance.

## 1. Visible in-app scoring and confidence

| Surface | Deal score | Confidence | Status |
|--------|------------|------------|--------|
| **Portfolio list** | Deal score (0–100 or —) and band per row; badge "Deal X" or "Deal —" | Confidence band per row; badge "High/Medium/Low/Very low conf" | Live |
| **Property detail** | Hero badge; two score cards (deal + confidence); band labels; cap note when applicable | Same cards; "Confidence explained" expandable; recommended next steps when low | Live |
| **Explanations** | Deal summary line; factor breakdown (Pro); "About these scores" accordion (Pro) | What confidence means; recommended next steps for medium/low/veryLow | Live |

Scores are computed by the property detail analysis service (`runPropertyDetailAnalysis`) from stored property + financing inputs. No placeholder or "coming soon" score UI remains.

## 2. Outdated MVP copy replaced

| Location | Before | After |
|----------|--------|--------|
| **Paywall benefits** | "Keep your saved properties in one place; analysis coming soon" | "Deal and confidence scores on every property in your portfolio" |
| **Paywall benefits** | "Unlock scoring and insights as we add them" | "Deeper factor breakdown and score explanations (Pro)" and "Save and compare properties; scores are for informational use only" |
| **Paywall comment** | "MVP: no in-app score UI yet" | Removed; comment now states benefits reflect live scoring |

No in-app copy implies that scores or analysis are "coming soon."

## 3. One-line disclaimer under score surfaces

**Canonical text (single source of truth):**

> Scores are model outputs for informational use only and are not investment advice.

- **Constant:** `SCORE_SURFACE_DISCLAIMER` in `propertyAnalysisCopy.ts`; exported from `propertyAnalysis` index.
- **Property detail:** Rendered once directly under the two score cards (deal and confidence).
- **Portfolio list:** Rendered once below the "Your saved properties." subtitle, above the list of properties.

This line is used wherever deal/confidence scores are shown so that legal and App Store expectations are met.

## 4. No screen implies guaranteed returns

| Screen | Check | Result |
|--------|--------|--------|
| **Property detail** | Score disclaimer under cards; footer DISCLAIMER_COPY; band descriptions and transparency copy say "not a guarantee" | Compliant |
| **Portfolio list** | SCORE_SURFACE_DISCLAIMER under subtitle | Compliant |
| **Paywall** | Benefits say "informational use only"; no promise of returns; footer is subscription terms only | Compliant |
| **Home** | No score claims; CTA is "Add property" | Compliant |
| **Settings** | Disclaimer: "informational use only" and "does not provide investment, tax, or legal advice" | Compliant |
| **Import** | No return or performance promises | Compliant |

No screen states or implies that the app guarantees investment returns or future performance.

## 5. App Store screenshots

The app now supports **truthful** App Store screenshots that show:

- Portfolio list with deal and confidence badges on property rows.
- Property detail with deal score card, confidence score card, key metrics, and (optionally) factor breakdown or accordion.

Screenshot guidance is in `screenshot_update_plan.md`. No screenshot need imply "coming soon" for scores.

## 6. Summary

- **Scoring/confidence:** Visible on list and detail; explanations and factor breakdown (Pro) live.
- **Copy:** No "coming soon" for analysis or scores; paywall benefits updated.
- **Disclaimer:** One-line score-surface disclaimer in place on list and detail.
- **Guarantees:** No screen implies guaranteed returns.
- **App Store:** Screenshots can truthfully show live score/confidence UI.

PropFolio is **launch-ready** as a day-one live scoring/confidence app from a copy and disclaimer perspective.
