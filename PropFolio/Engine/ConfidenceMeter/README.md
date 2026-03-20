# Confidence Meter

Measures **how confident PropFolio is that the analysis is grounded and dependable**. Separate from the deal score (which measures deal quality).

## Inputs (0–1 unless noted)

- **propertyDataCompleteness** — Completeness of imported property data
- **rentEstimateConfidence** — Confidence in rent estimates
- **expenseAssumptionsConfidence** — Confidence in expense assumptions
- **renovationBudgetCertainty** — Certainty around renovation budget
- **financingAssumptionsStability** — Stability of financing assumptions
- **marketDataReliabilityFreshness** — Reliability and freshness of market data
- **manualOverrideCount** — Number of user overrides (converted to 0–1: more overrides → lower)

Missing inputs are excluded from the weighted average; weights renormalize over present factors.

## Outputs

- **score** — 0–100
- **band** — ConfidenceMeterBand: high (75–100), medium (50–74), low (25–49), veryLow (0–24)
- **explanation** — supportingFactors, limitingFactors, summary
- **recommendedActions** — Up to 5 next steps to improve confidence

## Weights

- Property data 18%, Rent 18%, Expenses 15%, Renovation 12%, Financing 12%, Market 15%, Override impact 10%.

## UI integration

- Map **ConfidenceMeterBand** to **ConfidenceGrade** (high/medium/low/veryLow) where the existing ConfidenceMeterTeaser expects a grade.
- Copy: use **ConfidenceMeterCopy** for band labels, descriptions, factor text, and actions. See **docs/CONFIDENCE-METER-UX-COPY-GUIDELINES.md**.
