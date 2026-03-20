/**
 * Property detail analysis: input, result, and breakdown types.
 * Contract for the property detail screen and tests.
 * See docs/score_breakdown_contract.md.
 */

import type { DealScoreBand, DealScoreComponent } from '../../lib/scoring/types';
import type { ConfidenceMeterBand, ConfidenceMeterExplanation } from '../../lib/confidence/types';

// ----- Input -----

export interface PropertyDetailAnalysisInput {
  /** Property: direct from import/DB or user */
  listPrice: number | null;
  rent: number | null;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  unitCount?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  /** Financing overrides; null = use defaults */
  downPaymentPercent?: number | null;
  interestRateAnnual?: number | null;
  amortizationTermYears?: number | null;
  closingCosts?: number | null;
  /** Expense overrides */
  vacancyRatePercent?: number | null;
  operatingExpensesAnnual?: number | null;
  /** Count of user-overridden fields for confidence */
  manualOverrideCount?: number | null;
}

// ----- Result -----

export interface PropertyDetailAnalysisResult {
  dealScore: DealScoreBreakdown;
  confidence: ConfidenceScoreBreakdown;
  keyMetrics: KeyMetricsSummary;
  riskFlags: RiskFlag[];
  strengthFlags: StrengthFlag[];
  assumptions: AssumptionItem[];
}

// ----- Deal score breakdown (aligned with DealScoreResult) -----

export interface DealScoreBreakdown {
  totalScore: number | null;
  band: DealScoreBand;
  wasCappedByConfidence: boolean;
  explanationSummary: string;
  components: DealScoreComponent[];
}

// ----- Confidence breakdown (aligned with ConfidenceMeterResult) -----

export interface ConfidenceScoreBreakdown {
  score: number;
  band: ConfidenceMeterBand;
  explanation: ConfidenceMeterExplanation;
  recommendedActions: string[];
}

// ----- Key metrics (subset of underwriting outputs) -----

export interface KeyMetricsSummary {
  capRate: number | null;
  monthlyCashFlow: number | null;
  annualCashFlow: number | null;
  dscr: number | null;
  cashOnCashReturn: number | null;
  expenseRatio: number | null;
  breakevenOccupancy: number | null;
  noi: number | null;
  totalCashToClose: number | null;
}

// ----- Flags and assumptions -----

export interface RiskFlag {
  id: string;
  label: string;
  description?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StrengthFlag {
  id: string;
  label: string;
  description?: string;
}

export interface AssumptionItem {
  id: string;
  label: string;
  value: string;
  source: 'default' | 'user' | 'inferred';
}
