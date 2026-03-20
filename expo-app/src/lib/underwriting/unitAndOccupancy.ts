/**
 * Price per unit, price per sq ft, breakeven occupancy, 5-year equity paydown.
 * Matches PropFolio UnitAndOccupancyCalculator.
 */

import { monthlyPayment, balanceAfter } from './amortization';

export function pricePerUnit(
  purchasePrice: number | null | undefined,
  unitCount: number | null | undefined
): number | null {
  if (purchasePrice == null || unitCount == null || unitCount <= 0) return null;
  return purchasePrice / unitCount;
}

export function pricePerSquareFoot(
  purchasePrice: number | null | undefined,
  squareFeet: number | null | undefined
): number | null {
  if (purchasePrice == null || squareFeet == null || squareFeet <= 0) return null;
  return purchasePrice / squareFeet;
}

export function breakevenOccupancy(
  operatingExpensesAnnual: number | null | undefined,
  ads: number | null | undefined,
  gsr: number | null | undefined,
  otherIncomeAnnual: number | null | undefined
): number | null {
  if (
    operatingExpensesAnnual == null ||
    ads == null ||
    gsr == null
  )
    return null;
  const other = otherIncomeAnnual ?? 0;
  const denominator = gsr + other;
  if (denominator <= 0) return null;
  const ratio = (operatingExpensesAnnual + ads) / denominator;
  return Math.min(1, Math.max(0, ratio));
}

export function equityPaydown5Year(
  loanAmount: number | null | undefined,
  interestRateAnnual: number | null | undefined,
  termYears: number | null | undefined
): number | null {
  if (
    loanAmount == null ||
    interestRateAnnual == null ||
    termYears == null ||
    loanAmount <= 0 ||
    interestRateAnnual < 0 ||
    termYears <= 0
  )
    return null;
  const pmt = monthlyPayment(loanAmount, interestRateAnnual, termYears);
  if (pmt == null) return null;
  const months = Math.min(60, termYears * 12);
  const balance = balanceAfter(
    months,
    loanAmount,
    interestRateAnnual,
    pmt
  );
  if (balance == null) return null;
  return loanAmount - balance;
}
