import type { NormalizedPropertyInputs, OperatingAssumptions } from '../domain/types';
import { isFinitePositive } from '../normalize/guards';

export type OperatingCore = {
  gprAnnual: number | null;
  egiAnnual: number | null;
  operatingExpenseAnnual: number | null;
  noiAnnual: number | null;
  missingDrivers: string[];
};

/**
 * EGI = GPR × (1 − vacancy).
 * OpEx = fixed (tax, ins, HOA, other) + % of EGI (maint, mgmt) + capex reserve × 12.
 * NOI = EGI − OpEx (before debt service).
 */
export function computeOperatingCore(
  inputs: NormalizedPropertyInputs,
  op: OperatingAssumptions,
): OperatingCore {
  const missingDrivers: string[] = [];
  const rent = inputs.monthlyRentGross;
  if (!isFinitePositive(rent)) {
    missingDrivers.push('monthlyRentGross');
  }
  /** GPR uses property-level total rent (`monthlyRentGross` × 12). Per-unit rents: sum first. */
  const gprAnnual = isFinitePositive(rent) ? rent * 12 : null;

  const vacancy = clampVacancy(op.vacancyRate);
  const egiAnnual =
    gprAnnual != null ? gprAnnual * (1 - vacancy) : null;

  const fixedAnnual =
    (inputs.annualPropertyTax ?? 0) +
    (inputs.annualInsurance ?? 0) +
    (inputs.annualHoa ?? 0) +
    (inputs.annualOtherOperating ?? 0);

  const hasSomeFixed =
    inputs.annualPropertyTax != null ||
    inputs.annualInsurance != null ||
    inputs.annualHoa != null ||
    inputs.annualOtherOperating != null;

  if (inputs.annualPropertyTax == null) {
    missingDrivers.push('annualPropertyTax');
  }
  if (inputs.annualInsurance == null) {
    missingDrivers.push('annualInsurance');
  }

  const variableFromEgi =
    egiAnnual != null
      ? egiAnnual * (op.maintenancePctOfEgi + op.managementPctOfEgi)
      : null;

  /** Reserve from defaults is per property; multi-unit: switch to per-door reserve when modeled. */
  const capexAnnual = op.capexReserveMonthly * 12;

  const operatingExpenseAnnual =
    egiAnnual != null
      ? fixedAnnual + variableFromEgi! + capexAnnual
      : null;

  const noiAnnual =
    egiAnnual != null && operatingExpenseAnnual != null
      ? egiAnnual - operatingExpenseAnnual
      : null;

  if (!hasSomeFixed && egiAnnual != null) {
    /* still computable with zeros — optional: treat as partial */
  }

  return {
    gprAnnual,
    egiAnnual,
    operatingExpenseAnnual,
    noiAnnual,
    missingDrivers,
  };
}

function clampVacancy(v: number): number {
  if (!Number.isFinite(v) || v < 0) {
    return 0;
  }
  if (v > 0.5) {
    return 0.5;
  }
  return v;
}
