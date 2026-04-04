import { SCORING_DEFAULTS } from '../defaults/scoringDefaults';
import type {
  FinancingAssumptions,
  NormalizedPropertyInputs,
  OperatingAssumptions,
  UserAssumptionOverrides,
} from '../domain/types';

export function defaultFinancing(): FinancingAssumptions {
  return {
    loanToValue: SCORING_DEFAULTS.LOAN_TO_VALUE,
    interestRateAnnual: SCORING_DEFAULTS.INTEREST_RATE_ANNUAL,
    amortizationYears: SCORING_DEFAULTS.AMORTIZATION_YEARS,
    interestOnly: SCORING_DEFAULTS.INTEREST_ONLY,
    closingCostPctOfLoan: SCORING_DEFAULTS.CLOSING_COST_PCT_OF_LOAN,
  };
}

export function defaultOperating(): OperatingAssumptions {
  return {
    vacancyRate: SCORING_DEFAULTS.VACANCY_RATE,
    maintenancePctOfEgi: SCORING_DEFAULTS.MAINTENANCE_PCT_OF_EGI,
    managementPctOfEgi: SCORING_DEFAULTS.PROPERTY_MANAGEMENT_PCT_OF_EGI,
    capexReserveMonthly: SCORING_DEFAULTS.CAPEX_RESERVE_MONTHLY,
  };
}

function mergeNormalized(
  base: NormalizedPropertyInputs,
  overrides?: UserAssumptionOverrides['inputs'],
): NormalizedPropertyInputs {
  if (!overrides) {
    return { ...base };
  }
  return {
    ...base,
    ...overrides,
    version: 1,
    unitCount: overrides.unitCount ?? base.unitCount,
  };
}

export function mergeUserAssumptions(
  normalized: NormalizedPropertyInputs,
  financing: FinancingAssumptions,
  operating: OperatingAssumptions,
  overrides?: UserAssumptionOverrides,
): {
  normalized: NormalizedPropertyInputs;
  financing: FinancingAssumptions;
  operating: OperatingAssumptions;
} {
  return {
    normalized: mergeNormalized(normalized, overrides?.inputs),
    financing: { ...financing, ...overrides?.financing },
    operating: { ...operating, ...overrides?.operating },
  };
}
