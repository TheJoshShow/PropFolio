import { SCORING_DEFAULTS } from '../defaults/scoringDefaults';
import type {
  CalculatedMetric,
  FinancingAssumptions,
  NormalizedPropertyInputs,
  OperatingAssumptions,
  ScoreFactor,
} from '../domain/types';
import { computePrimaryMetrics } from '../calculate/primaryMetrics';
import { isFinitePositive, safeDivide } from '../normalize/guards';

function metricMap(metrics: CalculatedMetric[]): Map<string, CalculatedMetric> {
  return new Map(metrics.map((m) => [m.key, m]));
}

function scaleLinear(value: number, lo: number, hi: number): number {
  if (hi === lo) {
    return 50;
  }
  const t = (value - lo) / (hi - lo);
  return Math.round(Math.max(0, Math.min(100, t * 100)));
}

/**
 * Secondary “lens” scores for UI — not used to fabricate NOI/cap; orthogonal narratives.
 * Tune thresholds in SCORING_DEFAULTS or here with named constants.
 */
const CAP_RATE_TARGET = 0.07;
const CAP_RATE_STRETCH = 0.12;
const DSCR_STRONG = 1.25;
const DSCR_WEAK = 1.0;

export function buildScoreFactors(
  inputs: NormalizedPropertyInputs,
  financing: FinancingAssumptions,
  operating: OperatingAssumptions,
  metrics: CalculatedMetric[],
  confidenceScore: number,
): ScoreFactor[] {
  const m = metricMap(metrics);
  const cap = m.get('cap_rate')?.value;
  const dscr = m.get('dscr')?.value;
  const coc = m.get('cash_on_cash')?.value;
  const rent = inputs.monthlyRentGross;
  const sqft = inputs.sqft;

  const upsideScore =
    typeof cap === 'number' && Number.isFinite(cap)
      ? scaleLinear(cap, CAP_RATE_TARGET * 0.5, CAP_RATE_STRETCH)
      : 40;

  const dscrSafe =
    typeof dscr === 'number' && Number.isFinite(dscr)
      ? scaleLinear(dscr, DSCR_WEAK, DSCR_STRONG)
      : 45;
  const cocSafe =
    typeof coc === 'number' && Number.isFinite(coc) ? scaleLinear(coc, -0.05, 0.15) : 45;
  const downsideScore = Math.round((dscrSafe + cocSafe) / 2);

  /** `monthlyRentGross` is total across units — do not multiply by unitCount. */
  const rentPerSqft =
    isFinitePositive(rent) && isFinitePositive(sqft) ? safeDivide(rent, sqft) : null;
  const bench = SCORING_DEFAULTS.RENT_EFFICIENCY_BENCHMARK_PER_SQFT_MONTHLY;
  const rentEffScore =
    rentPerSqft != null ? scaleLinear(rentPerSqft, bench * 0.4, bench * 1.6) : 50;

  const renoSensitivity = computeRenovationSensitivityScore(inputs, financing, operating);

  const missingPenaltyFactor = Math.round((confidenceScore / SCORING_DEFAULTS.CONFIDENCE_MAX) * 100);

  return [
    {
      id: 'upside_potential',
      kind: 'upside_potential',
      label: 'Upside potential',
      score: upsideScore,
      weight: SCORING_DEFAULTS.FACTOR_WEIGHT_UPSIDE,
      narrative:
        'Based on cap rate vs underwriting targets. Replace targets with market percentiles when you have data.',
    },
    {
      id: 'downside_resilience',
      kind: 'downside_resilience',
      label: 'Downside resilience',
      score: downsideScore,
      weight: SCORING_DEFAULTS.FACTOR_WEIGHT_DOWNSIDE,
      narrative: 'Blends DSCR and cash-on-cash cushion — debt stress proxy.',
    },
    {
      id: 'rent_efficiency',
      kind: 'rent_efficiency',
      label: 'Rent efficiency',
      score: rentEffScore,
      weight: SCORING_DEFAULTS.FACTOR_WEIGHT_RENT_EFFICIENCY,
      narrative: 'Rent per sq ft vs internal benchmark — swap for submarket comps later.',
    },
    {
      id: 'renovation_sensitivity',
      kind: 'renovation_sensitivity',
      label: 'Renovation sensitivity',
      score: renoSensitivity.score,
      weight: SCORING_DEFAULTS.FACTOR_WEIGHT_RENOVATION_SENSITIVITY,
      narrative: renoSensitivity.narrative,
    },
    {
      id: 'data_completeness',
      kind: 'missing_data_penalty',
      label: 'Data completeness',
      score: missingPenaltyFactor,
      weight: 1,
      narrative: 'Mirrors confidence deductions — higher is more complete inputs.',
    },
  ];
}

/**
 * Discrete ±20% rehab shock on cash-on-cash; score reflects stability (high = less sensitive).
 */
function computeRenovationSensitivityScore(
  inputs: NormalizedPropertyInputs,
  financing: FinancingAssumptions,
  operating: OperatingAssumptions,
): { score: number; narrative: string } {
  const base = inputs.rehabBudget ?? 0;
  if (base <= 0 && !isFinitePositive(inputs.purchasePrice)) {
    return {
      score: 55,
      narrative: 'No rehab baseline — sensitivity neutral.',
    };
  }

  const run = (rehab: number) => {
    const m = computePrimaryMetrics(
      { ...inputs, rehabBudget: rehab },
      financing,
      operating,
    );
    const coc = m.find((x) => x.key === 'cash_on_cash')?.value;
    return coc;
  };

  const lo = run(Math.max(0, base * 0.8));
  const mid = run(base);
  const hi = run(base * 1.2);
  if (mid == null || !Number.isFinite(mid)) {
    return { score: 50, narrative: 'Insufficient data for rehab stress test.' };
  }
  const spread = Math.max(
    Math.abs((lo ?? mid) - mid),
    Math.abs((hi ?? mid) - mid),
  );
  const stability = 1 - Math.min(1, spread / Math.max(0.02, Math.abs(mid)));
  return {
    score: Math.round(stability * 100),
    narrative: 'Sensitivity of cash-on-cash to ±20% rehab budget (holding price/rent fixed).',
  };
}
