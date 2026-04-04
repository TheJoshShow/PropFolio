/**
 * PropFolio scoring engine — pure TypeScript; no React. Import from `@/scoring`.
 */

export type {
  CalculatedMetric,
  ConfidencePenalty,
  ConfidenceResult,
  FinancingAssumptions,
  MetricAvailability,
  NormalizedPropertyInputs,
  OperatingAssumptions,
  PrimaryMetricKey,
  RawProviderEnvelope,
  ScenarioPatch,
  ScoreBreakdown,
  ScoreFactor,
  ScoreFactorKind,
  ScoringEngineInput,
  UserAssumptionOverrides,
} from './domain/types';

export { SCORING_DEFAULTS } from './defaults/scoringDefaults';

export { defaultFinancing, defaultOperating, mergeUserAssumptions } from './assumptions/mergeAssumptions';
export { applyScenario } from './scenarios/applyScenario';
export { normalizedInputsFromSnapshot } from './normalize/fromSnapshot';
export {
  finiteOrNull,
  isFiniteNonNegative,
  isFinitePositive,
  safeDivide,
  clamp,
} from './normalize/guards';

export { annualDebtService, cashInvestedAtClose, loanAmountFromLtv } from './calculate/financing';
export { computeOperatingCore } from './calculate/operating';
export { computePrimaryMetrics, resolveArv } from './calculate/primaryMetrics';
export { computeConfidence } from './confidence/computeConfidence';
export { buildScoreFactors } from './factors/buildScoreFactors';
export {
  computeFullScore,
  computeScoreFromPropertySnapshot,
  SCORING_ENGINE_VERSION,
} from './engine/computeFullScore';
