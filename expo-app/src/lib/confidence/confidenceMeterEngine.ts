/**
 * Computes how confident PropFolio is that the analysis is grounded and dependable.
 * Matches PropFolio ConfidenceMeterEngine.
 */

import type {
  ConfidenceMeterInputs,
  ConfidenceMeterResult,
  ConfidenceMeterExplanation,
  ConfidenceMeterFactor,
  ConfidenceMeterBand,
} from './types';
import {
  factorSupporting,
  factorLimiting,
  manualOverrideLimiting,
  explanationSummary,
  recommendedAction,
  recommendedActionForOverrides,
} from './confidenceMeterCopy';

const WEIGHTS: Record<ConfidenceMeterFactor, number> = {
  propertyDataCompleteness: 0.18,
  rentEstimateConfidence: 0.18,
  expenseAssumptionsConfidence: 0.15,
  renovationBudgetCertainty: 0.12,
  financingAssumptionsStability: 0.12,
  marketDataReliabilityFreshness: 0.15,
  manualOverrideImpact: 0.1,
};

function overrideImpactScore(count: number | null | undefined): number | null {
  if (count == null || count < 0) return null;
  if (count === 0) return 1;
  const cap = 10;
  const n = Math.min(count, cap);
  return Math.max(0, 1 - n / cap);
}

function bandForScore(score: number): ConfidenceMeterBand {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'veryLow';
}

type Contribution = { factor: ConfidenceMeterFactor; value: number };

function buildExplanation(
  contributions: Contribution[],
  score: number,
  overrideCount: number | null | undefined
): ConfidenceMeterExplanation {
  const supporting = contributions
    .filter((c) => c.value >= 0.6)
    .map((c) => factorSupporting(c.factor, c.value));
  const limiting = contributions
    .filter((c) => c.value < 0.5)
    .map((c) => factorLimiting(c.factor, c.value));

  if (overrideCount != null && overrideCount > 0) {
    const overrideLimit = manualOverrideLimiting(overrideCount);
    const limitingWithOverride = [...limiting, overrideLimit];
    const summaryText = explanationSummary(score, supporting.length, limitingWithOverride.length);
    return { supportingFactors: supporting, limitingFactors: limitingWithOverride, summary: summaryText };
  }
  const summaryText = explanationSummary(score, supporting.length, limiting.length);
  return { supportingFactors: supporting, limitingFactors: limiting, summary: summaryText };
}

function buildRecommendedActions(
  contributions: Contribution[],
  overrideCount: number | null | undefined
): string[] {
  const actions: string[] = [];
  for (const { factor, value } of contributions) {
    if (value < 0.5) {
      const action = recommendedAction(factor);
      if (action) actions.push(action);
    }
  }
  if (overrideCount != null && overrideCount >= 3) {
    const overrideAction = recommendedActionForOverrides(overrideCount);
    if (!actions.includes(overrideAction)) actions.push(overrideAction);
  }
  return actions.slice(0, 5);
}

export function evaluate(inputs: ConfidenceMeterInputs): ConfidenceMeterResult {
  const contributions: Contribution[] = [];

  function add(factor: ConfidenceMeterFactor, value: number | null | undefined) {
    if (value != null && value >= 0 && value <= 1) contributions.push({ factor, value });
  }

  add('propertyDataCompleteness', inputs.propertyDataCompleteness);
  add('rentEstimateConfidence', inputs.rentEstimateConfidence);
  add('expenseAssumptionsConfidence', inputs.expenseAssumptionsConfidence);
  add('renovationBudgetCertainty', inputs.renovationBudgetCertainty);
  add('financingAssumptionsStability', inputs.financingAssumptionsStability);
  add('marketDataReliabilityFreshness', inputs.marketDataReliabilityFreshness);
  const overrideScore = overrideImpactScore(inputs.manualOverrideCount);
  if (overrideScore != null) {
    contributions.push({ factor: 'manualOverrideImpact', value: overrideScore });
  }

  let score: number;
  const totalWeight = contributions.reduce((sum, c) => sum + (WEIGHTS[c.factor] ?? 0), 0);
  if (totalWeight > 0) {
    const weightedSum = contributions.reduce(
      (sum, c) => sum + c.value * (WEIGHTS[c.factor] ?? 0),
      0
    );
    score = Math.min(100, Math.max(0, (weightedSum / totalWeight) * 100));
  } else {
    score = 0;
  }

  const band = bandForScore(score);
  const explanation = buildExplanation(contributions, score, inputs.manualOverrideCount);
  const recommendedActions = buildRecommendedActions(contributions, inputs.manualOverrideCount);

  return { score, band, explanation, recommendedActions };
}
