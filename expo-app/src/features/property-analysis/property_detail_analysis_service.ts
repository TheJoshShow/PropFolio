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
import { score as scoreDeal, listMissingDealScoreRequirements } from '../../lib/scoring/dealScoringEngine';
import { fromSimulationResult as dealScoreInputsFromSimulation } from '../../lib/scoring/dealScoreInputsFromSimulation';
import { insufficientDataReasonFromMissing } from '../../lib/scoring/dealScoreExplanations';
import {
  estimateListPriceFromMonthlyRent,
  estimateMonthlyRentFromListPrice,
} from '../../services/importLimits';
import { logAnalysisStep } from '../../services/diagnostics';
import { recordFlowException } from '../../services/monitoring/flowInstrumentation';
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

function round2(v: number | null): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.round(v * 100) / 100;
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
  const expenseRatioPct = sanitizeNum(input.operatingExpenseRatioPercent);

  let closingCosts: number | null = sanitizeNum(input.closingCosts);
  if (closingCosts == null && price != null && price > 0) {
    closingCosts = price * DEFAULT_CLOSING_COSTS_PERCENT;
  }

  // Monthly rent: rent is treated as total monthly (e.g. single unit) or per-unit depending on context.
  // We treat input.rent as total monthly when unitCount is 1; otherwise per-unit.
  const monthlyRentPerUnit =
    rent != null && units >= 1 ? (units === 1 ? rent : rent / units) : null;

  // Operating expenses: if provided use it; else estimate as % of EGI.
  let taxesAnnual: number | null = sanitizeNum(input.taxesAnnual);
  let insuranceAnnual: number | null = sanitizeNum(input.insuranceAnnual);
  let propertyManagementAnnual: number | null = null;
  let repairsAndMaintenanceAnnual: number | null = null;
  let utilitiesAnnual: number | null = null;
  let capitalReservesAnnual: number | null = null;

  const operatingExpensesOverride = sanitizeNum(input.operatingExpensesAnnual);
  if (operatingExpensesOverride != null && operatingExpensesOverride >= 0) {
    repairsAndMaintenanceAnnual = operatingExpensesOverride;
  } else if (rent != null && rent > 0) {
    const egiApprox = rent * 12 * (1 - vacancyPct / 100);
    const ratio = expenseRatioPct != null && expenseRatioPct >= 0 ? expenseRatioPct / 100 : DEFAULT_EXPENSE_RATIO_EGI;
    const oe = egiApprox * ratio;
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
 * Derive missing purchase price or rent using the same cap/expense/vacancy ladder as import,
 * so simulation can produce debt service, DSCR, and cap rate for scoring.
 */
function resolvePriceAndRentForAnalysis(input: PropertyDetailAnalysisInput): {
  listPrice: number | null;
  rent: number | null;
  inferredPrice: boolean;
  inferredRent: boolean;
} {
  let listPrice = sanitizeNum(input.listPrice);
  let rent = sanitizeNum(input.rent);
  let inferredPrice = false;
  let inferredRent = false;

  if (listPrice == null && rent != null && rent > 0) {
    const p = estimateListPriceFromMonthlyRent(rent);
    if (p != null) {
      listPrice = p;
      inferredPrice = true;
    }
  }
  if (rent == null && listPrice != null && listPrice > 0) {
    const r = estimateMonthlyRentFromListPrice(listPrice);
    if (r != null) {
      rent = r;
      inferredRent = true;
    }
  }

  return { listPrice, rent, inferredPrice, inferredRent };
}

/**
 * Build assumptions list from what we defaulted or inferred.
 */
function buildAssumptions(
  input: PropertyDetailAnalysisInput,
  inference?: { inferredPrice: boolean; inferredRent: boolean }
): AssumptionItem[] {
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
    value:
      input.operatingExpensesAnnual != null
        ? 'Manual annual expense override'
        : `${(
            input.operatingExpenseRatioPercent != null
              ? input.operatingExpenseRatioPercent
              : DEFAULT_EXPENSE_RATIO_EGI * 100
          ).toFixed(0)}% of gross income`,
    source:
      input.operatingExpensesAnnual != null || input.operatingExpenseRatioPercent != null
        ? 'user'
        : 'inferred',
  });
  if (inference?.inferredPrice) {
    list.push({
      id: 'inferred_list_price',
      label: 'List / purchase price',
      value: 'Estimated from monthly rent using fixed cap-rate and expense assumptions',
      source: 'inferred',
    });
  }
  if (inference?.inferredRent) {
    list.push({
      id: 'inferred_rent',
      label: 'Monthly rent',
      value: 'Estimated from list price using fixed cap-rate and expense assumptions',
      source: 'inferred',
    });
  }
  return list;
}

function pipelineFailureResult(input: PropertyDetailAnalysisInput, message: string): PropertyDetailAnalysisResult {
  const listPrice = input.listPrice ?? null;
  const rent = input.rent ?? null;
  const unitCount = input.unitCount != null && input.unitCount > 0 ? input.unitCount : 1;
  return {
    dealScore: {
      totalScore: null,
      band: 'insufficientData',
      wasCappedByConfidence: false,
      explanationSummary: message,
      components: [],
    },
    confidence: {
      score: 0,
      band: 'veryLow',
      explanation: {
        supportingFactors: [],
        limitingFactors: [message],
        summary: message,
      },
      recommendedActions: [],
    },
    keyMetrics: {
      capRate: null,
      monthlyCashFlow: null,
      annualCashFlow: null,
      dscr: null,
      cashOnCashReturn: null,
      expenseRatio: null,
      breakevenOccupancy: null,
      noi: null,
      totalCashToClose: null,
    },
    normalizedInputs: { listPrice, rent },
    inputSnapshot: {
      listPrice,
      rent,
      unitCount,
      sqft: input.sqft ?? null,
      downPaymentPercent: input.downPaymentPercent ?? DEFAULT_DOWN_PAYMENT_PERCENT,
      interestRateAnnual: input.interestRateAnnual ?? DEFAULT_INTEREST_RATE_ANNUAL,
      vacancyRatePercent: input.vacancyRatePercent ?? DEFAULT_VACANCY_RATE_PERCENT,
      operatingExpensesAnnual: input.operatingExpensesAnnual ?? null,
      operatingExpenseRatioPercent: input.operatingExpenseRatioPercent ?? null,
      taxesAnnual: input.taxesAnnual ?? null,
      insuranceAnnual: input.insuranceAnnual ?? null,
    },
    derivedValues: {
      vacancyLossAnnual: null,
      effectiveGrossIncomeAnnual: null,
      operatingExpensesAnnual: null,
      loanAmount: null,
      monthlyDebtService: null,
    },
    missingRequirements: ['analysis_pipeline_failed'],
    warnings: [],
    pipelineError: message,
    riskFlags: [],
    strengthFlags: [],
    assumptions: [],
  };
}

/**
 * Single entry point: run full analysis and return result for property detail UI.
 * Deterministic; does not throw — failures set `pipelineError` for caller-owned error UI.
 */
export function runPropertyDetailAnalysis(
  input: PropertyDetailAnalysisInput
): PropertyDetailAnalysisResult {
  try {
    return runPropertyDetailAnalysisCore(input);
  } catch (e) {
    recordFlowException('analysis_pipeline_failed', e, { stage: 'analysis_build', recoverable: false });
    const msg = e instanceof Error ? e.message : 'Could not analyze this property.';
    return pipelineFailureResult(input, msg);
  }
}

function runPropertyDetailAnalysisCore(
  input: PropertyDetailAnalysisInput
): PropertyDetailAnalysisResult {
  const resolved = resolvePriceAndRentForAnalysis(input);
  const mergedInput: PropertyDetailAnalysisInput = {
    ...input,
    listPrice: resolved.listPrice,
    rent: resolved.rent,
  };

  logAnalysisStep('resolved_inputs', {
    inferredPrice: resolved.inferredPrice,
    inferredRent: resolved.inferredRent,
    hasPrice: mergedInput.listPrice != null,
    hasRent: mergedInput.rent != null,
  });

  const simInputs = toSimulationInputs(mergedInput);
  const simResult = runSimulation(simInputs);
  const underwriting = simResult.underwriting;

  const hasRent = mergedInput.rent != null && mergedInput.rent > 0;
  const hasExpenses =
    (mergedInput.operatingExpensesAnnual != null && mergedInput.operatingExpensesAnnual >= 0) ||
    (mergedInput.operatingExpenseRatioPercent != null && mergedInput.operatingExpenseRatioPercent >= 0) ||
    (mergedInput.taxesAnnual != null && mergedInput.taxesAnnual >= 0) ||
    (mergedInput.insuranceAnnual != null && mergedInput.insuranceAnnual >= 0);
  const confidenceInputs = toConfidenceInputs(mergedInput, hasRent, hasExpenses);
  const confidenceResult = evaluateConfidence(confidenceInputs);

  const dataConfidence = confidenceResult.score / 100;
  const dealInputs = dealScoreInputsFromSimulation(simResult, {
    purchasePrice: mergedInput.listPrice ?? undefined,
    dataConfidence,
    marketTailwinds: null,
    stressDSCR: null,
    purchaseDiscountVsValue: null,
  });
  const dealResult = scoreDeal(dealInputs);

  let explanationSummary = dealResult.explanationSummary;
  if (dealResult.band === 'insufficientData') {
    const missing = listMissingDealScoreRequirements(dealInputs);
    explanationSummary = insufficientDataReasonFromMissing(missing);
    logAnalysisStep('score_insufficient', {
      missing,
      hasNoi: underwriting.noi != null,
      hasAds: underwriting.annualDebtService != null,
    });
  }

  const dealScore: DealScoreBreakdown = {
    totalScore: dealResult.totalScore,
    band: dealResult.band,
    wasCappedByConfidence: dealResult.wasCappedByConfidence,
    explanationSummary,
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

  const inputSnapshot = {
    listPrice: mergedInput.listPrice ?? null,
    rent: mergedInput.rent ?? null,
    unitCount: mergedInput.unitCount ?? 1,
    sqft: mergedInput.sqft ?? null,
    downPaymentPercent: mergedInput.downPaymentPercent ?? DEFAULT_DOWN_PAYMENT_PERCENT,
    interestRateAnnual: mergedInput.interestRateAnnual ?? DEFAULT_INTEREST_RATE_ANNUAL,
    vacancyRatePercent: mergedInput.vacancyRatePercent ?? DEFAULT_VACANCY_RATE_PERCENT,
    operatingExpensesAnnual: mergedInput.operatingExpensesAnnual ?? null,
    operatingExpenseRatioPercent: mergedInput.operatingExpenseRatioPercent ?? null,
    taxesAnnual: mergedInput.taxesAnnual ?? null,
    insuranceAnnual: mergedInput.insuranceAnnual ?? null,
  };

  const derivedValues = {
    vacancyLossAnnual:
      underwriting.grossScheduledRentAnnual != null &&
      underwriting.vacancyAdjustedGrossIncome != null
        ? round2(underwriting.grossScheduledRentAnnual - underwriting.vacancyAdjustedGrossIncome)
        : null,
    effectiveGrossIncomeAnnual: round2(underwriting.effectiveGrossIncome ?? null),
    operatingExpensesAnnual: round2(underwriting.operatingExpensesAnnual ?? null),
    loanAmount:
      mergedInput.listPrice != null && (mergedInput.downPaymentPercent ?? DEFAULT_DOWN_PAYMENT_PERCENT) >= 0
        ? round2(
            mergedInput.listPrice *
              (1 - (mergedInput.downPaymentPercent ?? DEFAULT_DOWN_PAYMENT_PERCENT) / 100)
          )
        : null,
    monthlyDebtService:
      underwriting.annualDebtService != null ? round2(underwriting.annualDebtService / 12) : null,
  };

  const missingRequirements = listMissingDealScoreRequirements(dealInputs);
  const warnings: string[] = [];
  if (mergedInput.listPrice == null) warnings.push('Listing price missing; inferred from rent when possible.');
  if (mergedInput.rent == null) warnings.push('Rent estimate missing; inferred from price when possible.');
  if (input.geocodeStatus === 'failed') {
    warnings.push(`Geocoding failed${input.geocodeError ? `: ${input.geocodeError}` : ''}.`);
  } else if (input.geocodeStatus === 'pending' || input.geocodeStatus === 'in_progress') {
    warnings.push('Address geocoding still in progress.');
  }
  if (underwriting.noi == null) warnings.push('NOI unavailable due to missing income/expense inputs.');
  if (underwriting.annualDebtService == null) warnings.push('Debt service unavailable; verify financing assumptions.');

  const { risks, strengths } = buildFlags(dealScore, confidence);
  const assumptions = buildAssumptions(mergedInput, {
    inferredPrice: resolved.inferredPrice,
    inferredRent: resolved.inferredRent,
  });

  return {
    dealScore,
    confidence,
    keyMetrics,
    normalizedInputs: {
      listPrice: mergedInput.listPrice ?? null,
      rent: mergedInput.rent ?? null,
    },
    inputSnapshot,
    derivedValues,
    missingRequirements,
    warnings,
    riskFlags: risks,
    strengthFlags: strengths,
    assumptions,
  };
}
