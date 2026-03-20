/**
 * Scenario and comparison types. Matches PropFolio Scenario, ScenarioComparison, ComparisonMetric.
 */

import type { SimulationInputs, SimulationResult } from './types';

export type ComparisonMetric =
  | 'noi'
  | 'capRate'
  | 'monthlyCashFlow'
  | 'annualCashFlow'
  | 'dscr'
  | 'cashOnCashReturn'
  | 'totalCashToClose'
  | 'equityInvested';

export interface Scenario {
  id: string;
  name: string;
  isBaseline: boolean;
  inputs: SimulationInputs;
  createdAt: string; // ISO date
}

export interface ScenarioComparison {
  left: Scenario;
  right: Scenario;
  resultLeft: SimulationResult;
  resultRight: SimulationResult;
}

export function comparisonDelta(
  comparison: ScenarioComparison,
  metric: ComparisonMetric
): number | null {
  const a = valueForMetric(comparison.resultLeft, metric);
  const b = valueForMetric(comparison.resultRight, metric);
  if (a == null || b == null) return null;
  return b - a;
}

function valueForMetric(result: SimulationResult, metric: ComparisonMetric): number | null {
  switch (metric) {
    case 'noi': return result.underwriting.noi ?? null;
    case 'capRate': return result.underwriting.capRate ?? null;
    case 'monthlyCashFlow': return result.underwriting.monthlyCashFlow ?? null;
    case 'annualCashFlow': return result.underwriting.annualCashFlow ?? null;
    case 'dscr': return result.underwriting.dscr ?? null;
    case 'cashOnCashReturn': return result.underwriting.cashOnCashReturn ?? null;
    case 'totalCashToClose': return result.totalCashToClose ?? null;
    case 'equityInvested': return result.equityInvested ?? null;
    default: return null;
  }
}
