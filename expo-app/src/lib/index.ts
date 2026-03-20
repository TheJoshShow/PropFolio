/**
 * Shared business logic: underwriting, scoring, confidence, simulation, renovation.
 * All formulas live here; no duplicate logic across platforms.
 */

// Underwriting
export { calculate } from './underwriting/underwritingEngine';
export type { UnderwritingInputs, UnderwritingOutputs } from './underwriting/types';
export { round4, round2 } from './underwriting/types';

// Scoring
export { score as scoreDeal, dealScoreInputsFromUnderwriting, dealScoreInputsFromSimulation } from './scoring';
export type { DealScoreInputs, DealScoreResult, DealScoreBand, DealScoreFactor } from './scoring';

// Confidence
export { evaluate as evaluateConfidence } from './confidence';
export type {
  ConfidenceMeterInputs,
  ConfidenceMeterResult,
  ConfidenceMeterBand,
} from './confidence';

// Simulation
export { run as runSimulation, toUnderwritingInputs } from './simulation';
export type { SimulationInputs, SimulationResult } from './simulation';

// Renovation
export type { RenovationPlan, RenovationLineItem, RenovationCosts, RenovationEstimateTier, RenovationCategory } from './renovation';
export { planTotal, renovationCostsTotal } from './renovation';

// Parsers
export { parseZillowUrl, parseRedfinUrl, parseAddress } from './parsers';
export type { PartialAddress, ParsedListingURL, ParseURLResult, ListingSource } from './parsers';

// Scenario
export type { Scenario, ScenarioComparison, ComparisonMetric } from './simulation';
export { comparisonDelta, saveScenario, setBaseline, compare } from './simulation';
