/**
 * Underwriting inputs and outputs. All money in USD; rates as decimals (e.g. 0.065 = 6.5%).
 * Matches PropFolio Swift UnderwritingInputs/UnderwritingOutputs.
 */

export interface UnderwritingInputs {
  purchasePrice?: number | null;
  loanAmount?: number | null;
  interestRateAnnual?: number | null;
  termYears?: number | null;
  annualDebtService?: number | null;
  monthlyRent?: number | null;
  grossScheduledRentAnnual?: number | null;
  vacancyPercent?: number | null;
  otherIncomeAnnual?: number | null;
  operatingExpensesAnnual?: number | null;
  unitCount?: number | null;
  squareFeet?: number | null;
}

export interface UnderwritingOutputs {
  grossScheduledRentAnnual?: number | null;
  vacancyAdjustedGrossIncome?: number | null;
  otherIncomeAnnual?: number | null;
  effectiveGrossIncome?: number | null;
  operatingExpensesAnnual?: number | null;
  noi?: number | null;
  annualDebtService?: number | null;
  monthlyCashFlow?: number | null;
  annualCashFlow?: number | null;
  dscr?: number | null;
  capRate?: number | null;
  cashOnCashReturn?: number | null;
  grm?: number | null;
  expenseRatio?: number | null;
  breakEvenRatio?: number | null;
  debtYield?: number | null;
  ltv?: number | null;
  pricePerUnit?: number | null;
  pricePerSquareFoot?: number | null;
  breakevenOccupancy?: number | null;
  equityPaydown5Year?: number | null;
}

/** Round to 4 decimal places for ratios; use for intermediate consistency. */
export function round4(x: number): number {
  return Math.round(x * 1e4) / 1e4;
}

/** Round to 2 decimal places for currency. */
export function round2(x: number): number {
  return Math.round(x * 1e2) / 1e2;
}
