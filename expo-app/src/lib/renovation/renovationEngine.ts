import type { RenovationDealInputs, RenovationAnalysisResult, DownsideScenarioResult } from './types';

function safeNumber(n: number | null | undefined): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return n;
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

function annualDebtService(loanAmount: number, interestRate: number, years: number): number | null {
  if (!Number.isFinite(loanAmount) || !Number.isFinite(interestRate) || !Number.isFinite(years)) return null;
  if (loanAmount <= 0 || years <= 0) return null;
  const r = interestRate;
  if (r === 0) {
    return loanAmount / years;
  }
  const n = years;
  const annuityFactor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return loanAmount * annuityFactor;
}

function computeNoiAnnual(grossRentAnnual: number, vacancyRate: number, operatingExpensesAnnual: number): number | null {
  if (!Number.isFinite(grossRentAnnual) || grossRentAnnual <= 0) return null;
  if (!Number.isFinite(vacancyRate) || vacancyRate < 0 || vacancyRate >= 1) return null;
  if (!Number.isFinite(operatingExpensesAnnual) || operatingExpensesAnnual < 0) return null;
  const egi = grossRentAnnual * (1 - vacancyRate);
  const noi = egi - operatingExpensesAnnual;
  return Number.isFinite(noi) ? noi : null;
}

function computeDownsideScenarios(
  baseNoiAnnual: number | null,
  baseDebtServiceAnnual: number | null,
  baseGrossRentAnnual: number
): DownsideScenarioResult[] {
  const scenarios: DownsideScenarioResult[] = [];

  if (baseNoiAnnual == null || baseDebtServiceAnnual == null || baseGrossRentAnnual <= 0) {
    return scenarios;
  }

  const applyRentShock = (rentShockPercent: number): { noi: number | null; cashFlow: number | null } => {
    const shockedRent = baseGrossRentAnnual * (1 + rentShockPercent);
    const shockedNoi = baseNoiAnnual * (1 + rentShockPercent);
    const cf = shockedNoi - baseDebtServiceAnnual;
    return { noi: shockedNoi, cashFlow: cf };
  };

  const mild = applyRentShock(-0.05);
  scenarios.push({
    name: 'rent_minus_5',
    description: 'Rent down 5%',
    dscr: mild.noi != null && baseDebtServiceAnnual > 0 ? mild.noi / baseDebtServiceAnnual : null,
    annualCashFlow: mild.cashFlow,
  });

  const severe = applyRentShock(-0.1);
  scenarios.push({
    name: 'rent_minus_10',
    description: 'Rent down 10%',
    dscr: severe.noi != null && baseDebtServiceAnnual > 0 ? severe.noi / baseDebtServiceAnnual : null,
    annualCashFlow: severe.cashFlow,
  });

  return scenarios;
}

export function evaluateRenovationDeal(input: RenovationDealInputs): RenovationAnalysisResult {
  const totalRenovationCost = sum(input.renovations.map((r) => (Number.isFinite(r.cost) ? r.cost : 0)));
  const totalProjectCost = input.purchasePrice + input.closingCosts + totalRenovationCost;

  const grossRentAnnualPre = input.currentMonthlyRent * 12;
  const grossRentAnnualPost = input.projectedMonthlyRent * 12;

  const operatingExpensesAnnualPost =
    input.operatingExpensesAnnual + input.taxesAnnual + input.insuranceAnnual;

  const noiAnnual = computeNoiAnnual(
    grossRentAnnualPost,
    input.vacancyRate,
    operatingExpensesAnnualPost
  );

  const capRate =
    noiAnnual != null && totalProjectCost > 0 ? noiAnnual / totalProjectCost : null;

  const debtServiceAnnual = annualDebtService(
    input.loanAmount,
    input.interestRate,
    input.amortizationYears
  );

  const annualCashFlow =
    noiAnnual != null && debtServiceAnnual != null ? noiAnnual - debtServiceAnnual : null;
  const monthlyCashFlow =
    annualCashFlow != null ? annualCashFlow / 12 : null;

  const totalCashInvested =
    input.renovationFinancingMode === 'cashOutOfPocket'
      ? input.purchasePrice - input.loanAmount + input.closingCosts + totalRenovationCost
      : input.purchasePrice - input.loanAmount + input.closingCosts;

  const cashOnCashReturn =
    annualCashFlow != null && totalCashInvested > 0
      ? annualCashFlow / totalCashInvested
      : null;

  const dscr =
    noiAnnual != null && debtServiceAnnual != null && debtServiceAnnual > 0
      ? noiAnnual / debtServiceAnnual
      : null;

  const netYield =
    noiAnnual != null && totalProjectCost > 0 ? noiAnnual / totalProjectCost : null;

  const totalArvDelta = sum(
    input.renovations.map((r) => (Number.isFinite(r.arvDelta ?? 0) ? (r.arvDelta as number) : 0))
  );
  const resolvedArv =
    safeNumber(input.arv) ??
    (Number.isFinite(input.purchasePrice + totalArvDelta)
      ? input.purchasePrice + totalArvDelta
      : null);

  const arvGain =
    resolvedArv != null && totalProjectCost > 0 ? resolvedArv - totalProjectCost : null;

  const renovationRoi =
    arvGain != null && totalRenovationCost > 0 ? arvGain / totalRenovationCost : null;

  const preNoiAnnual = computeNoiAnnual(
    grossRentAnnualPre,
    input.vacancyRate,
    input.operatingExpensesAnnual + input.taxesAnnual + input.insuranceAnnual
  );
  const preDebtServiceAnnual = debtServiceAnnual;
  const preAnnualCashFlow =
    preNoiAnnual != null && preDebtServiceAnnual != null
      ? preNoiAnnual - preDebtServiceAnnual
      : null;

  const incrementalAnnualCashFlow =
    annualCashFlow != null && preAnnualCashFlow != null
      ? annualCashFlow - preAnnualCashFlow
      : null;

  const paybackPeriodYears =
    incrementalAnnualCashFlow != null &&
    incrementalAnnualCashFlow > 0 &&
    totalRenovationCost > 0
      ? totalRenovationCost / incrementalAnnualCashFlow
      : null;

  const downsideScenarios = computeDownsideScenarios(
    noiAnnual,
    debtServiceAnnual,
    grossRentAnnualPost
  );

  let weightedScore: number | null = null;
  if (
    capRate != null &&
    cashOnCashReturn != null &&
    dscr != null &&
    renovationRoi != null
  ) {
    const capScore = Math.max(0, Math.min(10, (capRate * 100 - 4) * 1.5));
    const cocScore = Math.max(0, Math.min(10, (cashOnCashReturn * 100 - 6) * 1.2));
    const dscrScore = Math.max(0, Math.min(10, (dscr - 1.0) * 10));
    const renoScore = Math.max(0, Math.min(10, (renovationRoi * 100 - 10) * 0.5));
    weightedScore = (0.35 * capScore) + (0.25 * cocScore) + (0.25 * dscrScore) + (0.15 * renoScore);
  }

  return {
    noiAnnual,
    capRate,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCashReturn,
    dscr,
    netYield,
    totalRenovationCost,
    totalProjectCost,
    resolvedArv,
    arvGain,
    renovationRoi,
    paybackPeriodYears,
    downsideScenarios,
    weightedScore,
  };
}

