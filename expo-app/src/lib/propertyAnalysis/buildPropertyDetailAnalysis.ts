/**
 * Day-one property detail analysis pipeline.
 * Deal score: weighted categories (cash flow, CoC, cap rate, DSCR, rent efficiency, downside, upside, penalties).
 * Confidence score: source completeness, reliability, freshness, cross-source agreement, assumption burden, outlier checks.
 * Displayed deal score is confidence-capped for safety. Deterministic; null-safe.
 */

import type {
  PropertyAnalysisInput,
  PropertyDetailAnalysis,
  MetricsSummary,
  StrengthItem,
  RiskItem,
  AssumptionItem,
  ExplanationCopy,
  DealScoreCategory,
  ConfidenceCategory,
} from './propertyAnalysisTypes';
import type { DealBand, ConfidenceBand } from './propertyAnalysisTypes';
import {
  dealBandLabel,
  dealBandDescription,
  confidenceBandLabel,
  confidenceBandDescription,
  dealFactorExplanation,
  confidenceFactorExplanation,
  capAppliedCopy,
  INSUFFICIENT_DATA_REASON,
} from './propertyAnalysisCopy';

// ----- Weights (sum = 1); easy to adjust -----

const DEAL_WEIGHTS: Record<DealScoreCategory, number> = {
  cashFlowQuality: 0.18,
  cashOnCashReturn: 0.12,
  capRate: 0.12,
  dscr: 0.15,
  rentEfficiency: 0.10,
  downsideResilience: 0.12,
  upsidePotential: 0.08,
  penalties: 0.13,
};

const CONFIDENCE_WEIGHTS: Record<ConfidenceCategory, number> = {
  sourceCompleteness: 0.22,
  sourceReliability: 0.20,
  freshness: 0.18,
  crossSourceAgreement: 0.15,
  assumptionBurden: 0.15,
  outlierChecks: 0.10,
};

/** Confidence below this (0-100) triggers cap on displayed deal score */
const CONFIDENCE_CAP_THRESHOLD = 50;
/** Max displayed score when confidence is below threshold */
const DISPLAYED_SCORE_CAP = 60;

// ----- Helpers -----

function clamp(value: number, min: number, max: number): number {
  if (value !== value || value === Infinity || value === -Infinity) return min;
  return Math.max(min, Math.min(max, value));
}

/** Linear scale from minValue..maxValue to 0..100. Clamped. */
function scaleLinear(value: number, minValue: number, maxValue: number): number {
  if (minValue >= maxValue) return value <= minValue ? 0 : 100;
  if (value <= minValue) return 0;
  if (value >= maxValue) return 100;
  return clamp((100 * (value - minValue)) / (maxValue - minValue), 0, 100);
}

function sanitizeNum(v: number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

function sanitizeInput(input: PropertyAnalysisInput): PropertyAnalysisInput {
  return {
    ...input,
    purchasePrice: sanitizeNum(input.purchasePrice),
    monthlyRent: sanitizeNum(input.monthlyRent),
    grossScheduledRentAnnual: sanitizeNum(input.grossScheduledRentAnnual),
    operatingExpensesAnnual: sanitizeNum(input.operatingExpensesAnnual),
    vacancyPercent: sanitizeNum(input.vacancyPercent),
    unitCount: sanitizeNum(input.unitCount),
    squareFeet: sanitizeNum(input.squareFeet),
    loanAmount: sanitizeNum(input.loanAmount),
    annualDebtService: sanitizeNum(input.annualDebtService),
    interestRateAnnual: sanitizeNum(input.interestRateAnnual),
    termYears: sanitizeNum(input.termYears),
    downPaymentPercent: sanitizeNum(input.downPaymentPercent),
    closingCosts: sanitizeNum(input.closingCosts),
    capRate: sanitizeNum(input.capRate),
    dscr: sanitizeNum(input.dscr),
    monthlyCashFlow: sanitizeNum(input.monthlyCashFlow),
    annualCashFlow: sanitizeNum(input.annualCashFlow),
    cashOnCashReturn: sanitizeNum(input.cashOnCashReturn),
    expenseRatio: sanitizeNum(input.expenseRatio),
    breakevenOccupancy: sanitizeNum(input.breakevenOccupancy),
    noi: sanitizeNum(input.noi),
    sourceCompleteness: sanitizeNum(input.sourceCompleteness),
    sourceReliability: sanitizeNum(input.sourceReliability),
    freshness: sanitizeNum(input.freshness),
    crossSourceAgreement: sanitizeNum(input.crossSourceAgreement),
    assumptionBurden: sanitizeNum(input.assumptionBurden),
    outlierChecks: sanitizeNum(input.outlierChecks),
    estimatedFieldCount: sanitizeNum(input.estimatedFieldCount),
  };
}

// ----- Annual debt service from loan amount, rate, term (years) -----

function annualDebtServiceFromLoan(
  loanAmount: number | null,
  rateAnnual: number | null,
  termYears: number | null
): number | null {
  if (loanAmount == null || loanAmount <= 0) return null;
  const r = rateAnnual ?? 0.07;
  const n = termYears ?? 30;
  if (r <= 0 || n <= 0) return null;
  const monthlyRate = r / 12;
  const numPayments = n * 12;
  if (monthlyRate >= 1) return null;
  const pmt =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Number.isFinite(pmt) ? pmt * 12 : null;
}

// ----- Derive metrics from raw inputs (simple formulas; no external engine) -----

const DEFAULT_EXPENSE_RATIO_EGI = 0.4;

function deriveMetrics(input: PropertyAnalysisInput): { metrics: MetricsSummary; estimated: Set<keyof MetricsSummary> } {
  const estimated = new Set<keyof MetricsSummary>();
  const price = input.purchasePrice ?? 0;
  const gsr =
    input.grossScheduledRentAnnual ??
    (input.monthlyRent != null ? input.monthlyRent * 12 : null);
  const vacancy = (input.vacancyPercent ?? 5) / 100;
  const egi = gsr != null && gsr > 0 ? gsr * (1 - vacancy) : null;
  let oe = input.operatingExpensesAnnual ?? null;
  if (oe == null && egi != null && egi > 0) {
    oe = egi * DEFAULT_EXPENSE_RATIO_EGI;
    estimated.add('expenseRatio');
  }
  const noi = egi != null && oe != null ? egi - oe : (egi ?? null);
  const loanAmount = input.loanAmount ?? (price > 0 ? price * 0.75 : null);
  const ads =
    input.annualDebtService ??
    annualDebtServiceFromLoan(
      loanAmount,
      input.interestRateAnnual ?? 0.07,
      input.termYears ?? 30
    );
  const monthlyCf = noi != null && ads != null ? (noi - ads) / 12 : null;
  const annualCf = monthlyCf != null ? monthlyCf * 12 : null;
  const dscr = noi != null && ads != null && ads > 0 ? noi / ads : null;
  const capRate = noi != null && price > 0 ? noi / price : null;

  let cashOnCashReturn: number | null = null;
  const downPct = input.downPaymentPercent ?? 25;
  const closing = input.closingCosts ?? (price > 0 ? price * 0.02 : 0);
  const equity = price > 0 ? (price * downPct) / 100 + closing : 0;
  if (annualCf != null && equity > 0) cashOnCashReturn = annualCf / equity;

  const expenseRatio = egi != null && egi > 0 && oe != null ? oe / egi : null;
  let breakevenOccupancy: number | null = null;
  if (gsr != null && gsr > 0 && oe != null && ads != null) {
    const breakEvenIncome = oe + ads;
    breakevenOccupancy = breakEvenIncome / gsr;
  }

  const totalCashToClose = price > 0 ? equity : null;

  if (!input.capRate && capRate != null) estimated.add('capRate');
  if (!input.monthlyCashFlow && monthlyCf != null) estimated.add('monthlyCashFlow');
  if (!input.annualCashFlow && annualCf != null) estimated.add('annualCashFlow');
  if (!input.cashOnCashReturn && cashOnCashReturn != null) estimated.add('cashOnCashReturn');
  if (!input.dscr && dscr != null) estimated.add('dscr');
  if (!input.expenseRatio && expenseRatio != null) estimated.add('expenseRatio');
  if (!input.breakevenOccupancy && breakevenOccupancy != null) estimated.add('breakevenOccupancy');
  if (!input.noi && noi != null) estimated.add('noi');

  const metrics: MetricsSummary = {
    capRate: input.capRate ?? capRate,
    monthlyCashFlow: input.monthlyCashFlow ?? monthlyCf,
    annualCashFlow: input.annualCashFlow ?? annualCf,
    cashOnCashReturn: input.cashOnCashReturn ?? cashOnCashReturn,
    dscr: input.dscr ?? dscr,
    expenseRatio: input.expenseRatio ?? expenseRatio,
    breakevenOccupancy: input.breakevenOccupancy ?? breakevenOccupancy,
    noi: input.noi ?? noi,
    totalCashToClose: totalCashToClose ?? input.purchasePrice ?? null,
    isEstimated: {
      capRate: estimated.has('capRate'),
      monthlyCashFlow: estimated.has('monthlyCashFlow'),
      annualCashFlow: estimated.has('annualCashFlow'),
      cashOnCashReturn: estimated.has('cashOnCashReturn'),
      dscr: estimated.has('dscr'),
      expenseRatio: estimated.has('expenseRatio'),
      breakevenOccupancy: estimated.has('breakevenOccupancy'),
      noi: estimated.has('noi'),
      totalCashToClose: false,
    },
  };
  return { metrics, estimated };
}

// ----- Deal score components (0-100 each) -----

function scoreCashFlowQuality(annualCashFlow: number | null, monthlyCashFlow: number | null): number | null {
  const cf = annualCashFlow ?? (monthlyCashFlow != null ? monthlyCashFlow * 12 : null);
  if (cf == null) return null;
  if (cf <= 0) return 0;
  return clamp((cf / 15000) * 80, 0, 100);
}

function scoreCashOnCashReturn(coc: number | null): number | null {
  if (coc == null) return null;
  if (coc < 0) return 0;
  return clamp(coc * 500, 0, 100);
}

function scoreCapRate(cap: number | null): number | null {
  if (cap == null) return null;
  if (cap < 0) return 0;
  return clamp(cap * 1000, 0, 100);
}

function scoreDscr(d: number | null): number | null {
  if (d == null) return null;
  if (d < 1) return Math.max(0, d * 30);
  if (d >= 2) return 100;
  return clamp(40 + (d - 1) * 60, 0, 100);
}

function scoreRentEfficiency(gsr: number | null, price: number | null): number | null {
  if (gsr == null || price == null || price <= 0) return null;
  const ratio = gsr / price;
  if (ratio <= 0) return 0;
  return clamp(ratio * 1500, 0, 100);
}

function scoreDownsideResilience(breakevenOccupancy: number | null, dscr: number | null): number | null {
  const be = breakevenOccupancy ?? 1;
  const d = dscr ?? 0;
  if (be >= 1) return 0;
  const occScore = (1 - be) * 80;
  const dscrScore = d >= 1.25 ? 100 : d >= 1 ? 60 : Math.max(0, d * 50);
  return clamp((occScore + dscrScore) / 2, 0, 100);
}

function scoreUpsidePotential(capRate: number | null): number | null {
  if (capRate == null) return null;
  if (capRate <= 0) return 0;
  return clamp(capRate * 800, 0, 100);
}

/** Penalty score: 0 = no penalty, 100 = max penalty. We subtract from deal score. */
function scorePenalties(
  monthlyCashFlow: number | null,
  dscr: number | null
): number {
  let p = 0;
  if (monthlyCashFlow != null && monthlyCashFlow < 0) p += 50;
  if (dscr != null && dscr < 1) p += 50;
  return clamp(p, 0, 100);
}

// ----- Confidence components (0-1 input → 0-100) -----

function toConfidenceScore(v: number | null | undefined, defaultVal: number): number {
  if (v == null) return defaultVal;
  const x = clamp(v, 0, 1);
  return x * 100;
}

/** Assumption burden: high burden = low score. Input 0-1 where 1 = heavy burden. */
function toAssumptionBurdenScore(estimatedCount: number | null, burden: number | null): number {
  const count = estimatedCount ?? 0;
  const b = burden ?? 0;
  const fromCount = Math.max(0, 100 - count * 15);
  const fromBurden = 100 - clamp(b, 0, 1) * 100;
  return (fromCount + fromBurden) / 2;
}

// ----- Bands -----

function dealBandFromScore(score: number): DealBand {
  if (score >= 90) return 'exceptional';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 45) return 'fair';
  if (score >= 30) return 'weak';
  return 'poor';
}

function confidenceBandFromScore(score: number): ConfidenceBand {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'veryLow';
}

// ----- Build strengths, risks, assumptions -----

function buildStrengths(
  metrics: MetricsSummary,
  dealBand: DealBand,
  confidenceBand: ConfidenceBand,
  rawDealScore: number | null
): StrengthItem[] {
  const list: StrengthItem[] = [];
  if (confidenceBand === 'high' || confidenceBand === 'medium') {
    list.push({
      id: 'confidence',
      label: `${confidenceBandLabel(confidenceBand)} confidence`,
      description: confidenceBandDescription(confidenceBand),
      category: 'confidence',
    });
  }
  if (rawDealScore != null && rawDealScore >= 55) {
    list.push({
      id: 'deal_score',
      label: dealBandLabel(dealBand),
      description: dealBandDescription(dealBand),
      category: 'cashFlowQuality',
    });
  }
  if (metrics.dscr != null && metrics.dscr >= 1.35) {
    list.push({
      id: 'dscr',
      label: 'Strong DSCR',
      description: `DSCR ${metrics.dscr.toFixed(2)}× supports debt coverage.`,
      category: 'dscr',
    });
  }
  if (metrics.monthlyCashFlow != null && metrics.monthlyCashFlow > 200) {
    list.push({
      id: 'cash_flow',
      label: 'Positive cash flow',
      description: 'Monthly cash flow supports the score.',
      category: 'cashFlowQuality',
    });
  }
  return list;
}

function buildRisks(
  metrics: MetricsSummary,
  wasCapped: boolean,
  rawDealScore: number | null,
  confidenceScore: number
): RiskItem[] {
  const list: RiskItem[] = [];
  if (wasCapped) {
    list.push({
      id: 'confidence_cap',
      label: 'Score capped by low confidence',
      description: capAppliedCopy(rawDealScore ?? 0, DISPLAYED_SCORE_CAP),
      severity: 'medium',
      category: 'assumptionBurden',
    });
  }
  if (rawDealScore == null) {
    list.push({
      id: 'insufficient_data',
      label: 'Insufficient data',
      description: INSUFFICIENT_DATA_REASON,
      severity: 'high',
    });
  } else if (rawDealScore < 45) {
    list.push({
      id: 'low_score',
      label: 'Low deal score',
      description: dealBandDescription(dealBandFromScore(rawDealScore)),
      severity: rawDealScore < 30 ? 'high' : 'medium',
    });
  }
  if (metrics.dscr != null && metrics.dscr < 1.2) {
    list.push({
      id: 'low_dscr',
      label: 'DSCR below typical minimum',
      description: `DSCR ${metrics.dscr.toFixed(2)}× may not meet lender requirements.`,
      severity: metrics.dscr < 1 ? 'high' : 'medium',
      category: 'dscr',
    });
  }
  if (metrics.monthlyCashFlow != null && metrics.monthlyCashFlow < 0) {
    list.push({
      id: 'negative_cf',
      label: 'Negative cash flow',
      description: 'Monthly cash flow is negative. Verify expenses and financing.',
      severity: 'high',
      category: 'cashFlowQuality',
    });
  }
  if (confidenceScore < 40) {
    list.push({
      id: 'low_confidence',
      label: 'Low confidence',
      description: confidenceBandDescription(confidenceBandFromScore(confidenceScore)),
      severity: 'medium',
    });
  }
  return list;
}

function buildAssumptions(input: PropertyAnalysisInput, metrics: MetricsSummary): AssumptionItem[] {
  const list: AssumptionItem[] = [];
  const vac = input.vacancyPercent ?? 5;
  list.push({
    id: 'vacancy',
    label: 'Vacancy',
    value: `${vac}%`,
    source: input.vacancyPercent != null ? 'user' : 'default',
  });
  const down = input.downPaymentPercent ?? 25;
  list.push({
    id: 'down_payment',
    label: 'Down payment',
    value: `${down}%`,
    source: input.downPaymentPercent != null ? 'user' : 'default',
  });
  if (metrics.isEstimated?.capRate) {
    list.push({
      id: 'cap_rate',
      label: 'Cap rate',
      value: metrics.capRate != null ? `${(metrics.capRate * 100).toFixed(1)}%` : '—',
      source: 'estimated',
    });
  }
  if (metrics.isEstimated?.expenseRatio) {
    list.push({
      id: 'expenses',
      label: 'Operating expenses',
      value: metrics.expenseRatio != null ? `${(metrics.expenseRatio * 100).toFixed(0)}% of income` : '—',
      source: 'inferred',
    });
  }
  return list;
}

// ----- Main pipeline -----

export function buildPropertyDetailAnalysis(input: PropertyAnalysisInput): PropertyDetailAnalysis {
  const safe = sanitizeInput(input);
  const { metrics } = deriveMetrics(safe);

  const price = safe.purchasePrice ?? 0;
  const gsr =
    safe.grossScheduledRentAnnual ??
    (safe.monthlyRent != null ? safe.monthlyRent * 12 : null);

  const hasMinimum = price > 0 && (gsr != null && gsr > 0);
  if (!hasMinimum) {
    return {
      rawDealScore: null,
      displayedDealScore: null,
      dealBand: 'insufficientData',
      confidenceScore: 0,
      confidenceBand: 'veryLow',
      strengths: [],
      risks: [
        {
          id: 'insufficient_data',
          label: 'Insufficient data',
          description: INSUFFICIENT_DATA_REASON,
          severity: 'high',
        },
      ],
      assumptions: buildAssumptions(safe, metrics),
      metricsSummary: metrics,
      explanationCopy: {
        dealSummary: INSUFFICIENT_DATA_REASON,
        confidenceSummary: 'Add price, rent, and financing to run analysis.',
        factorExplanations: {},
      },
      wasCappedByConfidence: false,
    };
  }

  // Confidence score (0-100)
  const estCount = safe.estimatedFieldCount ?? 0;
  const confScores: Record<ConfidenceCategory, number> = {
    sourceCompleteness: toConfidenceScore(safe.sourceCompleteness, 0.5),
    sourceReliability: toConfidenceScore(safe.sourceReliability, 0.4),
    freshness: toConfidenceScore(safe.freshness, 0.5),
    crossSourceAgreement: toConfidenceScore(safe.crossSourceAgreement, 0.5),
    assumptionBurden: toAssumptionBurdenScore(estCount, safe.assumptionBurden ?? 0),
    outlierChecks: toConfidenceScore(safe.outlierChecks, 0.5),
  };
  const confidenceScore = clamp(
    Object.entries(CONFIDENCE_WEIGHTS).reduce((sum, [k, w]) => sum + confScores[k as ConfidenceCategory] * w, 0),
    0,
    100
  );
  const confidenceBand = confidenceBandFromScore(confidenceScore);

  // Raw deal score (0-100)
  const cfQuality = scoreCashFlowQuality(metrics.annualCashFlow, metrics.monthlyCashFlow);
  const cocScore = scoreCashOnCashReturn(metrics.cashOnCashReturn);
  const capScore = scoreCapRate(metrics.capRate);
  const dscrScore = scoreDscr(metrics.dscr);
  const rentEff = scoreRentEfficiency(gsr, price);
  const downside = scoreDownsideResilience(metrics.breakevenOccupancy, metrics.dscr);
  const upside = scoreUpsidePotential(metrics.capRate);
  const penaltyScore = scorePenalties(metrics.monthlyCashFlow, metrics.dscr);
  const dealContrib: Record<DealScoreCategory, number> = {
    cashFlowQuality: cfQuality ?? 0,
    cashOnCashReturn: cocScore ?? 0,
    capRate: capScore ?? 0,
    dscr: dscrScore ?? 0,
    rentEfficiency: rentEff ?? 0,
    downsideResilience: downside ?? 0,
    upsidePotential: upside ?? 0,
    penalties: 100 - penaltyScore,
  };
  let rawDealScore = clamp(
    Object.entries(DEAL_WEIGHTS).reduce((sum, [k, w]) => sum + dealContrib[k as DealScoreCategory] * w, 0),
    0,
    100
  );
  const dealBand = dealBandFromScore(rawDealScore);

  const wasCapped =
    confidenceScore < CONFIDENCE_CAP_THRESHOLD && rawDealScore > DISPLAYED_SCORE_CAP;
  const displayedDealScore = wasCapped ? DISPLAYED_SCORE_CAP : rawDealScore;

  const strengths = buildStrengths(metrics, dealBand, confidenceBand, rawDealScore);
  const risks = buildRisks(metrics, wasCapped, rawDealScore, confidenceScore);
  const assumptions = buildAssumptions(safe, metrics);

  const factorExplanations: Record<string, string> = {};
  Object.entries(dealContrib).forEach(([k, score]) => {
    factorExplanations[k] = dealFactorExplanation(k as DealScoreCategory, score);
  });
  Object.entries(confScores).forEach(([k, score]) => {
    factorExplanations[`conf_${k}`] = confidenceFactorExplanation(k as ConfidenceCategory, score);
  });

  const explanationCopy: ExplanationCopy = {
    dealSummary: dealBand === 'insufficientData'
      ? INSUFFICIENT_DATA_REASON
      : `${dealBandLabel(dealBand)} (${Math.round(displayedDealScore ?? 0)}/100). ${dealBandDescription(dealBand)}`,
    confidenceSummary: `${confidenceBandLabel(confidenceBand)} confidence (${Math.round(confidenceScore)}/100). ${confidenceBandDescription(confidenceBand)}`,
    factorExplanations,
  };
  if (wasCapped && rawDealScore != null) {
    explanationCopy.capApplied = capAppliedCopy(rawDealScore, DISPLAYED_SCORE_CAP);
  }

  return {
    rawDealScore,
    displayedDealScore,
    dealBand,
    confidenceScore,
    confidenceBand,
    strengths,
    risks,
    assumptions,
    metricsSummary: metrics,
    explanationCopy,
    wasCappedByConfidence: wasCapped,
  };
}
