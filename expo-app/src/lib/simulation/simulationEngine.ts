/**
 * Maps simulation inputs to underwriting, runs underwriting, returns result + cash metrics.
 * Matches PropFolio SimulationEngine.
 * Sanitizes numeric inputs (NaN/Infinity → null) so underwriting never receives invalid numbers.
 */

import { calculate as underwritingCalculate } from '~/lib/underwriting/underwritingEngine';
import type { UnderwritingInputs } from '~/lib/underwriting/types';
import type { SimulationInputs, SimulationResult } from './types';
import { planTotal, renovationCostsTotal } from '~/lib/renovation/types';

/** Returns the value if it is a finite number; preserves null/undefined; replaces NaN/Infinity with null. */
function sanitizeNum(v: number | null | undefined): number | null | undefined {
  if (v == null) return v;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

/** Defensive: ensure no NaN/Infinity is passed into underwriting or cash metrics. */
function sanitizeInputs(s: SimulationInputs): SimulationInputs {
  return {
    ...s,
    purchasePrice: sanitizeNum(s.purchasePrice),
    downPaymentPercent: sanitizeNum(s.downPaymentPercent),
    downPaymentAmount: sanitizeNum(s.downPaymentAmount),
    interestRateAnnual: sanitizeNum(s.interestRateAnnual),
    amortizationTermYears: sanitizeNum(s.amortizationTermYears),
    closingCosts: sanitizeNum(s.closingCosts),
    monthlyRentPerUnit: sanitizeNum(s.monthlyRentPerUnit),
    unitCount: sanitizeNum(s.unitCount),
    vacancyRatePercent: sanitizeNum(s.vacancyRatePercent),
    otherIncomeAnnual: sanitizeNum(s.otherIncomeAnnual),
    squareFeet: sanitizeNum(s.squareFeet),
    taxesAnnual: sanitizeNum(s.taxesAnnual),
    insuranceAnnual: sanitizeNum(s.insuranceAnnual),
    propertyManagementAnnual: sanitizeNum(s.propertyManagementAnnual),
    repairsAndMaintenanceAnnual: sanitizeNum(s.repairsAndMaintenanceAnnual),
    utilitiesAnnual: sanitizeNum(s.utilitiesAnnual),
    capitalReservesAnnual: sanitizeNum(s.capitalReservesAnnual),
  };
}

export function run(inputs: SimulationInputs): SimulationResult {
  const s = sanitizeInputs(inputs);
  const uw = toUnderwritingInputs(s);
  const outputs = underwritingCalculate(uw);
  const { totalCashToClose, equityInvested, renovationTotal } = cashMetrics(s);
  return {
    underwriting: outputs,
    totalCashToClose,
    equityInvested,
    renovationTotal,
  };
}

export function toUnderwritingInputs(s: SimulationInputs): UnderwritingInputs {
  const loanAmount = loanAmountFromInputs(s);
  const monthlyRent = monthlyRentTotal(s);
  const operatingExpenses = annualOperatingExpenses(s);

  return {
    purchasePrice: s.purchasePrice ?? undefined,
    loanAmount: loanAmount ?? undefined,
    interestRateAnnual: s.interestRateAnnual ?? undefined,
    termYears: s.amortizationTermYears ?? undefined,
    annualDebtService: undefined,
    monthlyRent: monthlyRent ?? undefined,
    grossScheduledRentAnnual: undefined,
    vacancyPercent: s.vacancyRatePercent ?? undefined,
    otherIncomeAnnual: s.otherIncomeAnnual ?? undefined,
    operatingExpensesAnnual: operatingExpenses ?? undefined,
    unitCount: s.unitCount ?? undefined,
    squareFeet: s.squareFeet ?? undefined,
  };
}

function loanAmountFromInputs(s: SimulationInputs): number | null {
  const price = s.purchasePrice;
  if (price == null || price <= 0) return null;
  let down: number | null = null;
  if (s.downPaymentAmount != null && s.downPaymentAmount >= 0) {
    down = s.downPaymentAmount;
  } else if (s.downPaymentPercent != null && s.downPaymentPercent >= 0) {
    const pct = Math.min(100, s.downPaymentPercent);
    down = (price * pct) / 100;
  }
  if (down == null) return null;
  const loan = price - down;
  return loan > 0 ? loan : null;
}

function monthlyRentTotal(s: SimulationInputs): number | null {
  const perUnit = s.monthlyRentPerUnit;
  const units = s.unitCount;
  if (perUnit == null || units == null || units <= 0 || perUnit < 0) return null;
  return perUnit * units;
}

function annualOperatingExpenses(s: SimulationInputs): number | null {
  const items = [
    s.taxesAnnual,
    s.insuranceAnnual,
    s.propertyManagementAnnual,
    s.repairsAndMaintenanceAnnual,
    s.utilitiesAnnual,
    s.capitalReservesAnnual,
  ];
  const sum = items.reduce((acc: number, x) => acc + (x ?? 0), 0);
  return sum >= 0 ? sum : null;
}

function cashMetrics(s: SimulationInputs): {
  totalCashToClose: number | null;
  equityInvested: number | null;
  renovationTotal: number | null;
} {
  const tier = s.renovationEstimateTier ?? 'base';
  const renoTotal = s.renovationPlan
    ? planTotal(s.renovationPlan, tier)
    : renovationCostsTotal(s.renovationCosts);
  const renoOptional = renoTotal > 0 ? renoTotal : null;

  const price = s.purchasePrice;
  if (price == null || price <= 0) {
    return { totalCashToClose: null, equityInvested: null, renovationTotal: renoOptional };
  }

  let down: number | null = null;
  if (s.downPaymentAmount != null && s.downPaymentAmount >= 0) {
    down = Math.min(s.downPaymentAmount, price);
  } else if (s.downPaymentPercent != null && s.downPaymentPercent >= 0) {
    const pct = Math.min(100, s.downPaymentPercent);
    down = (price * pct) / 100;
  }
  if (down == null) {
    return { totalCashToClose: null, equityInvested: null, renovationTotal: renoOptional };
  }

  const closing = s.closingCosts ?? 0;
  const equity = down + closing;
  const totalCash = down + closing + renoTotal;
  return {
    totalCashToClose: totalCash,
    equityInvested: equity,
    renovationTotal: renoOptional,
  };
}
