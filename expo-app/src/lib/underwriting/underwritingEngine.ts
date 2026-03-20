/**
 * Single entry point: calculate(inputs) → outputs.
 * All formulas in domain modules; deterministic.
 * Matches PropFolio UnderwritingEngine.
 */

import type { UnderwritingInputs, UnderwritingOutputs } from './types';
import * as Income from './incomeFlow';
import * as Debt from './debtAndCashFlow';
import * as Return from './returnMultiplier';
import * as Unit from './unitAndOccupancy';

export function calculate(inputs: UnderwritingInputs): UnderwritingOutputs {
  const gsr = Income.grossScheduledRentAnnual(
    inputs.monthlyRent ?? null,
    inputs.grossScheduledRentAnnual ?? null
  );
  const vacancyAdjusted = Income.vacancyAdjustedGrossIncome(
    gsr,
    inputs.vacancyPercent ?? null
  );
  const otherIncome = Income.otherIncomeAnnual(inputs.otherIncomeAnnual);
  const egi = Income.effectiveGrossIncome(
    vacancyAdjusted,
    inputs.otherIncomeAnnual ?? null
  );
  const oe = Income.operatingExpensesAnnual(inputs.operatingExpensesAnnual ?? null);
  const noi = Income.noi(egi, oe);

  const ads = Debt.annualDebtService(
    inputs.annualDebtService ?? null,
    inputs.loanAmount ?? null,
    inputs.interestRateAnnual ?? null,
    inputs.termYears ?? null
  );

  const monthlyCf = Debt.monthlyCashFlow(noi, ads);
  const annualCf = Debt.annualCashFlow(noi, ads);
  const dscr = Debt.dscr(noi, ads);

  const capRate = Return.capRate(noi, inputs.purchasePrice ?? null);
  const coc = Return.cashOnCashReturn(
    annualCf,
    inputs.purchasePrice ?? null,
    inputs.loanAmount ?? null
  );
  const grm = Return.grm(inputs.purchasePrice ?? null, gsr);
  const expenseRatio = Return.expenseRatio(oe, egi);
  const breakEvenRatio = Return.breakEvenRatio(oe, ads, egi);
  const debtYield = Return.debtYield(noi, inputs.loanAmount ?? null);
  const ltv = Return.ltv(inputs.loanAmount ?? null, inputs.purchasePrice ?? null);

  const pricePerUnit = Unit.pricePerUnit(
    inputs.purchasePrice ?? null,
    inputs.unitCount ?? null
  );
  const pricePerSqFt = Unit.pricePerSquareFoot(
    inputs.purchasePrice ?? null,
    inputs.squareFeet ?? null
  );

  const breakevenOcc = Unit.breakevenOccupancy(
    oe,
    ads,
    gsr,
    inputs.otherIncomeAnnual ?? null
  );
  const paydown5 = Unit.equityPaydown5Year(
    inputs.loanAmount ?? null,
    inputs.interestRateAnnual ?? null,
    inputs.termYears ?? null
  );

  return {
    grossScheduledRentAnnual: gsr ?? undefined,
    vacancyAdjustedGrossIncome: vacancyAdjusted ?? undefined,
    otherIncomeAnnual: otherIncome > 0 ? otherIncome : undefined,
    effectiveGrossIncome: egi ?? undefined,
    operatingExpensesAnnual: oe ?? undefined,
    noi: noi ?? undefined,
    annualDebtService: ads ?? undefined,
    monthlyCashFlow: monthlyCf ?? undefined,
    annualCashFlow: annualCf ?? undefined,
    dscr: dscr ?? undefined,
    capRate: capRate ?? undefined,
    cashOnCashReturn: coc ?? undefined,
    grm: grm ?? undefined,
    expenseRatio: expenseRatio ?? undefined,
    breakEvenRatio: breakEvenRatio ?? undefined,
    debtYield: debtYield ?? undefined,
    ltv: ltv ?? undefined,
    pricePerUnit: pricePerUnit ?? undefined,
    pricePerSquareFoot: pricePerSqFt ?? undefined,
    breakevenOccupancy: breakevenOcc ?? undefined,
    equityPaydown5Year: paydown5 ?? undefined,
  };
}

export type { UnderwritingInputs, UnderwritingOutputs } from './types';
