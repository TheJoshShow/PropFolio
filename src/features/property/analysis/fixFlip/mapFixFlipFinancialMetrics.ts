import { formatCalculatedMetric } from '@/features/property/detail/formatCalculatedMetric';
import { loanAmountFromLtv } from '@/scoring';
import type { ScoreBreakdown } from '@/scoring';
import { formatCurrency, type PropertyRow } from '@/types/property';

/**
 * Deterministic display policy for MAO / flip ROI until a dedicated flip/valuation module exists.
 * All $ math stays in this adapter — UI only renders strings.
 */
export const FIX_FLIP_DISPLAY_DEFAULTS = {
  /** Selling + transfer costs as % of ARV (commissions, fees). */
  MAO_SELLING_COST_PCT_OF_ARV: 0.06,
  /** Target profit margin as % of ARV (residual to investor after sale). */
  MAO_TARGET_PROFIT_PCT_OF_ARV: 0.15,
} as const;

export type FixFlipMetricDisplay = {
  label: string;
  value: string;
  valueDetail?: string;
};

function metricMap(breakdown: ScoreBreakdown) {
  return new Map(breakdown.primaryMetrics.map((m) => [m.key, m] as const));
}

/** Prefer scored ARV metric; fall back to effective ARV input when metric is insufficient. */
function arvNumeric(breakdown: ScoreBreakdown): number | null {
  const m = metricMap(breakdown).get('arv');
  if (m?.availability === 'ok' && m.value != null && Number.isFinite(m.value) && m.value > 0) {
    return m.value;
  }
  const a = breakdown.effectiveInputs.arv;
  if (a != null && Number.isFinite(a) && a > 0) {
    return a;
  }
  return null;
}

/**
 * MAO = ARV × (1 − selling% − profit%) − rehab. Clamped: returns null if non-positive or inputs missing.
 */
export function resolveMaximumAllowableOffer(breakdown: ScoreBreakdown): number | null {
  const arv = arvNumeric(breakdown);
  const rehab = breakdown.effectiveInputs.rehabBudget ?? 0;
  if (arv == null || arv <= 0 || !Number.isFinite(rehab) || rehab < 0) {
    return null;
  }
  const { MAO_SELLING_COST_PCT_OF_ARV, MAO_TARGET_PROFIT_PCT_OF_ARV } = FIX_FLIP_DISPLAY_DEFAULTS;
  const residualMult = 1 - MAO_SELLING_COST_PCT_OF_ARV - MAO_TARGET_PROFIT_PCT_OF_ARV;
  if (residualMult <= 0) {
    return null;
  }
  const mao = arv * residualMult - rehab;
  if (!Number.isFinite(mao) || mao <= 0) {
    return null;
  }
  return mao;
}

/**
 * Simplified flip ROI: (net sale proceeds − purchase − rehab) / (purchase + rehab).
 * Net sale = ARV × (1 − selling%). Null if denominator ≤ 0 or ARV missing.
 */
export function resolveFlipRoiRatio(breakdown: ScoreBreakdown): number | null {
  const arv = arvNumeric(breakdown);
  const purchase = breakdown.effectiveInputs.purchasePrice;
  const rehab = breakdown.effectiveInputs.rehabBudget ?? 0;
  if (
    arv == null ||
    arv <= 0 ||
    purchase == null ||
    !Number.isFinite(purchase) ||
    purchase <= 0 ||
    !Number.isFinite(rehab) ||
    rehab < 0
  ) {
    return null;
  }
  const selling = FIX_FLIP_DISPLAY_DEFAULTS.MAO_SELLING_COST_PCT_OF_ARV;
  const netSale = arv * (1 - selling);
  const basis = purchase + rehab;
  if (basis <= 0) {
    return null;
  }
  const profit = netSale - basis;
  return profit / basis;
}

export function formatFlipRoiPercent(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) {
    return '—';
  }
  return `${(ratio * 100).toFixed(1)}%`;
}

export function resolveLoanToCostRatio(breakdown: ScoreBreakdown): number | null {
  const purchase = breakdown.effectiveInputs.purchasePrice;
  if (purchase == null || !Number.isFinite(purchase) || purchase <= 0) {
    return null;
  }
  const rehab = breakdown.effectiveInputs.rehabBudget ?? 0;
  if (!Number.isFinite(rehab) || rehab < 0) {
    return null;
  }
  const cost = purchase + rehab;
  if (cost <= 0) {
    return null;
  }
  const fin = breakdown.effectiveFinancing;
  const loan = loanAmountFromLtv(purchase, fin.loanToValue);
  if (loan == null || loan <= 0) {
    return null;
  }
  return loan / cost;
}

export function formatLtvPercent(breakdown: ScoreBreakdown): string {
  const ltv = breakdown.effectiveFinancing.loanToValue;
  if (typeof ltv !== 'number' || !Number.isFinite(ltv) || ltv <= 0 || ltv > 1) {
    return '—';
  }
  return `${(ltv * 100).toFixed(0)}%`;
}

export function formatLtcPercent(breakdown: ScoreBreakdown): string {
  const ltc = resolveLoanToCostRatio(breakdown);
  if (ltc == null || !Number.isFinite(ltc)) {
    return '—';
  }
  return `${(ltc * 100).toFixed(1)}%`;
}

/** Optional DOM from normalized scoringInputs (future: listing provider field). */
export function formatDaysOnMarket(property: PropertyRow): string {
  const raw = property.snapshot?.scoringInputs?.daysOnMarket;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return `${Math.round(raw)} days`;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) {
      return `${Math.round(n)} days`;
    }
  }
  return '—';
}

export function buildFixFlipPrimaryRows(
  breakdown: ScoreBreakdown,
  property: PropertyRow,
): FixFlipMetricDisplay[] {
  const byKey = metricMap(breakdown);
  const arvMetric = byKey.get('arv');
  const arvN = arvNumeric(breakdown);
  const arvStr =
    arvMetric?.availability === 'ok' && arvMetric.value != null && Number.isFinite(arvMetric.value)
      ? formatCalculatedMetric(arvMetric)
      : arvN != null
        ? formatCurrency(arvN)
        : '—';

  const mao = resolveMaximumAllowableOffer(breakdown);
  const roi = resolveFlipRoiRatio(breakdown);
  const domStr = formatDaysOnMarket(property);

  return [
    {
      label: 'After Repair Value (ARV)',
      value: arvStr,
    },
    {
      label: 'Maximum Allowable Offer (MAO)',
      value: mao != null ? formatCurrency(mao) : '—',
      valueDetail: mao == null ? 'Needs ARV (rehab defaults to $0 if unset)' : undefined,
    },
    {
      label: 'Return On Investment (ROI)',
      value: formatFlipRoiPercent(roi),
      valueDetail: roi == null ? 'Needs ARV, purchase price, and rehab' : undefined,
    },
    {
      label: 'Days on Market (DOM)',
      value: domStr,
      valueDetail: domStr === '—' ? 'Not in import — optional scoringInputs.daysOnMarket' : undefined,
    },
  ];
}

export function buildFixFlipSecondaryRows(breakdown: ScoreBreakdown): FixFlipMetricDisplay[] {
  return [
    {
      label: 'Loan-To-Value (LTV)',
      value: formatLtvPercent(breakdown),
    },
    {
      label: 'Loan-To-Cost (LTC)',
      value: formatLtcPercent(breakdown),
    },
  ];
}
