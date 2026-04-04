import { formatCalculatedMetric } from '@/features/property/detail/formatCalculatedMetric';
import { cashInvestedAtClose, loanAmountFromLtv } from '@/scoring';
import type { CalculatedMetric, ScoreBreakdown } from '@/scoring';
import { formatCurrency } from '@/types/property';

function metricMap(breakdown: ScoreBreakdown): Map<string, CalculatedMetric> {
  return new Map(breakdown.primaryMetrics.map((m) => [m.key, m]));
}

/**
 * Total cash invested at close — mirrors primary-metrics financing path (down + closing + rehab).
 */
export function resolveTotalCashInvested(breakdown: ScoreBreakdown): number | null {
  const p = breakdown.effectiveInputs.purchasePrice;
  if (p == null || !Number.isFinite(p) || p <= 0) {
    return null;
  }
  const fin = breakdown.effectiveFinancing;
  const loan = loanAmountFromLtv(p, fin.loanToValue);
  if (loan == null) {
    return null;
  }
  const rehab = breakdown.effectiveInputs.rehabBudget ?? 0;
  if (rehab < 0) {
    return null;
  }
  return cashInvestedAtClose({
    purchasePrice: p,
    loanPrincipal: loan,
    closingCostPctOfLoan: fin.closingCostPctOfLoan,
    rehabBudget: rehab,
  });
}

/**
 * Months (or years) to recover cash invested from positive levered cash flow.
 */
export function formatBreakEvenTime(
  breakdown: ScoreBreakdown,
  totalCashInvested: number | null,
): string {
  if (totalCashInvested == null || totalCashInvested <= 0) {
    return '—';
  }
  const cfAnnual = breakdown.primaryMetrics.find((m) => m.key === 'cash_flow_annual')?.value;
  if (cfAnnual == null || !Number.isFinite(cfAnnual) || cfAnnual <= 0) {
    return 'Not available';
  }
  const monthly = cfAnnual / 12;
  if (monthly <= 0 || !Number.isFinite(monthly)) {
    return 'Not available';
  }
  const months = totalCashInvested / monthly;
  if (!Number.isFinite(months) || months <= 0) {
    return '—';
  }
  if (months > 600) {
    return 'Not available';
  }
  if (months >= 18) {
    return `${(months / 12).toFixed(1)} yrs`;
  }
  return `${Math.round(months)} mo`;
}

export function formatRentPerSqFt(breakdown: ScoreBreakdown): string {
  const rent = breakdown.effectiveInputs.monthlyRentGross;
  const sqft = breakdown.effectiveInputs.sqft;
  if (
    rent == null ||
    !Number.isFinite(rent) ||
    rent <= 0 ||
    sqft == null ||
    !Number.isFinite(sqft) ||
    sqft <= 0
  ) {
    return '—';
  }
  return `${formatCurrency(rent / sqft)} / sq ft / mo`;
}

export type BuyHoldMetricDisplay = {
  label: string;
  value: string;
  valueDetail?: string;
};

function formatMetricOrPlaceholder(m: CalculatedMetric | undefined, formatFn: (x: CalculatedMetric) => string): string {
  if (!m || m.availability !== 'ok' || m.value == null || !Number.isFinite(m.value)) {
    return '—';
  }
  return formatFn(m);
}

/** Primary rows for Buy & Hold financial card (ordered). */
export function buildBuyHoldPrimaryRows(breakdown: ScoreBreakdown): BuyHoldMetricDisplay[] {
  const byKey = metricMap(breakdown);
  const invested = resolveTotalCashInvested(breakdown);

  const cap = byKey.get('cap_rate');
  const noi = byKey.get('noi_annual');
  const coc = byKey.get('cash_on_cash');
  const cf = byKey.get('cash_flow_annual');

  const cashFlowDetail =
    cf?.availability === 'ok' && cf.value != null && Number.isFinite(cf.value)
      ? `≈ ${formatCurrency(cf.value / 12)}/mo levered`
      : undefined;

  return [
    {
      label: 'Total Cash Invested',
      value: invested != null && Number.isFinite(invested) ? formatCurrency(invested) : '—',
    },
    {
      label: 'CAP Rate',
      value: formatMetricOrPlaceholder(cap, formatCalculatedMetric),
    },
    {
      label: 'NOI',
      value: formatMetricOrPlaceholder(noi, formatCalculatedMetric),
    },
    {
      label: 'Cash-On-Cash Return',
      value: formatMetricOrPlaceholder(coc, formatCalculatedMetric),
    },
    {
      label: 'Cash Flow',
      value: formatMetricOrPlaceholder(cf, formatCalculatedMetric),
      valueDetail: cashFlowDetail,
    },
  ];
}

/** Secondary rows shown when “Show More Metrics” is expanded. */
export function buildBuyHoldSecondaryRows(breakdown: ScoreBreakdown): BuyHoldMetricDisplay[] {
  const byKey = metricMap(breakdown);
  const grm = byKey.get('gross_rent_multiplier_hint');
  const dscr = byKey.get('dscr');
  const invested = resolveTotalCashInvested(breakdown);

  return [
    {
      label: 'Gross Rent Multiplier (GRM)',
      value: formatMetricOrPlaceholder(grm, formatCalculatedMetric),
    },
    {
      label: 'Debt Service Coverage Ratio (DSCR)',
      value: formatMetricOrPlaceholder(dscr, formatCalculatedMetric),
    },
    {
      label: 'Break-Even Time',
      value: formatBreakEvenTime(breakdown, invested),
    },
    {
      label: 'Rent/SQ.FT',
      value: formatRentPerSqFt(breakdown),
    },
  ];
}
