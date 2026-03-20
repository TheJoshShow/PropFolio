/**
 * Human-readable explanations for property analysis.
 * Never implies guaranteed performance; estimated fields are marked.
 */

import type { DealBand, ConfidenceBand, DealScoreCategory, ConfidenceCategory } from './propertyAnalysisTypes';

// ----- Deal band labels and descriptions -----

export function dealBandLabel(band: DealBand): string {
  switch (band) {
    case 'exceptional': return 'Exceptional';
    case 'strong': return 'Strong';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
    case 'weak': return 'Weak';
    case 'poor': return 'Poor';
    case 'insufficientData': return 'Insufficient data';
    default: return 'Insufficient data';
  }
}

export function dealBandDescription(band: DealBand): string {
  switch (band) {
    case 'exceptional':
      return 'Key metrics are well above typical targets. This is not a guarantee of future performance.';
    case 'strong':
      return 'Key metrics are above typical targets. Verify assumptions and market conditions.';
    case 'good':
      return 'Key metrics meet or exceed typical targets. Review expenses and financing for accuracy.';
    case 'fair':
      return 'Key metrics are near typical targets. Small changes in rent or expenses can shift the outcome.';
    case 'weak':
      return 'Key metrics are below typical targets. Consider improving terms or verifying numbers.';
    case 'poor':
      return 'Key metrics are weak. Double-check inputs and consider whether the deal fits your criteria.';
    case 'insufficientData':
      return 'We need at least purchase price, rent, and financing to score this deal. Add or confirm those inputs.';
    default:
      return 'Add or confirm purchase price, rent, and financing to see a score.';
  }
}

// ----- Confidence band -----

export function confidenceBandLabel(band: ConfidenceBand): string {
  switch (band) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    case 'veryLow': return 'Very low';
    default: return 'Very low';
  }
}

export function confidenceBandDescription(band: ConfidenceBand): string {
  switch (band) {
    case 'high':
      return 'Analysis is based on relatively complete and reliable data. Still verify key numbers.';
    case 'medium':
      return 'Analysis is reasonably grounded; some inputs may be estimated or from limited sources.';
    case 'low':
      return 'Several inputs are missing or estimated. Treat the score as indicative, not definitive.';
    case 'veryLow':
      return 'Limited data; many assumptions. Add or confirm sources to improve confidence.';
    default:
      return 'Add or confirm data sources to improve confidence.';
  }
}

// ----- Deal factor explanations -----

export function dealFactorExplanation(category: DealScoreCategory, score: number, rawLabel?: string): string {
  const pct = Math.round(score);
  switch (category) {
    case 'cashFlowQuality':
      return rawLabel
        ? `Cash flow (${rawLabel}) contributes ${pct}% to the deal score. Positive, stable cash flow supports the score.`
        : `Cash flow quality contributes ${pct}% to the deal score.`;
    case 'cashOnCashReturn':
      return rawLabel
        ? `Cash-on-cash return (${rawLabel}) contributes ${pct}%. Higher return improves the score; this is not a guarantee.`
        : `Cash-on-cash return contributes ${pct}% to the deal score.`;
    case 'capRate':
      return rawLabel
        ? `Cap rate (${rawLabel}) contributes ${pct}%. Cap rate reflects estimated yield; verify with local comps.`
        : `Cap rate contributes ${pct}% to the deal score.`;
    case 'dscr':
      return rawLabel
        ? `DSCR (${rawLabel}) contributes ${pct}%. Lenders typically require DSCR ≥ 1.2–1.35.`
        : `DSCR contributes ${pct}% to the deal score.`;
    case 'rentEfficiency':
      return rawLabel
        ? `Rent efficiency (${rawLabel}) contributes ${pct}%. Rent relative to price and expenses affects the score.`
        : `Rent efficiency contributes ${pct}% to the deal score.`;
    case 'downsideResilience':
      return rawLabel
        ? `Downside resilience (${rawLabel}) contributes ${pct}%. How well the deal holds up if rent or occupancy drops.`
        : `Downside resilience contributes ${pct}% to the deal score.`;
    case 'upsidePotential':
      return rawLabel
        ? `Upside potential (${rawLabel}) contributes ${pct}%. Not a guarantee of future value or rent growth.`
        : `Upside potential contributes ${pct}% to the deal score.`;
    case 'penalties':
      return rawLabel
        ? `Penalties (${rawLabel}) reduce the score. Negative cash flow or very low DSCR are key risks.`
        : `Penalties reduce the deal score when risks are present.`;
    default:
      return `This factor contributes ${pct}% to the deal score.`;
  }
}

// ----- Confidence factor explanations -----

export function confidenceFactorExplanation(category: ConfidenceCategory, score: number): string {
  const pct = Math.round(score);
  switch (category) {
    case 'sourceCompleteness':
      return `Source completeness: ${pct}%. How many key data points (price, rent, expenses, financing) we have.`;
    case 'sourceReliability':
      return `Source reliability: ${pct}%. Whether data comes from listings, records, or estimates.`;
    case 'freshness':
      return `Freshness: ${pct}%. How recent the data is. Older data may not reflect current market.`;
    case 'crossSourceAgreement':
      return `Cross-source agreement: ${pct}%. When we have multiple sources, whether they align.`;
    case 'assumptionBurden':
      return `Assumption burden: ${pct}%. Lower is better. Fewer defaults and estimates improve confidence.`;
    case 'outlierChecks':
      return `Outlier checks: ${pct}%. Whether values fall in plausible ranges for the market.`;
    default:
      return `This factor contributes ${pct}% to confidence.`;
  }
}

// ----- Cap applied message -----

export function capAppliedCopy(rawScore: number, displayedScore: number): string {
  return `Score is shown as ${displayedScore} (raw ${Math.round(rawScore)}) because confidence is low. Improve data quality to unlock the full score.`;
}

// ----- Insufficient data -----

export const INSUFFICIENT_DATA_REASON =
  'We need at least purchase price, rent, and financing (or key metrics) to score this deal. Add or confirm those inputs.';

// ----- Disclaimers (for UI) -----

/** One-line disclaimer under score surfaces (list and detail). App Store / legal. */
export const SCORE_SURFACE_DISCLAIMER =
  'Scores are model outputs for informational use only and are not investment advice.';

/** Footer / general analysis disclaimer. */
export const DISCLAIMER_COPY =
  'This analysis is for informational use only and does not guarantee future performance. Verify all numbers and consult professionals.';
