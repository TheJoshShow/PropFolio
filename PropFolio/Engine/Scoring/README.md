# Deal Scoring Engine

Score 0–100 to help buyers feel confident they will make money. Uses sub-scores, weights, and guardrails per `docs/DEAL-SCORING-SPEC.md`.

## Inputs

- **DealScoreInputs:** cap rate, monthly/annual cash flow, cash on cash, DSCR, expense ratio, breakeven occupancy, renovation burden ratio, purchase discount (optional), rent coverage (optional), data confidence, market tailwinds (optional), stress DSCR (optional).
- **Required for a valid total score:** DSCR + data confidence + (cap rate OR monthly cash flow OR annual cash flow). Otherwise band = `.insufficientData` and totalScore = nil.

## Outputs

- **DealScoreResult:** totalScore (0–100 or nil), band (exceptional/strong/good/fair/weak/poor/insufficientData), components (sub-scores with raw value, weight, contribution), wasCappedByConfidence, explanationSummary.

## Guardrails

- If data confidence sub-score < 50, overall score is **capped at 60** so incomplete or low-trust data cannot show Strong or Exceptional.

## Building inputs

- **DealScoreInputs.from(underwriting:totalCashToClose:renovationTotal:purchasePrice:dataConfidence:...)** builds from underwriting outputs and optional simulation/confidence/tailwinds/stress/discount.
- **DealScoreInputs.from(simulationResult:purchasePrice:dataConfidence:...)** builds from SimulationResult.

## Explanation text (UI)

- **DealScoreExplanations:** insufficientDataReason(), summary(), factorName(), factorExplanation(), bandDescription().

## Deal archetypes

- **DealArchetype:** Risky (0–44), Stable (45–74), Strong (75–89), Exceptional (90–100), Unknown (insufficient data).
- **From score/band:** `DealArchetype.from(score:)` or `DealArchetype.from(band:)`.
- **Copy per archetype:** scoreRange, emotionalLabel, practicalExplanation, expectedInvestorProfile, badgeCopy, calloutText. Simple, confidence-building, not misleading.
