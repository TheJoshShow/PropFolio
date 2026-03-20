/**
 * Day-one property analysis: input and output types.
 * All scores 0–100; displayed deal score is confidence-capped.
 * Estimated and missing fields are marked; no guarantee of performance.
 */

// ----- Deal score categories (0–100 each, weighted) -----

export type DealScoreCategory =
  | 'cashFlowQuality'
  | 'cashOnCashReturn'
  | 'capRate'
  | 'dscr'
  | 'rentEfficiency'
  | 'downsideResilience'
  | 'upsidePotential'
  | 'penalties';

// ----- Confidence score categories (0–100 each, weighted) -----

export type ConfidenceCategory =
  | 'sourceCompleteness'
  | 'sourceReliability'
  | 'freshness'
  | 'crossSourceAgreement'
  | 'assumptionBurden'
  | 'outlierChecks';

// ----- Bands (day-one UI bands) -----

export type DealBand =
  | 'exceptional'
  | 'strong'
  | 'good'
  | 'fair'
  | 'weak'
  | 'poor'
  | 'insufficientData';

export type ConfidenceBand = 'high' | 'medium' | 'low' | 'veryLow';

// ----- Input: property/financial and confidence signals -----

export interface PropertyAnalysisInput {
  // Property / income (amounts in USD; rates as decimals)
  purchasePrice?: number | null;
  monthlyRent?: number | null;
  grossScheduledRentAnnual?: number | null;
  operatingExpensesAnnual?: number | null;
  vacancyPercent?: number | null;
  unitCount?: number | null;
  squareFeet?: number | null;
  // Financing
  loanAmount?: number | null;
  annualDebtService?: number | null;
  interestRateAnnual?: number | null;
  termYears?: number | null;
  downPaymentPercent?: number | null;
  closingCosts?: number | null;
  // Optional pre-computed metrics (if provided, used instead of deriving)
  capRate?: number | null;
  dscr?: number | null;
  monthlyCashFlow?: number | null;
  annualCashFlow?: number | null;
  cashOnCashReturn?: number | null;
  expenseRatio?: number | null;
  breakevenOccupancy?: number | null;
  noi?: number | null;
  // Confidence signals (0–1 or count; optional)
  sourceCompleteness?: number | null;
  sourceReliability?: number | null;
  freshness?: number | null;
  crossSourceAgreement?: number | null;
  assumptionBurden?: number | null;
  outlierChecks?: number | null;
  /** Count of fields that are estimated/default (increases assumption burden) */
  estimatedFieldCount?: number | null;
}

// ----- Internal metrics (derived or passed through) -----

export interface MetricsSummary {
  capRate: number | null;
  monthlyCashFlow: number | null;
  annualCashFlow: number | null;
  cashOnCashReturn: number | null;
  dscr: number | null;
  expenseRatio: number | null;
  breakevenOccupancy: number | null;
  noi: number | null;
  totalCashToClose: number | null;
  /** True if value was estimated from defaults */
  isEstimated?: Partial<Record<keyof MetricsSummary, boolean>>;
}

// ----- Output: strengths, risks, assumptions -----

export interface StrengthItem {
  id: string;
  label: string;
  description: string;
  category: DealScoreCategory | 'confidence';
}

export interface RiskItem {
  id: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category?: DealScoreCategory | ConfidenceCategory;
}

export interface AssumptionItem {
  id: string;
  label: string;
  value: string;
  source: 'default' | 'user' | 'inferred' | 'estimated';
}

// ----- Explanation copy -----

export interface ExplanationCopy {
  dealSummary: string;
  confidenceSummary: string;
  capApplied?: string;
  factorExplanations: Record<string, string>;
}

// ----- Full pipeline result -----

export interface PropertyDetailAnalysis {
  rawDealScore: number | null;
  displayedDealScore: number | null;
  dealBand: DealBand;
  confidenceScore: number;
  confidenceBand: ConfidenceBand;
  strengths: StrengthItem[];
  risks: RiskItem[];
  assumptions: AssumptionItem[];
  metricsSummary: MetricsSummary;
  explanationCopy: ExplanationCopy;
  /** True when displayed score was reduced by confidence cap */
  wasCappedByConfidence: boolean;
}
