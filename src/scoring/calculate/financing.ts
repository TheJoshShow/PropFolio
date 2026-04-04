import { safeDivide } from '../normalize/guards';

/**
 * Annual debt service for amortizing or interest-only loans.
 * Formula: standard fixed-rate mortgage payment × 12, or IO: principal × i_annual.
 * Swap for ARM / IO period / points if product expands.
 */
export function annualDebtService(
  loanPrincipal: number,
  interestRateAnnual: number,
  amortizationYears: number,
  interestOnly: boolean,
): number | null {
  if (loanPrincipal <= 0 || interestRateAnnual < 0 || amortizationYears <= 0) {
    return null;
  }
  if (interestOnly) {
    return loanPrincipal * interestRateAnnual;
  }
  const r = interestRateAnnual / 12;
  const n = Math.round(amortizationYears * 12);
  if (n <= 0) {
    return null;
  }
  if (r === 0) {
    return safeDivide(loanPrincipal, amortizationYears) ?? null;
  }
  const factor = (r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const monthly = loanPrincipal * factor;
  return monthly * 12;
}

export function loanAmountFromLtv(purchasePrice: number, ltv: number): number | null {
  if (purchasePrice <= 0 || ltv <= 0 || ltv > 1) {
    return null;
  }
  return purchasePrice * ltv;
}

export function cashInvestedAtClose(args: {
  purchasePrice: number;
  loanPrincipal: number;
  closingCostPctOfLoan: number;
  rehabBudget: number;
}): number | null {
  const { purchasePrice, loanPrincipal, closingCostPctOfLoan, rehabBudget } = args;
  if (purchasePrice < 0 || loanPrincipal < 0 || rehabBudget < 0) {
    return null;
  }
  const down = purchasePrice - loanPrincipal;
  const closing = loanPrincipal * closingCostPctOfLoan;
  return down + closing + rehabBudget;
}
