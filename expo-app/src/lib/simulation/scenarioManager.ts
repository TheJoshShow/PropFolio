/**
 * Manages baseline and comparison scenarios. Pure logic; state held by caller.
 * Matches PropFolio ScenarioManager.
 */

import { run } from './simulationEngine';
import type { SimulationInputs } from './types';
import type { Scenario, ScenarioComparison } from './scenarioTypes';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function saveScenario(
  name: string,
  inputs: SimulationInputs,
  isBaseline: boolean,
  scenarios: Scenario[]
): { scenario: Scenario; scenarios: Scenario[] } {
  const scenario: Scenario = {
    id: newId(),
    name,
    isBaseline,
    inputs,
    createdAt: new Date().toISOString(),
  };
  const next = addScenario(scenario, scenarios);
  return { scenario, scenarios: next };
}

export function addScenario(scenario: Scenario, scenarios: Scenario[]): Scenario[] {
  let next = scenarios.slice();
  if (scenario.isBaseline) {
    next = next.map((s) => ({ ...s, isBaseline: false }));
  }
  next.push(scenario);
  if (scenario.isBaseline) {
    return setBaseline(scenario.id, next);
  }
  return next;
}

export function setBaseline(id: string, scenarios: Scenario[]): Scenario[] {
  return scenarios.map((s) => ({ ...s, isBaseline: s.id === id }));
}

export function removeScenario(id: string, scenarios: Scenario[]): Scenario[] {
  return scenarios.filter((s) => s.id !== id);
}

export function baseline(scenarios: Scenario[]): Scenario | null {
  return scenarios.find((s) => s.isBaseline) ?? null;
}

export function comparisonScenarios(scenarios: Scenario[]): Scenario[] {
  return scenarios.filter((s) => !s.isBaseline);
}

export function compare(baselineScenario: Scenario, comparisonScenario: Scenario): ScenarioComparison {
  const resultLeft = run(baselineScenario.inputs);
  const resultRight = run(comparisonScenario.inputs);
  return {
    left: baselineScenario,
    right: comparisonScenario,
    resultLeft,
    resultRight,
  };
}
