export { score } from './dealScoringEngine';
export type { DealScoreInputs, DealScoreResult, DealScoreBand, DealScoreFactor } from './dealScoringEngine';
export { fromUnderwriting as dealScoreInputsFromUnderwriting, fromSimulationResult as dealScoreInputsFromSimulation } from './dealScoreInputsFromSimulation';
export { bandFromScore } from './types';
export type { DealScoreComponent } from './types';
export {
  scoreVsConfidenceOneLiner,
  insufficientDataReason,
  bandSentence,
  factorName,
  summary,
} from './dealScoreExplanations';
