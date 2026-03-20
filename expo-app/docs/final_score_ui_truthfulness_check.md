# Final Score UI Truthfulness Check

Verification that every score-related surface is truthful, compliant, and ready for store/marketing.

## 1. Deal score visibility

| Where | What user sees | Truthful? |
|-------|----------------|-----------|
| Portfolio list row | Badge: "Deal X" or "Deal —" (X = 0–100) | Yes: real computed score or — when insufficient data |
| Property detail hero | Badge: "Deal X/100" | Yes: same as above |
| Property detail score card | Large number (or —) + band label (Exceptional / Strong / Good / Fair / Weak / Poor / Insufficient data) | Yes: from buildPropertyDetailAnalysis |
| Property detail cap note | Shown only when confidence < 50 and raw > 60; explains cap at 60 | Yes: matches logic |
| Factor breakdown (Pro) | Per-factor explanation from explanationCopy | Yes: from pipeline |

No placeholder scores; no "coming soon" for deal score.

## 2. Confidence score visibility

| Where | What user sees | Truthful? |
|-------|----------------|-----------|
| Portfolio list row | Badge: "High / Medium / Low / Very low conf" | Yes: from analysis confidenceBand |
| Property detail hero | Same band in badge | Yes |
| Property detail score card | 0–100 number + band label | Yes: confidenceScore and confidenceBand |
| Confidence explained | "What confidence means" + recommended next steps when band is medium/low/veryLow | Yes: copy and logic aligned |

No placeholder confidence; no "coming soon."

## 3. Disclaimer placement

| Surface | Disclaimer text | Placement |
|---------|-----------------|-----------|
| Portfolio list | SCORE_SURFACE_DISCLAIMER | One line below "Your saved properties." above the list |
| Property detail | SCORE_SURFACE_DISCLAIMER | One line below the two score cards |
| Property detail footer | DISCLAIMER_COPY | Bottom of screen |

Exact one-line under score surfaces: *"Scores are model outputs for informational use only and are not investment advice."*

## 4. No guaranteed returns

- **Deal/confidence copy:** Band descriptions and transparency copy state "not a guarantee," "informational only," "verify locally."
- **Paywall:** Benefits include "scores are for informational use only"; no return promises.
- **Settings:** "Does not provide investment, tax, or legal advice."
- **No screen** uses "guarantee," "will earn," "will perform," or similar.

## 5. App Store screenshot truthfulness

- Screenshots **may** show: portfolio list with deal/confidence badges; property detail with score cards, metrics, factor breakdown.
- Screenshots **must not** imply: guaranteed returns, future performance, or that scores are "coming soon."
- Current UI supports **truthful** screenshots of live scoring and confidence.

## Sign-off

- [x] Deal score visible and truthful on list and detail.
- [x] Confidence score visible and truthful on list and detail.
- [x] One-line disclaimer under score surfaces (list + detail).
- [x] No screen implies guaranteed returns.
- [x] App Store screenshots can truthfully show score/confidence screens.

Date: ___________  
