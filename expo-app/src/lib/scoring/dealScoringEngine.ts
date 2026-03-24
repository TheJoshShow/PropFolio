/**
 * Deal score 0–100 from underwriting/simulation inputs.
 * Matches PropFolio DealScoringEngine; see DEAL-SCORING-SPEC.
 */

import type {
  DealScoreInputs,
  DealScoreResult,
  DealScoreComponent,
  DealScoreFactor,
  DealScoreBand,
} from './types';
import { bandFromScore } from './types';
import {
  insufficientDataReason,
  summary,
} from './dealScoreExplanations';

const WEIGHTS: Record<DealScoreFactor, number> = {
  capRate: 0.12,
  monthlyCashFlow: 0.18,
  annualCashFlow: 0.18,
  cashOnCashReturn: 0.1,
  dscr: 0.12,
  expenseRatio: 0.06,
  vacancySensitivity: 0.06,
  renovationBurden: 0.06,
  purchaseDiscount: 0.05,
  rentCoverageStrength: 0.05,
  dataConfidence: 0.12,
  marketTailwinds: 0.04,
  downsideResilience: 0.04,
};

function formatPercent(d: number): string {
  return `${(d * 100).toFixed(1)}%`;
}
function formatCurrency(d: number): string {
  return `$${Math.round(d)}`;
}

function add(
  components: DealScoreComponent[],
  factor: DealScoreFactor,
  raw: string | null,
  sub: number | null
): void {
  if (sub == null) return;
  const w = WEIGHTS[factor];
  if (w == null) return;
  const contribution = sub * w;
  components.push({ id: factor, rawValue: raw, subScore: sub, weight: w, contribution });
}

/** Human-readable labels for which gating inputs are missing (for UI / dev logs). */
export function listMissingDealScoreRequirements(inputs: DealScoreInputs): string[] {
  const hasProfitability =
    inputs.capRate != null ||
    inputs.monthlyCashFlow != null ||
    inputs.annualCashFlow != null;
  const missing: string[] = [];
  if (!hasProfitability) missing.push('cap rate or cash flow');
  if (inputs.dscr == null) missing.push('DSCR');
  if (inputs.dataConfidence == null) missing.push('data confidence');
  return missing;
}

export function score(inputs: DealScoreInputs): DealScoreResult {
  const components: DealScoreComponent[] = [];

  const cap = inputs.capRate;
  if (cap != null && cap >= 0) {
    const sub = Math.min(100, Math.max(0, cap * 10));
    add(components, 'capRate', formatPercent(cap), sub);
  }

  if (inputs.annualCashFlow != null) {
    const cf = inputs.annualCashFlow;
    const sub = cf <= 0 ? 0 : Math.min(100, (cf / 30000) * 80);
    add(components, 'annualCashFlow', formatCurrency(cf), sub);
  } else if (inputs.monthlyCashFlow != null) {
    const cf = inputs.monthlyCashFlow;
    const sub = cf <= 0 ? 0 : Math.min(100, (cf / 1500) * 80);
    add(components, 'monthlyCashFlow', formatCurrency(cf), sub);
  }

  const coc = inputs.cashOnCashReturn;
  if (coc != null && coc >= 0) {
    add(components, 'cashOnCashReturn', formatPercent(coc), Math.min(100, Math.max(0, coc * 10)));
  }

  const d = inputs.dscr;
  if (d != null) {
    const sub =
      d < 1 ? 0 : d >= 2 ? 100 : d <= 1.25 ? 20 + (d - 1) * 120 : d <= 1.5 ? 50 + (d - 1.25) * 100 : 75 + (d - 1.5) * 100;
    add(components, 'dscr', `${d.toFixed(2)}×`.replace('.00×', '×'), Math.min(100, Math.max(0, sub)));
  }

  const e = inputs.expenseRatio;
  if (e != null && e >= 0) {
    const sub = e <= 0.3 ? 100 : e >= 0.7 ? 0 : 100 - ((e - 0.3) / 0.4) * 100;
    add(components, 'expenseRatio', formatPercent(e), Math.min(100, Math.max(0, sub)));
  }

  const b = inputs.breakevenOccupancy;
  if (b != null && b >= 0) {
    const sub = b >= 1 ? 0 : b <= 0.6 ? 100 : ((1 - b) / 0.4) * 100;
    add(components, 'vacancySensitivity', formatPercent(b), Math.min(100, Math.max(0, sub)));
  }

  const r = inputs.renovationBurdenRatio;
  if (r != null && r >= 0) {
    const sub = r <= 0 ? 100 : r >= 0.2 ? 0 : 100 - (r / 0.2) * 100;
    add(components, 'renovationBurden', formatPercent(r), Math.min(100, Math.max(0, sub)));
  }

  const pd = inputs.purchaseDiscountVsValue;
  if (pd != null && pd >= 0) {
    add(components, 'purchaseDiscount', formatPercent(pd), Math.min(100, (pd / 0.2) * 100));
  }

  const rc = inputs.rentCoverageStrength;
  if (rc != null && rc >= 0) {
    const sub = rc <= 1 ? 0 : rc >= 2 ? 100 : (rc - 1) * 100;
    add(components, 'rentCoverageStrength', `${rc.toFixed(2)}×`, Math.min(100, Math.max(0, sub)));
  }

  const c = inputs.dataConfidence;
  if (c != null && c >= 0) {
    add(components, 'dataConfidence', formatPercent(c), Math.min(100, Math.max(0, c * 100)));
  }

  const t = inputs.marketTailwinds;
  if (t != null && t >= 0) {
    const sub = t <= 1 ? t * 100 : Math.min(100, t);
    add(components, 'marketTailwinds', `${Math.round(sub)}`, sub);
  }

  const s = inputs.stressDSCR;
  if (s != null && s >= 0) {
    const sub = s < 1 ? 0 : s >= 1.25 ? 100 : 50 + (s - 1) * 200;
    add(components, 'downsideResilience', `${s.toFixed(2)}×`, Math.min(100, Math.max(0, sub)));
  }

  const hasProfitability =
    inputs.capRate != null ||
    inputs.monthlyCashFlow != null ||
    inputs.annualCashFlow != null;
  const hasRequired =
    inputs.dscr != null && inputs.dataConfidence != null && hasProfitability;

  if (!hasRequired) {
    return {
      totalScore: null,
      band: 'insufficientData',
      components,
      wasCappedByConfidence: false,
      explanationSummary: insufficientDataReason(),
    };
  }

  const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0);
  if (totalWeight <= 0) {
    return {
      totalScore: null,
      band: 'insufficientData',
      components,
      wasCappedByConfidence: false,
      explanationSummary: insufficientDataReason(),
    };
  }

  let rawTotal = components.reduce((sum, comp) => sum + comp.contribution, 0) / totalWeight;
  const confidenceSub = components.find((x) => x.id === 'dataConfidence')?.subScore ?? 0;
  let wasCapped = false;
  if (confidenceSub < 50 && rawTotal > 60) {
    rawTotal = 60;
    wasCapped = true;
  }

  const totalScore = Math.min(100, Math.max(0, rawTotal));
  const band = bandFromScore(totalScore);

  return {
    totalScore,
    band,
    components,
    wasCappedByConfidence: wasCapped,
    explanationSummary: summary(components, totalScore, band, wasCapped),
  };
}

export type { DealScoreInputs, DealScoreResult, DealScoreBand, DealScoreFactor } from './types';
