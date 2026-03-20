/**
 * Confidence meter inputs, result, band, factors.
 * Matches PropFolio ConfidenceMeterInputs, ConfidenceMeterResult, ConfidenceMeterBand, ConfidenceMeterFactor.
 */

export type ConfidenceMeterBand = 'high' | 'medium' | 'low' | 'veryLow';

export type ConfidenceMeterFactor =
  | 'propertyDataCompleteness'
  | 'rentEstimateConfidence'
  | 'expenseAssumptionsConfidence'
  | 'renovationBudgetCertainty'
  | 'financingAssumptionsStability'
  | 'marketDataReliabilityFreshness'
  | 'manualOverrideImpact';

export interface ConfidenceMeterInputs {
  propertyDataCompleteness?: number | null;
  rentEstimateConfidence?: number | null;
  expenseAssumptionsConfidence?: number | null;
  renovationBudgetCertainty?: number | null;
  financingAssumptionsStability?: number | null;
  marketDataReliabilityFreshness?: number | null;
  manualOverrideCount?: number | null;
}

export interface ConfidenceMeterExplanation {
  supportingFactors: string[];
  limitingFactors: string[];
  summary: string;
}

export interface ConfidenceMeterResult {
  score: number;
  band: ConfidenceMeterBand;
  explanation: ConfidenceMeterExplanation;
  recommendedActions: string[];
}
