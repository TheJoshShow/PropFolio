import { SCORING_DEFAULTS } from '../defaults/scoringDefaults';
import type { ConfidenceResult, NormalizedPropertyInputs } from '../domain/types';
import { isFinitePositive } from '../normalize/guards';

/**
 * Confidence is a 0–max score with explicit deductions for missing drivers.
 * Adjust policy here; keep calculators agnostic of confidence.
 */
export function computeConfidence(inputs: NormalizedPropertyInputs): ConfidenceResult {
  const max = SCORING_DEFAULTS.CONFIDENCE_MAX;
  let score: number = SCORING_DEFAULTS.CONFIDENCE_BASE;
  const penalties: ConfidenceResult['penalties'] = [];

  const apply = (code: string, label: string, deduction: number, condition: boolean) => {
    if (condition) {
      penalties.push({ code, label, deduction });
      score -= deduction;
    }
  };

  apply(
    'purchase',
    'Purchase price unknown',
    SCORING_DEFAULTS.PENALTY_MISSING_PURCHASE_PRICE,
    !isFinitePositive(inputs.purchasePrice),
  );
  apply(
    'rent',
    'Rent unknown',
    SCORING_DEFAULTS.PENALTY_MISSING_RENT,
    !isFinitePositive(inputs.monthlyRentGross),
  );
  apply(
    'tax',
    'Property tax unknown',
    SCORING_DEFAULTS.PENALTY_MISSING_PROPERTY_TAX,
    inputs.annualPropertyTax == null,
  );
  apply(
    'insurance',
    'Insurance unknown',
    SCORING_DEFAULTS.PENALTY_MISSING_INSURANCE,
    inputs.annualInsurance == null,
  );
  apply(
    'sqft',
    'Square footage unknown',
    SCORING_DEFAULTS.PENALTY_MISSING_SQFT,
    !isFinitePositive(inputs.sqft),
  );

  const rehab = inputs.rehabBudget ?? 0;
  apply(
    'arv',
    'ARV unknown while rehab budget set',
    SCORING_DEFAULTS.PENALTY_MISSING_ARV_WHEN_REHAB_POSITIVE,
    rehab > 0 && !isFinitePositive(inputs.arv),
  );

  score = Math.max(0, Math.min(max, score));

  return {
    score,
    max,
    base: SCORING_DEFAULTS.CONFIDENCE_BASE,
    penalties,
  };
}
