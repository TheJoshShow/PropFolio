export { run, toUnderwritingInputs } from './simulationEngine';
export type { SimulationInputs, SimulationResult } from './types';
export {
  saveScenario,
  addScenario,
  setBaseline,
  removeScenario,
  baseline,
  comparisonScenarios,
  compare,
} from './scenarioManager';
export type { Scenario, ScenarioComparison, ComparisonMetric } from './scenarioTypes';
export { comparisonDelta } from './scenarioTypes';
