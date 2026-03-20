/**
 * Cap rate, CoC, GRM, expense ratio, break-even, debt yield, LTV.
 * Matches PropFolio ReturnMultiplierCalculator.
 */

export function capRate(
  noi: number | null | undefined,
  purchasePrice: number | null | undefined
): number | null {
  if (noi == null || purchasePrice == null || purchasePrice <= 0) return null;
  return noi / purchasePrice;
}

export function cashOnCashReturn(
  annualCashFlow: number | null | undefined,
  purchasePrice: number | null | undefined,
  loanAmount: number | null | undefined
): number | null {
  if (annualCashFlow == null || purchasePrice == null || loanAmount == null) return null;
  const equity = purchasePrice - loanAmount;
  if (equity <= 0) return null;
  return annualCashFlow / equity;
}

export function grm(
  purchasePrice: number | null | undefined,
  gsr: number | null | undefined
): number | null {
  if (purchasePrice == null || gsr == null || purchasePrice <= 0 || gsr <= 0) return null;
  return purchasePrice / gsr;
}

export function expenseRatio(
  operatingExpensesAnnual: number | null | undefined,
  egi: number | null | undefined
): number | null {
  if (operatingExpensesAnnual == null || egi == null || egi <= 0) return null;
  return operatingExpensesAnnual / egi;
}

export function breakEvenRatio(
  operatingExpensesAnnual: number | null | undefined,
  ads: number | null | undefined,
  egi: number | null | undefined
): number | null {
  if (
    operatingExpensesAnnual == null ||
    ads == null ||
    egi == null ||
    egi <= 0
  )
    return null;
  return (operatingExpensesAnnual + ads) / egi;
}

export function debtYield(
  noi: number | null | undefined,
  loanAmount: number | null | undefined
): number | null {
  if (noi == null || loanAmount == null || loanAmount <= 0) return null;
  return noi / loanAmount;
}

export function ltv(
  loanAmount: number | null | undefined,
  purchasePrice: number | null | undefined
): number | null {
  if (loanAmount == null || purchasePrice == null || purchasePrice <= 0) return null;
  return loanAmount / purchasePrice;
}
