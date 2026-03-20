/**
 * Day-one property analysis pipeline.
 * Single entry point for property detail: rawDealScore, displayedDealScore (confidence-capped),
 * confidence, strengths, risks, assumptions, metrics, explanation copy.
 */

export { buildPropertyDetailAnalysis } from './buildPropertyDetailAnalysis';
export type {
  PropertyAnalysisInput,
  PropertyDetailAnalysis,
  MetricsSummary,
  StrengthItem,
  RiskItem,
  AssumptionItem,
  ExplanationCopy,
  DealBand,
  ConfidenceBand,
  DealScoreCategory,
  ConfidenceCategory,
} from './propertyAnalysisTypes';
export {
  dealBandLabel,
  dealBandDescription,
  confidenceBandLabel,
  confidenceBandDescription,
  dealFactorExplanation,
  confidenceFactorExplanation,
  capAppliedCopy,
  INSUFFICIENT_DATA_REASON,
  SCORE_SURFACE_DISCLAIMER,
  DISCLAIMER_COPY,
} from './propertyAnalysisCopy';
export {
  DEAL_FACTOR_LABELS,
  DEAL_FACTOR_ORDER,
  DEAL_BREAKDOWN_INTRO,
  WHAT_CONFIDENCE_MEANS,
  RECOMMENDED_ACTIONS,
  RECOMMENDED_ACTIONS_FOOTER,
  ACCORDION_HOW_CALCULATED,
  ACCORDION_ESTIMATED_FIELDS,
  ACCORDION_WHY_CAPPED,
  showRecommendedActionsForConfidence,
} from './transparencyCopy';
