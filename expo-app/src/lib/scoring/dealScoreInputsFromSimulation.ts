/**
 * Build DealScoreInputs from underwriting outputs or SimulationResult.
 * Matches PropFolio DealScoreInputs+Builders.
 */

import type { DealScoreInputs } from './types';
import type { UnderwritingOutputs } from '~/lib/underwriting/types';
import type { SimulationResult } from '~/lib/simulation/types';

export interface DealScoreInputsFromUnderwritingOptions {
  totalCashToClose?: number | null;
  renovationTotal?: number | null;
  purchasePrice?: number | null;
  dataConfidence?: number | null;
  marketTailwinds?: number | null;
  stressDSCR?: number | null;
  purchaseDiscountVsValue?: number | null;
}

export function fromUnderwriting(
  underwriting: UnderwritingOutputs,
  options: DealScoreInputsFromUnderwritingOptions = {}
): DealScoreInputs {
  const {
    totalCashToClose,
    renovationTotal,
    purchasePrice,
    dataConfidence,
    marketTailwinds,
    stressDSCR,
    purchaseDiscountVsValue,
  } = options;

  let rentCoverageStrength: number | null = null;
  const gsr = underwriting.grossScheduledRentAnnual;
  const ads = underwriting.annualDebtService;
  if (gsr != null && ads != null && ads > 0) {
    rentCoverageStrength = gsr / ads;
  }

  let renovationBurdenRatio: number | null = null;
  if (renovationTotal != null && renovationTotal > 0) {
    const denom = totalCashToClose ?? purchasePrice ?? 1;
    if (denom > 0) renovationBurdenRatio = renovationTotal / denom;
  }

  return {
    capRate: underwriting.capRate ?? null,
    monthlyCashFlow: underwriting.monthlyCashFlow ?? null,
    annualCashFlow: underwriting.annualCashFlow ?? null,
    cashOnCashReturn: underwriting.cashOnCashReturn ?? null,
    dscr: underwriting.dscr ?? null,
    expenseRatio: underwriting.expenseRatio ?? null,
    breakevenOccupancy: underwriting.breakevenOccupancy ?? null,
    renovationBurdenRatio,
    purchaseDiscountVsValue: purchaseDiscountVsValue ?? null,
    rentCoverageStrength,
    dataConfidence: dataConfidence ?? null,
    marketTailwinds: marketTailwinds ?? null,
    stressDSCR: stressDSCR ?? null,
  };
}

export function fromSimulationResult(
  simulationResult: SimulationResult,
  options: Omit<DealScoreInputsFromUnderwritingOptions, 'totalCashToClose' | 'renovationTotal'> = {}
): DealScoreInputs {
  return fromUnderwriting(simulationResult.underwriting, {
    ...options,
    totalCashToClose: simulationResult.totalCashToClose,
    renovationTotal: simulationResult.renovationTotal,
    purchasePrice: options.purchasePrice ?? undefined,
  });
}
