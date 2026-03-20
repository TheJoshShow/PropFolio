/**
 * ADS, monthly/annual cash flow, DSCR.
 * Matches PropFolio DebtAndCashFlowCalculator.
 */

import { annualDebtService as adsFromAmortization } from './amortization';

export function annualDebtService(
  input: number | null | undefined,
  loanAmount: number | null | undefined,
  interestRateAnnual: number | null | undefined,
  termYears: number | null | undefined
): number | null {
  if (input != null && input >= 0) return input;
  if (
    loanAmount == null ||
    interestRateAnnual == null ||
    termYears == null ||
    loanAmount <= 0 ||
    termYears <= 0 ||
    interestRateAnnual < 0
  )
    return null;
  return adsFromAmortization(loanAmount, interestRateAnnual, termYears);
}

export function monthlyCashFlow(
  noi: number | null | undefined,
  ads: number | null | undefined
): number | null {
  if (noi == null || ads == null) return null;
  return (noi - ads) / 12;
}

export function annualCashFlow(
  noi: number | null | undefined,
  ads: number | null | undefined
): number | null {
  if (noi == null || ads == null) return null;
  return noi - ads;
}

export function dscr(
  noi: number | null | undefined,
  ads: number | null | undefined
): number | null {
  if (noi == null || ads == null || ads <= 0) return null;
  return noi / ads;
}
