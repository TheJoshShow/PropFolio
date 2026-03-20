/**
 * Loan amortization. Pure functions; deterministic.
 * Matches PropFolio Engine/Underwriting/Calculators/Amortization.swift.
 */

function decimalPow(base: number, exp: number): number {
  if (exp <= 0) return exp === 0 ? 1 : 0;
  let result = 1;
  let b = base;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) result *= b;
    b *= b;
    e = Math.floor(e / 2);
  }
  return result;
}

/**
 * Monthly P&I payment: P * (r(1+r)^n) / ((1+r)^n - 1).
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number | null {
  if (principal <= 0 || termYears <= 0 || annualRate < 0) return null;
  const n = termYears * 12;
  const r = annualRate / 12;
  if (r === 0) return principal / n;
  const onePlusR = 1 + r;
  const onePlusRPowN = decimalPow(onePlusR, n);
  const numerator = principal * r * onePlusRPowN;
  const denominator = onePlusRPowN - 1;
  if (denominator === 0) return null;
  return numerator / denominator;
}

/**
 * Outstanding balance after k months (0-indexed).
 */
export function balanceAfter(
  months: number,
  principal: number,
  annualRate: number,
  monthlyPaymentAmount: number
): number | null {
  if (principal < 0 || months < 0) return null;
  if (months === 0) return principal;
  const r = annualRate / 12;
  if (r === 0) {
    const paid = monthlyPaymentAmount * months;
    return Math.max(0, principal - paid);
  }
  const onePlusR = 1 + r;
  const onePlusRPowK = decimalPow(onePlusR, months);
  const first = principal * onePlusRPowK;
  const second = monthlyPaymentAmount * ((onePlusRPowK - 1) / r);
  return Math.max(0, first - second);
}

/**
 * Annual debt service = monthly payment × 12.
 */
export function annualDebtService(
  principal: number,
  annualRate: number,
  termYears: number
): number | null {
  const pmt = monthlyPayment(principal, annualRate, termYears);
  if (pmt == null) return null;
  return pmt * 12;
}
