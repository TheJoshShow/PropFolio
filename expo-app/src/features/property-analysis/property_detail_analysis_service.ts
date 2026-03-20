/**
 * Property detail analysis: one entry point to run simulation → confidence → deal score
 * and return a single result for the property detail screen.
 * Uses existing engines without modifying them.
 * See docs/property_detail_engine_audit.md and docs/score_breakdown_contract.md.
 */

import { run as runSimulation } from '../../lib/simulation/simulationEngine';
import type { SimulationInputs } from '../../lib/simulation/types';
import { evaluate as evaluateConfidence } from '../../lib/confidence/confidenceMeterEngine';
import type { ConfidenceMeterInputs } from '../../lib/confidence/types';
import { score as scoreDeal } from '../../lib/scoring/dealScoringEngine';
import { fromSimulationResult as dealScoreInputsFromSimulation } from '../../lib/scoring/dealScoreInputsFromSimulation';
import type {
  PropertyDetailAnalysisInput,
  PropertyDetailAnalysisResult,
  DealScoreBreakdown,
  ConfidenceScoreBreakdown,
  KeyMetricsSummary,
  RiskFlag,
  StrengthFlag,
  AssumptionItem,
} from './property_detail_types';

// ----- Defaults (inferred when not provided) -----

const DEFAULT_DOWN_PAYMENT_PERCENT = 25;
const DEFAULT_INTEREST_RATE_ANNUAL = 0.07;
const DEFAULT_AMORTIZATION_YEARS = 30;
const DEFAULT_VACANCY_RATE_PERCENT = 5;
const DEFAULT_EXPENSE_RATIO_EGI = 0.4; // 40% of EGI
const DEFAULT_CLOSING_COSTS_PERCENT = 0.02; // 2% of price

function sanitizeNum(v: number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

/**
 * Build SimulationInputs from property detail input with sensible defaults.
 */
function toSimulationInputs(input: PropertyDetailAnalysisInput): SimulationInputs {
  const price = sanitizeNum(input.listPrice);
  const rent = sanitizeNum(input.rent);
  const units = input.unitCount != null && input.unitCount > 0 ? input.unitCount : 1;
  const downPct = sanitizeNum(input.downPaymentPercent) ?? DEFAULT_DOWN_PAYMENT_PERCENT;
  const rate = sanitizeNum(input.interestRateAnnual) ?? DEFAULT_INTEREST_RATE_ANNUAL;
  const termYears = sanitizeNum(input.amortizationTermYears) ?? DEFAULT_AMORTIZATION_YEARS;
  const vacancyPct = sanitizeNum(input.vacancyRatePercent) ?? DEFAULT_VACANCY_RATE_PERCENT;

  let closingCosts: number | null = sanitizeNum(input.closingCosts);
  if (closingCosts == null && price != null && price > 0) {
    closingCosts = price * DEFAULT_CLOSING_COSTS_PERCENT;
  }

  // Monthly rent: rent is treated as total monthly (e.g. single unit) or per-unit depending on context.
  // We treat input.rent as total monthly when unitCount is 1; otherwise per-unit.
  const monthlyRentPerUnit =
    rent != null && units >= 1 ? (units === 1 ? rent : rent / units) : null;

  // Operating expenses: if provided use it; else estimate as % of EGI.
  let taxesAnnual: number | null = null;
  let insuranceAnnual: number | null = null;
  let propertyManagementAnnual: number | null = null;
  let repairsAndMaintenanceAnnual: number | null = null;
  let utilitiesAnnual: number | null = null;
  let capitalReservesAnnual: number | null = null;

  const operatingExpensesOverride = sanitizeNum(input.operatingExpensesAnnual);
  if (operatingExpensesOverride != null && operatingExpensesOverride >= 0) {
    repairsAndMaintenanceAnnual = operatingExpensesOverride;
  } else if (rent != null && rent > 0) {
    const egiApprox = rent * 12 * (1 - vacancyPct / 100);
    const oe = egiApprox * DEFAULT_EXPENSE_RATIO_EGI;
    repairsAndMaintenanceAnnual = oe;
  }

  return {
    purchasePrice: price ?? undefined,
    downPaymentPercent: downPct,
    downPaymentAmount: undefined,
    interestRateAnnual: rate,
    amortizationTermYears: termYears,
    closingCosts: closingCosts ?? undefined,
    monthlyRentPerUnit: monthlyRentPerUnit ?? undefined,
    unitCount: units,
    vacancyRatePercent: vacancyPct,
    otherIncomeAnnual: undefined,
    squareFeet: input.sqft ?? undefined,
    taxesAnnual: taxesAnnual ?? undefined,
    insuranceAnnual: insuranceAnnual ?? undefined,
    propertyManagementAnnual: propertyManagementAnnual ?? undefined,
    repairsAndMaintenanceAnnual: repairsAndMaintenanceAnnual ?? undefined,
    utilitiesAnnual: utilitiesAnnual ?? undefined,
    capitalReservesAnnual: capitalReservesAnnual ?? undefined,
  };
}

/**
 * Build ConfidenceMeterInputs from property + analysis context.
 * Uses completeness heuristics and rent/expense presence.
 */
function toConfidenceInputs(
  input: PropertyDetailAnalysisInput,
  hasRent: boolean,
  hasExpenses: boolean
): ConfidenceMeterInputs {
  const hasPrice = input.listPrice != null && input.listPrice > 0;
  const hasUnits = (input.unitCount ?? 0) > 0;
  const hasSqft = input.sqft != null && input.sqft > 0;
  const completeness =
    [hasPrice, hasRent, hasUnits, hasSqft].filter(Boolean).length / 4;
  const rentConfidence = hasRent ? 0.6 : 0.2;
  const expenseConfidence = hasExpenses ? 0.5 : 0.3;
  const overrideCount = input.manualOverrideCount ?? 0;

  return {
    propertyDataCompleteness: completeness,
    rentEstimateConfidence: rentConfidence,
    expenseAssumptionsConfidence: expenseConfidence,
    renovationBudgetCertainty: null,
    financingAssumptionsStability: 0.5,
    marketDataReliabilityFreshness: 0.4,
    manualOverrideCount: overrideCount,
  };
}

/**
 * Build risk and strength flags from deal and confidence results.
 */
function buildFlags(
  dealScore: DealScoreBreakdown,
  confidence: ConfidenceScoreBreakdown
): { risks: RiskFlag[]; strengths: StrengthFlag[] } {
  const risks: RiskFlag[] = [];
  const strengths: StrengthFlag[] = [];

  if (dealScore.wasCappedByConfidence) {
    risks.push({
      id: 'low_confidence_cap',
      label: 'Score capped by low data confidence',
      description: 'Improve data quality to unlock a higher score.',
      severity: 'medium',
    });
  }
  if (dealScore.totalScore != null && dealScore.totalScore < 45) {
    risks.push({
      id: 'low_deal_score',
      label: 'Deal score is below 45',
      description: dealScore.explanationSummary,
      severity: dealScore.totalScore < 30 ? 'high' : 'medium',
    });
  }
  if (confidence.band === 'low' || confidence.band === 'veryLow') {
    risks.push({
      id: 'low_confidence',
      label: `Confidence is ${confidence.band}`,
      description: confidence.explanation.summary,
      severity: confidence.band === 'veryLow' ? 'high' : 'medium',
    });
  }
  if (dealScore.band === 'insufficientData') {
    risks.push({
      id: 'insufficient_data',
      label: 'Insufficient data to score',
      description: dealScore.explanationSummary,
      severity: 'medium',
    });
  }

  if (confidence.band === 'high' || confidence.band === 'medium') {
    strengths.push({
      id: 'confidence_ok',
      label: `Analysis is ${confidence.band} confidence`,
      description: confidence.explanation.summary,
    });
  }
  if (dealScore.totalScore != null && dealScore.totalScore >= 60 && !dealScore.wasCappedByConfidence) {
    strengths.push({
      id: 'solid_score',
      label: `Deal score ${Math.round(dealScore.totalScore)}`,
      description: dealScore.explanationSummary,
    });
  }

  return { risks, strengths };
}

/**
 * Build assumptions list from what we defaulted or inferred.
 */
function buildAssumptions(input: PropertyDetailAnalysisInput): AssumptionItem[] {
  const list: AssumptionItem[] = [];
  const downPct = sanitizeNum(input.downPaymentPercent) ?? DEFAULT_DOWN_PAYMENT_PERCENT;
  const rate = sanitizeNum(input.interestRateAnnual) ?? DEFAULT_INTEREST_RATE_ANNUAL;
  const term = sanitizeNum(input.amortizationTermYears) ?? DEFAULT_AMORTIZATION_YEARS;
  const vacancy = sanitizeNum(input.vacancyRatePercent) ?? DEFAULT_VACANCY_RATE_PERCENT;

  list.push({
    id: 'down_payment',
    label: 'Down payment',
    value: `${downPct}%`,
    source: input.downPaymentPercent != null ? 'user' : 'default',
  });
  list.push({
    id: 'interest_rate',
    label: 'Interest rate',
    value: `${(rate * 100).toFixed(1)}%`,
    source: input.interestRateAnnual != null ? 'user' : 'default',
  });
  list.push({
    id: 'term',
    label: 'Loan term',
    value: `${term} years`,
    source: input.amortizationTermYears != null ? 'user' : 'default',
  });
  list.push({
    id: 'vacancy',
    label: 'Vacancy',
    value: `${vacancy}%`,
    source: input.vacancyRatePercent != null ? 'user' : 'default',
  });
  list.push({
    id: 'expense_ratio',
    label: 'Operating expenses',
    value: `${(DEFAULT_EXPENSE_RATIO_EGI * 100).toFixed(0)}% of gross income`,
    source: input.operatingExpensesAnnual != null ? 'user' : 'inferred',
  });
  return list;
}

/**
 * Single entry point: run full analysis and return result for property detail UI.
 * Deterministic; safe for tests.
 */
export function runPropertyDetailAnalysis(
  input: PropertyDetailAnalysisInput
): PropertyDetailAnalysisResult {
  const simInputs = toSimulationInputs(input);
  const simResult = runSimulation(simInputs);
  const underwriting = simResult.underwriting;

  const hasRent = input.rent != null && input.rent > 0;
  const hasExpenses =
    input.operatingExpensesAnnual != null && input.operatingExpensesAnnual >= 0;
  const confidenceInputs = toConfidenceInputs(input, hasRent, hasExpenses);
  const confidenceResult = evaluateConfidence(confidenceInputs);

  const dataConfidence = confidenceResult.score / 100;
  const dealInputs = dealScoreInputsFromSimulation(simResult, {
    purchasePrice: input.listPrice ?? undefined,
    dataConfidence,
    marketTailwinds: null,
    stressDSCR: null,
    purchaseDiscountVsValue: null,
  });
  const dealResult = scoreDeal(dealInputs);

  const dealScore: DealScoreBreakdown = {
    totalScore: dealResult.totalScore,
    band: dealResult.band,
    wasCappedByConfidence: dealResult.wasCappedByConfidence,
    explanationSummary: dealResult.explanationSummary,
    components: dealResult.components,
  };

  const confidence: ConfidenceScoreBreakdown = {
    score: confidenceResult.score,
    band: confidenceResult.band,
    explanation: confidenceResult.explanation,
    recommendedActions: confidenceResult.recommendedActions,
  };

  const keyMetrics: KeyMetricsSummary = {
    capRate: underwriting.capRate ?? null,
    monthlyCashFlow: underwriting.monthlyCashFlow ?? null,
    annualCashFlow: underwriting.annualCashFlow ?? null,
    dscr: underwriting.dscr ?? null,
    cashOnCashReturn: underwriting.cashOnCashReturn ?? null,
    expenseRatio: underwriting.expenseRatio ?? null,
    breakevenOccupancy: underwriting.breakevenOccupancy ?? null,
    noi: underwriting.noi ?? null,
    totalCashToClose: simResult.totalCashToClose ?? null,
  };

  const { risks, strengths } = buildFlags(dealScore, confidence);
  const assumptions = buildAssumptions(input);

  return {
    dealScore,
    confidence,
    keyMetrics,
    riskFlags: risks,
    strengthFlags: strengths,
    assumptions,
  };
}
