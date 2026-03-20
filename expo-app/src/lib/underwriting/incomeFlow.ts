/**
 * Income flow: GSR, vacancy-adjusted, EGI, OE, NOI.
 * Matches PropFolio IncomeFlowCalculator.
 */

export function grossScheduledRentAnnual(
  monthlyRent: number | null | undefined,
  grossScheduledRentAnnualInput: number | null | undefined
): number | null {
  if (grossScheduledRentAnnualInput != null && grossScheduledRentAnnualInput >= 0)
    return grossScheduledRentAnnualInput;
  if (monthlyRent == null || monthlyRent < 0) return null;
  return monthlyRent * 12;
}

function vacancyMultiplier(vacancyPercent: number | null | undefined): number {
  if (vacancyPercent == null) return 1;
  const clamped = Math.min(100, Math.max(0, vacancyPercent));
  return 1 - clamped / 100;
}

export function vacancyAdjustedGrossIncome(
  gsr: number | null | undefined,
  vacancyPercent: number | null | undefined
): number | null {
  if (gsr == null || gsr < 0) return null;
  return gsr * vacancyMultiplier(vacancyPercent);
}

export function otherIncomeAnnual(input: number | null | undefined): number {
  if (input == null || input < 0) return 0;
  return input;
}

export function effectiveGrossIncome(
  vacancyAdjusted: number | null | undefined,
  otherIncome: number | null | undefined
): number | null {
  if (vacancyAdjusted == null) return null;
  return vacancyAdjusted + otherIncomeAnnual(otherIncome);
}

export function operatingExpensesAnnual(input: number | null | undefined): number | null {
  if (input == null) return null;
  return input >= 0 ? input : null;
}

export function noi(
  egi: number | null | undefined,
  oe: number | null | undefined
): number | null {
  if (egi == null || oe == null) return null;
  return egi - oe;
}
