import {
  portfolioScoreLabel,
  portfolioScoreLabelColor,
  portfolioScoreTier,
  type PortfolioScoreTier,
} from '@/lib/portfolioScorePresentation';
import { scoringEngine } from '@/services/scoring';
import type { ScoreBreakdown } from '@/scoring';
import { formatCurrency, type PropertyRow } from '@/types/property';

export type PortfolioPropertyListItem = {
  id: string;
  address: string;
  rentLabel: string;
  priceLabel: string;
  /** Numeric confidence for ScoreBadge; null → em dash in badge */
  scoreValue: number | null;
  scoreTier: PortfolioScoreTier;
  scoreLabel: string;
  scoreLabelColor: string;
  metricPreviewLabel: string;
  metricPreviewValue: string;
  status: PropertyRow['status'];
};

export type PortfolioAggregateStats = {
  propertyCount: number;
  /** Sum of last sale or assessed value where present */
  totalEstimatedValue: number | null;
  /** Sum of monthly levered cash flow where computable */
  estimatedMonthlyCashFlow: number | null;
  /** How many rows contributed to cash flow sum */
  cashFlowSampleCount: number;
};

function rowTitle(p: PropertyRow): string {
  return p.formatted_address?.trim() || p.snapshot?.address?.formatted || 'Property';
}

function metricPreview(breakdown: ScoreBreakdown): { label: string; value: string } {
  const cap = breakdown.primaryMetrics.find((m) => m.key === 'cap_rate')?.value;
  if (cap != null && Number.isFinite(cap)) {
    return { label: 'Cap rate', value: `${(cap * 100).toFixed(1)}%` };
  }
  const dscr = breakdown.primaryMetrics.find((m) => m.key === 'dscr')?.value;
  if (dscr != null && Number.isFinite(dscr)) {
    return { label: 'DSCR', value: `${dscr.toFixed(2)}×` };
  }
  const noi = breakdown.primaryMetrics.find((m) => m.key === 'noi_annual')?.value;
  if (noi != null && Number.isFinite(noi)) {
    return { label: 'NOI / yr', value: formatCurrency(noi) };
  }
  return { label: 'Cap rate', value: '—' };
}

function estimatedValue(p: PropertyRow): number | null {
  const f = p.snapshot?.financials;
  const v = f?.lastSalePrice ?? f?.assessedValueLatest;
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
    return v;
  }
  return null;
}

/**
 * Single pass: deterministic scores per row + list view models + aggregates.
 */
export function buildPortfolioView(properties: PropertyRow[]): {
  items: PortfolioPropertyListItem[];
  stats: PortfolioAggregateStats;
} {
  let valueSum = 0;
  let valueCount = 0;
  let cfMonthlySum = 0;
  let cfCount = 0;

  const items: PortfolioPropertyListItem[] = properties.map((p) => {
    const breakdown = scoringEngine.computeFromSnapshot(p.snapshot);
    const conf = breakdown.confidence.score;

    const ev = estimatedValue(p);
    if (ev != null) {
      valueSum += ev;
      valueCount += 1;
    }

    const cfAnnual = breakdown.primaryMetrics.find((m) => m.key === 'cash_flow_annual')?.value;
    if (typeof cfAnnual === 'number' && Number.isFinite(cfAnnual)) {
      cfMonthlySum += cfAnnual / 12;
      cfCount += 1;
    }

    const rent = p.snapshot?.financials?.rentEstimateMonthly;
    const price = p.snapshot?.financials?.lastSalePrice ?? p.snapshot?.financials?.assessedValueLatest;
    const tier = portfolioScoreTier(Number.isFinite(conf) ? conf : null, p.status);
    const preview = metricPreview(breakdown);

    return {
      id: p.id,
      address: rowTitle(p),
      rentLabel: rent != null && Number.isFinite(rent) ? `${formatCurrency(rent)}/mo` : '—',
      priceLabel: price != null && Number.isFinite(price) ? formatCurrency(price) : '—',
      scoreValue: Number.isFinite(conf) ? conf : null,
      scoreTier: tier,
      scoreLabel: portfolioScoreLabel(tier),
      scoreLabelColor: portfolioScoreLabelColor(tier),
      metricPreviewLabel: preview.label,
      metricPreviewValue: preview.value,
      status: p.status,
    };
  });

  return {
    items,
    stats: {
      propertyCount: properties.length,
      totalEstimatedValue: valueCount > 0 ? valueSum : null,
      estimatedMonthlyCashFlow: cfCount > 0 ? cfMonthlySum : null,
      cashFlowSampleCount: cfCount,
    },
  };
}
