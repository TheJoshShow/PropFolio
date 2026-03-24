import type { PropertyRow } from '../../services/portfolio';
import type { PropertyDetailAnalysisInput } from './property_detail_types';

export interface PropertyWhatIfOverrides {
  listPrice?: number;
  rent?: number;
  downPaymentPercent?: number;
  interestRatePercent?: number;
  amortizationTermYears?: number;
  vacancyRatePercent?: number;
  operatingExpenseRatioPercent?: number;
  operatingExpensesAnnual?: number;
  taxesAnnual?: number;
  insuranceAnnual?: number;
  closingCosts?: number;
}

export interface PropertyWhatIfDraft extends PropertyWhatIfOverrides {
  useOverrides: boolean;
}

export const WHAT_IF_DEFAULTS = {
  downPaymentPercent: 25,
  interestRatePercent: 7,
  amortizationTermYears: 30,
  vacancyRatePercent: 5,
  operatingExpenseRatioPercent: 40,
} as const;

export function createInitialWhatIfDraft(row: PropertyRow): PropertyWhatIfDraft {
  return {
    useOverrides: false,
    listPrice: row.list_price ?? undefined,
    rent: row.rent ?? undefined,
    downPaymentPercent: WHAT_IF_DEFAULTS.downPaymentPercent,
    interestRatePercent: WHAT_IF_DEFAULTS.interestRatePercent,
    amortizationTermYears: WHAT_IF_DEFAULTS.amortizationTermYears,
    vacancyRatePercent: WHAT_IF_DEFAULTS.vacancyRatePercent,
    operatingExpenseRatioPercent: WHAT_IF_DEFAULTS.operatingExpenseRatioPercent,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function sanitizeWhatIfDraft(input: PropertyWhatIfDraft): PropertyWhatIfDraft {
  return {
    useOverrides: !!input.useOverrides,
    listPrice: num(input.listPrice) != null ? clamp(num(input.listPrice)!, 1, 50_000_000) : undefined,
    rent: num(input.rent) != null ? clamp(num(input.rent)!, 1, 250_000) : undefined,
    downPaymentPercent:
      num(input.downPaymentPercent) != null ? clamp(num(input.downPaymentPercent)!, 0, 100) : undefined,
    interestRatePercent:
      num(input.interestRatePercent) != null ? clamp(num(input.interestRatePercent)!, 0, 30) : undefined,
    amortizationTermYears:
      num(input.amortizationTermYears) != null ? clamp(num(input.amortizationTermYears)!, 1, 50) : undefined,
    vacancyRatePercent:
      num(input.vacancyRatePercent) != null ? clamp(num(input.vacancyRatePercent)!, 0, 75) : undefined,
    operatingExpenseRatioPercent:
      num(input.operatingExpenseRatioPercent) != null
        ? clamp(num(input.operatingExpenseRatioPercent)!, 0, 95)
        : undefined,
    operatingExpensesAnnual:
      num(input.operatingExpensesAnnual) != null ? clamp(num(input.operatingExpensesAnnual)!, 0, 5_000_000) : undefined,
    taxesAnnual: num(input.taxesAnnual) != null ? clamp(num(input.taxesAnnual)!, 0, 1_000_000) : undefined,
    insuranceAnnual: num(input.insuranceAnnual) != null ? clamp(num(input.insuranceAnnual)!, 0, 1_000_000) : undefined,
    closingCosts: num(input.closingCosts) != null ? clamp(num(input.closingCosts)!, 0, 1_000_000) : undefined,
  };
}

export function buildAnalysisInputWithWhatIf(
  base: PropertyDetailAnalysisInput,
  draft: PropertyWhatIfDraft
): PropertyDetailAnalysisInput {
  const s = sanitizeWhatIfDraft(draft);
  if (!s.useOverrides) return base;
  return {
    ...base,
    listPrice: s.listPrice ?? base.listPrice,
    rent: s.rent ?? base.rent,
    downPaymentPercent: s.downPaymentPercent ?? base.downPaymentPercent,
    interestRateAnnual:
      s.interestRatePercent != null ? s.interestRatePercent / 100 : base.interestRateAnnual,
    amortizationTermYears: s.amortizationTermYears ?? base.amortizationTermYears,
    vacancyRatePercent: s.vacancyRatePercent ?? base.vacancyRatePercent,
    operatingExpenseRatioPercent: s.operatingExpenseRatioPercent ?? base.operatingExpenseRatioPercent,
    operatingExpensesAnnual: s.operatingExpensesAnnual ?? base.operatingExpensesAnnual,
    taxesAnnual: s.taxesAnnual ?? base.taxesAnnual,
    insuranceAnnual: s.insuranceAnnual ?? base.insuranceAnnual,
    closingCosts: s.closingCosts ?? base.closingCosts,
    manualOverrideCount: countOverrides(s),
  };
}

export function countOverrides(draft: PropertyWhatIfDraft): number {
  return (
    [
      draft.listPrice,
      draft.rent,
      draft.downPaymentPercent,
      draft.interestRatePercent,
      draft.amortizationTermYears,
      draft.vacancyRatePercent,
      draft.operatingExpenseRatioPercent,
      draft.operatingExpensesAnnual,
      draft.taxesAnnual,
      draft.insuranceAnnual,
      draft.closingCosts,
    ].filter((v) => typeof v === 'number').length
  );
}
