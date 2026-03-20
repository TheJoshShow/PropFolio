/**
 * Deal scoring inputs, result, bands, and factors.
 * Matches PropFolio DealScoreInputs, DealScoreResult, DealScoreBand, DealScoreFactor.
 */

export type DealScoreBand =
  | 'exceptional'
  | 'strong'
  | 'good'
  | 'fair'
  | 'weak'
  | 'poor'
  | 'insufficientData';

export type DealScoreFactor =
  | 'capRate'
  | 'monthlyCashFlow'
  | 'annualCashFlow'
  | 'cashOnCashReturn'
  | 'dscr'
  | 'expenseRatio'
  | 'vacancySensitivity'
  | 'renovationBurden'
  | 'purchaseDiscount'
  | 'rentCoverageStrength'
  | 'dataConfidence'
  | 'marketTailwinds'
  | 'downsideResilience';

export interface DealScoreInputs {
  capRate?: number | null;
  monthlyCashFlow?: number | null;
  annualCashFlow?: number | null;
  cashOnCashReturn?: number | null;
  dscr?: number | null;
  expenseRatio?: number | null;
  breakevenOccupancy?: number | null;
  renovationBurdenRatio?: number | null;
  purchaseDiscountVsValue?: number | null;
  rentCoverageStrength?: number | null;
  dataConfidence?: number | null;
  marketTailwinds?: number | null;
  stressDSCR?: number | null;
}

export interface DealScoreComponent {
  id: DealScoreFactor;
  rawValue: string | null;
  subScore: number;
  weight: number;
  contribution: number;
}

export interface DealScoreResult {
  totalScore: number | null;
  band: DealScoreBand;
  components: DealScoreComponent[];
  wasCappedByConfidence: boolean;
  explanationSummary: string;
}

export function bandFromScore(score: number): DealScoreBand {
  if (score >= 90) return 'exceptional';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 45) return 'fair';
  if (score >= 30) return 'weak';
  return 'poor';
}
