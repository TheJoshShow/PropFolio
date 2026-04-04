import { SCORING_DEFAULTS } from '../defaults/scoringDefaults';
import type {
  CalculatedMetric,
  FinancingAssumptions,
  NormalizedPropertyInputs,
  OperatingAssumptions,
} from '../domain/types';
import { annualDebtService, cashInvestedAtClose, loanAmountFromLtv } from './financing';
import { computeOperatingCore } from './operating';
import { isFinitePositive, safeDivide } from '../normalize/guards';

/**
 * Resolve ARV: explicit input wins; else optional heuristic from rehab (see defaults).
 * Replace heuristic with comp-based AVM when available.
 */
export function resolveArv(
  inputs: NormalizedPropertyInputs,
): { arv: number | null; usedHeuristic: boolean; missingDrivers: string[] } {
  const missingDrivers: string[] = [];
  if (isFinitePositive(inputs.arv)) {
    return { arv: inputs.arv, usedHeuristic: false, missingDrivers };
  }
  const p = inputs.purchasePrice;
  const rehab = inputs.rehabBudget ?? SCORING_DEFAULTS.DEFAULT_REHAB_BUDGET;
  if (!isFinitePositive(p)) {
    missingDrivers.push('arv_or_purchase');
    return { arv: null, usedHeuristic: false, missingDrivers };
  }
  if (rehab <= 0) {
    missingDrivers.push('arv');
    return { arv: null, usedHeuristic: false, missingDrivers };
  }
  const cap = Math.max(p * SCORING_DEFAULTS.ARV_HEURISTIC_REHAB_TO_PRICE_RATIO_CAP, 1);
  const intensity = Math.min(1, rehab / cap);
  const uplift = 1 + SCORING_DEFAULTS.ARV_HEURISTIC_UPLIFT_MAX * intensity;
  return { arv: p * uplift, usedHeuristic: true, missingDrivers };
}

function metric(
  key: CalculatedMetric['key'],
  label: string,
  value: number | null,
  unit: CalculatedMetric['unit'],
  formulaId: string,
  missingDrivers: string[],
  normalized: number | null = null,
): CalculatedMetric {
  const availability = value == null || !Number.isFinite(value) ? 'insufficient_data' : 'ok';
  return {
    key,
    label,
    value: availability === 'ok' ? value : null,
    normalized,
    availability,
    formulaId,
    missingDrivers: [...new Set(missingDrivers)],
    unit,
  };
}

/** Pure pipeline: one call per recalculation (scenario already applied to inputs). */
export function computePrimaryMetrics(
  inputs: NormalizedPropertyInputs,
  financing: FinancingAssumptions,
  operating: OperatingAssumptions,
): CalculatedMetric[] {
  const opCore = computeOperatingCore(inputs, operating);
  const purchase = inputs.purchasePrice;
  const loan = isFinitePositive(purchase)
    ? loanAmountFromLtv(purchase, financing.loanToValue)
    : null;
  const ds =
    loan != null && isFinitePositive(purchase)
      ? annualDebtService(
          loan,
          financing.interestRateAnnual,
          financing.amortizationYears,
          financing.interestOnly,
        )
      : null;

  const missing = [...opCore.missingDrivers];
  if (!isFinitePositive(purchase)) {
    missing.push('purchasePrice');
  }

  const noi = opCore.noiAnnual;
  const capRate =
    noi != null && isFinitePositive(purchase) ? safeDivide(noi, purchase) : null;

  const cocMissing = [...missing];
  const invested =
    isFinitePositive(purchase) && loan != null
      ? cashInvestedAtClose({
          purchasePrice: purchase,
          loanPrincipal: loan,
          closingCostPctOfLoan: financing.closingCostPctOfLoan,
          rehabBudget: inputs.rehabBudget ?? 0,
        })
      : null;

  const leveredCf =
    noi != null && ds != null ? noi - ds : null;

  const cashOnCash =
    leveredCf != null && invested != null && invested > 0
      ? safeDivide(leveredCf, invested)
      : null;

  if (invested == null || invested <= 0) {
    cocMissing.push('cash_invested');
  }
  if (ds == null) {
    cocMissing.push('debt_service');
  }

  const dscr =
    noi != null && ds != null && ds > 0 ? safeDivide(noi, ds) : null;

  const { arv, missingDrivers: arvMissing } = resolveArv(inputs);

  const grm =
    isFinitePositive(purchase) && isFinitePositive(inputs.monthlyRentGross)
      ? safeDivide(purchase, inputs.monthlyRentGross! * 12)
      : null;

  const metrics: CalculatedMetric[] = [
    metric(
      'egi_annual',
      'Effective gross income (annual)',
      opCore.egiAnnual,
      'currency_annual',
      'egi = gpr_annual * (1 - vacancy)',
      opCore.missingDrivers,
      null,
    ),
    metric(
      'operating_expense_annual',
      'Operating expenses (annual)',
      opCore.operatingExpenseAnnual,
      'currency_annual',
      'opex = fixed + pct_egi + capex_reserve',
      opCore.missingDrivers,
      null,
    ),
    metric(
      'noi_annual',
      'NOI (annual)',
      noi,
      'currency_annual',
      'noi = egi - opex',
      opCore.missingDrivers,
      null,
    ),
    metric(
      'cap_rate',
      'Cap rate',
      capRate,
      'ratio',
      'cap_rate = noi / purchase_price',
      [...missing],
      capRate,
    ),
    metric(
      'debt_service_annual',
      'Debt service (annual)',
      ds,
      'currency_annual',
      'amortizing_or_io_payment * 12',
      loan == null ? ['loan'] : [],
      null,
    ),
    metric(
      'cash_flow_annual',
      'Cash flow (annual, levered)',
      leveredCf,
      'currency_annual',
      'cf = noi - debt_service',
      [...missing, ...(ds == null ? ['debt_service'] : [])],
      null,
    ),
    metric(
      'cash_on_cash',
      'Cash-on-cash return',
      cashOnCash,
      'ratio',
      'coc = levered_cf / cash_invested',
      cocMissing,
      cashOnCash,
    ),
    metric(
      'dscr',
      'DSCR',
      dscr,
      'multiple',
      'dscr = noi / debt_service',
      noi == null || ds == null || ds <= 0 ? ['noi_or_debt_service'] : [],
      dscr,
    ),
    metric(
      'arv',
      'ARV (after repair value)',
      arv,
      'currency_annual',
      arvMissing.length ? 'user_or_heuristic' : 'explicit_or_heuristic',
      arvMissing,
      null,
    ),
    metric(
      'gross_rent_multiplier_hint',
      'Gross rent multiplier',
      grm,
      'multiple',
      'grm = purchase / gpr_annual',
      [...missing.filter((m) => m !== 'annualPropertyTax')],
      null,
    ),
  ];

  return metrics;
}
