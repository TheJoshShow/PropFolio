import type { ScoreBreakdown } from '@/scoring';
import { formatCurrency, type PropertyRow } from '@/types/property';

export type AnalysisSummaryRow = {
  label: string;
  value: string;
};

/**
 * Data-driven summary rows for the analysis shell. Safe with partial snapshot / missing breakdown.
 */
export function buildPropertyAnalysisSummary(
  property: PropertyRow,
  breakdown: ScoreBreakdown | null,
): AnalysisSummaryRow[] {
  const snap = property.snapshot;
  const eff = breakdown?.effectiveInputs ?? null;

  const fullAddress =
    property.formatted_address?.trim() ||
    snap?.address?.formatted?.trim() ||
    '—';

  const propertyTypeRaw =
    eff?.propertyType?.trim() ||
    snap?.structure?.propertyType?.trim() ||
    '';
  const propertyType = propertyTypeRaw.length > 0 ? propertyTypeRaw : '—';

  const units =
    eff != null && typeof eff.unitCount === 'number' && eff.unitCount > 0
      ? String(eff.unitCount)
      : '—';

  const sqftRaw = eff?.sqft ?? snap?.structure?.sqft ?? null;
  const sqft =
    sqftRaw != null && Number.isFinite(sqftRaw) && sqftRaw > 0
      ? `${Math.round(sqftRaw).toLocaleString()} sq ft`
      : '—';

  const rentMonthly =
    eff?.monthlyRentGross ??
    (snap?.financials?.rentEstimateMonthly != null &&
    Number.isFinite(snap.financials.rentEstimateMonthly)
      ? snap.financials.rentEstimateMonthly
      : null);
  const estTotalRentMonthly =
    rentMonthly != null && Number.isFinite(rentMonthly) ? `${formatCurrency(rentMonthly)}/mo` : '—';

  const purchaseRaw =
    eff?.purchasePrice ??
    snap?.financials?.lastSalePrice ??
    snap?.financials?.assessedValueLatest ??
    null;
  const purchase =
    purchaseRaw != null && Number.isFinite(purchaseRaw) ? formatCurrency(purchaseRaw) : '—';

  const dsAnnual = breakdown?.primaryMetrics.find((m) => m.key === 'debt_service_annual')?.value;
  const mortgage =
    dsAnnual != null && Number.isFinite(dsAnnual) && dsAnnual > 0
      ? `${formatCurrency(dsAnnual / 12)}/mo`
      : '—';

  return [
    { label: 'Full Address', value: fullAddress },
    { label: 'Property Type', value: propertyType },
    { label: 'Number of Units', value: units },
    { label: 'Square Footage', value: sqft },
    { label: 'Estimated Total Rent', value: estTotalRentMonthly },
    { label: 'Purchase Price', value: purchase },
    { label: 'Estimated Mortgage', value: mortgage },
  ];
}
