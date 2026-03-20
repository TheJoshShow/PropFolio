/**
 * Transparency copy for Property Detail: deal breakdown, confidence, accordion.
 * Compliant: model output, not guarantee; informational only; verify locally.
 */

import type { DealScoreCategory } from './propertyAnalysisTypes';
import type { ConfidenceBand } from './propertyAnalysisTypes';

/** Display labels for deal score factors (expandable breakdown). */
export const DEAL_FACTOR_LABELS: Record<DealScoreCategory, string> = {
  cashFlowQuality: 'Cash flow quality',
  cashOnCashReturn: 'Cash-on-cash return',
  capRate: 'Cap rate',
  dscr: 'DSCR',
  rentEfficiency: 'Rent efficiency',
  downsideResilience: 'Downside resilience',
  upsidePotential: 'Upside potential',
  penalties: 'Penalties',
};

/** Order for factor breakdown list. */
export const DEAL_FACTOR_ORDER: DealScoreCategory[] = [
  'cashFlowQuality',
  'cashOnCashReturn',
  'capRate',
  'dscr',
  'rentEfficiency',
  'downsideResilience',
  'upsidePotential',
  'penalties',
];

/** Intro line above factor breakdown. */
export const DEAL_BREAKDOWN_INTRO =
  'The deal score is a weighted model output based on the factors below. It is not a guarantee of future performance. Verify important assumptions locally.';

/** What confidence means (full paragraph). */
export const WHAT_CONFIDENCE_MEANS =
  'Confidence reflects how grounded this analysis is in the data we have. High means we have relatively complete, reliable inputs; low means many inputs are missing or estimated. Confidence does not predict whether a deal will succeed—it only indicates how much you can rely on the numbers shown. Verify important assumptions locally (e.g. rent, expenses, financing) before making decisions.';

/** Recommended next steps when confidence is moderate or low. */
export const RECOMMENDED_ACTIONS: string[] = [
  'Add or confirm rent — Use a listing, appraisal, or local rent comp to improve the analysis.',
  'Add or confirm expenses — Taxes, insurance, and maintenance estimates improve confidence.',
  'Confirm financing terms — Rate and term affect cash flow and DSCR; lock or verify with your lender.',
  'Verify numbers locally — This analysis is for informational use only; confirm key inputs with local sources.',
  'Review assumptions — Check the Assumptions section and update any default values that don’t match your situation.',
];

/** Footer under recommended actions. */
export const RECOMMENDED_ACTIONS_FOOTER =
  'These steps improve confidence in the model output; they do not guarantee any outcome.';

/** Accordion: How the score is calculated. */
export const ACCORDION_HOW_CALCULATED =
  'The deal score is a weighted combination of several factors: cash flow quality, cash-on-cash return, cap rate, DSCR, rent efficiency, downside resilience, upside potential, and penalties (e.g. negative cash flow or very low DSCR). Each factor is scored 0–100 and combined using fixed weights. The result is model output for informational use only and is not a guarantee of future performance. When confidence is low, the displayed score may be capped (e.g. at 59, 69, or 79) so we don’t show a high number when inputs are weak.';

/** Accordion: Which fields are estimated. */
export const ACCORDION_ESTIMATED_FIELDS =
  'Fields marked (estimated) or (default) in the Assumptions section were not provided by you and were filled using our defaults or inferred from other inputs (e.g. operating expenses as a percentage of income when not provided). Estimated fields reduce confidence. Verify important assumptions locally—especially rent, expenses, and financing—before relying on the analysis.';

/** Accordion: Why the score may be capped. */
export const ACCORDION_WHY_CAPPED =
  'When confidence is low, we cap the displayed deal score (e.g. at 59, 69, or 79 depending on confidence tier) even if the raw score is higher. This avoids showing a strong score when the underlying data is thin or mostly estimated. Improve data quality (add rent, confirm expenses, confirm financing) to unlock the full score. The cap is for transparency only; it does not guarantee that an uncapped score would be accurate.';

export function showRecommendedActionsForConfidence(band: ConfidenceBand): boolean {
  return band === 'medium' || band === 'low' || band === 'veryLow';
}
