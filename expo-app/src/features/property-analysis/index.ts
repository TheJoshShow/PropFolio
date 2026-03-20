/**
 * Property detail analysis: score, confidence, metrics, flags, assumptions.
 * Single entry point for the property detail screen.
 */

export { runPropertyDetailAnalysis } from './property_detail_analysis_service';
export type {
  PropertyDetailAnalysisInput,
  PropertyDetailAnalysisResult,
  DealScoreBreakdown,
  ConfidenceScoreBreakdown,
  KeyMetricsSummary,
  RiskFlag,
  StrengthFlag,
  AssumptionItem,
} from './property_detail_types';
