# Formula Spec Implementation vs Current Engine

This document records where the implemented engine follows the requested formula spec exactly, and where the current engine was preserved or approximated due to missing inputs or stronger equivalence.

## A. Deal score — implemented per spec

- **Weights:** cashFlowQuality 25, cashOnCashReturn 20, capRate 15, dscr 10, rentEfficiency 10, downsideResilience 10, upsidePotential 5, penalties 5 (normalized to sum 1).
- **scaleLinear(value, minValue, maxValue) => 0..100:** Implemented; null-safe; all category scores clamped 0..100.
- **1. cashFlowQualityScore:** monthlyNetCashFlow; ≤-500 => 0, ≥750 => 100, else linear. Uses `metrics.monthlyCashFlow` (monthly).
- **2. cashOnCashScore:** cashOnCashReturnPct; ≤0 => 0, ≥12 => 100, else 0..12. Input: `metrics.cashOnCashReturn * 100` (we store decimal).
- **3. capRateScore:** capRatePct; ≤3 => 0, ≥9 => 100, else 3..9. Input: `metrics.capRate * 100`.
- **4. dscrScore:** dscr; ≤1.0 => 0, ≥1.5 => 100, else linear 1.0..1.5.
- **5. rentEfficiencyScore:** grossRentYieldPct; ≤5 => 0, ≥12 => 100, else 5..12. Input: (GSR/price)*100.
- **6. downsideResilienceScore:** Built from vacancy stress (40%), maintenance shock (35%), debt stress (25%). **Approximation:** vacancy stress from breakeven occupancy (lower = better); debt stress from DSCR (higher = better); maintenance shock has no input — we use expense-ratio-based proxy or 50 when unknown.
- **7. upsidePotentialScore:** Spec uses rentUpsidePct, renovationUpsidePct, neighborhoodMomentumScore. **Preserved:** we have no rent/renovation/neighborhood inputs; use cap-rate-based upside (0..100 from cap rate) as conservative proxy, capped at 100.
- **8. penaltyPoints:** Subtract for: negative cash flow, DSCR < 1.1, >3 major estimated fields, unrealistic outliers, very low confidence. Penalty 0..100; converted to weighted penalty effect in final score. **Implemented:** negative CF, DSCR < 1.1, estimated field count > 3, low confidence; outlier check uses existing 0–1 signal when provided.
- **Raw deal score:** Weighted sum of positive categories minus weighted penalty contribution; clamped 0..100.

## B. Confidence score — implemented per spec

- **Weights:** sourceCompleteness 35, sourceReliability 20, freshness 15, crossSourceAgreement 15, assumptionBurden 10, outlierSanity 5 (key remains `outlierChecks` in code).
- **sourceCompletenessScore:** Weighted known-field coverage. **Approximation:** we use provided 0–1 or derive from count of present required fields (price, rent, loan, expenses) / total.
- **sourceReliabilityScore:** By source quality (direct > user > API > heuristic > missing). **Approximation:** we use provided 0–1 input scaled to 0..100.
- **freshnessScore:** Tiered: 0–7 days 100, 8–30 85, 31–90 65, 91–180 45, >180 25, unknown 40. **Implementation:** when `dataAgeDays` is provided we use tiers; else we use existing `freshness` 0–1 * 100 (or map to 40 when null).
- **crossSourceAgreementScore:** Variance-based when multiple estimates; we use provided 0–1 scaled when no multi-source data.
- **assumptionBurdenScore:** 100 minus deduction for estimated/defaulted fields. Implemented.
- **outlierSanityScore:** Penalty for implausible values. We use provided `outlierChecks` 0–1 scaled.

## C. Display cap — implemented per spec

- confidenceScore < 35 => displayedDealScore max **59**
- confidenceScore < 50 => displayedDealScore max **69**
- confidenceScore < 65 => displayedDealScore max **79**
- else => no cap  
displayedDealScore = min(rawDealScore, cap).

## D. Bands — implemented per spec

- **Deal:** 85–100 Exceptional, 70–84 Strong, 55–69 Promising, 40–54 Watchlist, 0–39 High Risk. Plus insufficientData when no score.
- **Confidence:** 80–100 High, 60–79 Good, 40–59 Moderate, 0–39 Low.

## E. Output — implemented

- rawDealScore, displayedDealScore, rawDealBand, displayedDealBand, confidenceScore, confidenceBand, topStrengths (strengths), topRisks (risks), estimatedFields (from assumptions where source estimated/default), recommendedActions (when confidence moderate/low), explanationSummary, metricsSummary. Plus existing assumptions, explanationCopy, wasCappedByConfidence. **Backward compat:** `dealBand` kept and set to displayedDealBand.

## F. Copy rules

- Forbidden: guaranteed, safe investment, best deal, should buy. **Audited:** not used in band descriptions or explanation copy.
- Preferred: model output, candidate, worth reviewing, verify locally, informational use only. **Used** in disclaimers and transparency copy.

## Differences summary

| Area | Spec | Implemented | Note |
|------|------|-------------|------|
| Downside resilience | 3 sub-scores (vacancy, maintenance, debt) | Vacancy + debt from data; maintenance proxy or 50 | No maintenance/renovation input |
| Upside potential | Rent/renovation/neighborhood | Cap-rate-based proxy | No rent upside or neighborhood input |
| Freshness | Days-based tiers | Tiers when dataAgeDays provided; else 0–1 input | Optional dataAgeDays on input |
| Source completeness | Weighted field coverage | 0–1 or derived from required fields | Same idea |
| estimatedFields | List of field names | Assumption ids with source estimated/default | Slightly different shape |
