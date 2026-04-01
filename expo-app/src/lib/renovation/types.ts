export type RenovationFinancingMode = 'rolledIntoMortgage' | 'cashOutOfPocket';

/**
 * Single renovation line item (e.g. kitchen, roof, bath).
 * All amounts are in USD, deterministic and pre-tax.
 */
export interface RenovationLineItem {
  id: string;
  label: string;
  /** Budgeted cost for this item. */
  cost: number;
  /**
   * Estimated contribution to ARV (After Repair Value) from this line.
   * Allows future UI to attribute ARV uplift per scope.
   */
  arvDelta?: number | null;
  /**
   * Expected monthly rent uplift from this work (post-renovation vs pre).
   * Optional; used for payback and incremental cash-flow analysis.
   */
  monthlyRentDelta?: number | null;
  /** Estimated timeline in months until this item is fully complete. */
  monthsToComplete?: number | null;
}

/**
 * Core deterministic inputs for renovation-aware analysis.
 * These should be built from normalized property data + user assumptions.
 */
export interface RenovationDealInputs {
  /** Purchase price (contract price) in USD. */
  purchasePrice: number;
  /** Current monthly rent (pre-renovation) in USD. */
  currentMonthlyRent: number;
  /** Pro-forma monthly rent after all renovations complete. */
  projectedMonthlyRent: number;
  /** Annual property taxes in USD. */
  taxesAnnual: number;
  /** Annual insurance in USD. */
  insuranceAnnual: number;
  /** Other fixed operating expenses (maintenance, utilities, etc.) in USD per year. */
  operatingExpensesAnnual: number;
  /**
   * Vacancy allowance as a decimal (e.g. 0.05 = 5%).
   * Applied to gross scheduled rent when computing NOI.
   */
  vacancyRate: number;

  /** Loan amount in USD (principal). */
  loanAmount: number;
  /** Annual interest rate as a decimal (e.g. 0.07 for 7%). */
  interestRate: number;
  /** Amortization period in years. */
  amortizationYears: number;

  /** Upfront closing + acquisition costs (title, fees, etc.). */
  closingCosts: number;

  /** All planned renovation line items. */
  renovations: RenovationLineItem[];
  /**
   * How renovation costs are financed.
   * - rolledIntoMortgage: renovation cost increases loanAmount.
   * - cashOutOfPocket: renovation cost is part of total cash invested.
   */
  renovationFinancingMode: RenovationFinancingMode;

  /**
   * Pro-forma ARV (After Repair Value) in USD.
   * If omitted, the engine can approximate ARV as purchasePrice + totalArvDelta.
   */
  arv?: number | null;

  /**
   * Analysis horizon in years for IRR-style metrics (not yet implemented).
   * Kept for future extension; current engine focuses on static ratios.
   */
  holdPeriodYears?: number | null;
}

export interface DownsideScenarioResult {
  name: string;
  description: string;
  /** DSCR under this scenario, or null if cannot be computed. */
  dscr: number | null;
  /** Annual cash flow under this scenario. */
  annualCashFlow: number | null;
}

/**
 * Deterministic outputs from renovation-aware analysis.
 * All values are derived purely from RenovationDealInputs.
 */
export interface RenovationAnalysisResult {
  /** Net Operating Income (post-renovation), annual. */
  noiAnnual: number | null;
  /** Cap rate = NOI / total project cost. */
  capRate: number | null;
  /** Monthly cash flow (post-renovation, after debt service). */
  monthlyCashFlow: number | null;
  /** Annual cash flow (post-renovation, after debt service). */
  annualCashFlow: number | null;
  /** Cash-on-cash return (annual cash flow / total cash invested). */
  cashOnCashReturn: number | null;
  /** DSCR = NOI / annual debt service. */
  dscr: number | null;
  /** Net yield = NOI / (purchasePrice + renovationCost). */
  netYield: number | null;
  /** Total renovation budget (sum of line items). */
  totalRenovationCost: number;
  /** Total project cost = purchase + closing + renovations (regardless of financing mix). */
  totalProjectCost: number;
  /** ARV used in calculations. */
  resolvedArv: number | null;
  /** ARV gain = ARV - totalProjectCost. */
  arvGain: number | null;
  /** Renovation ROI = ARV gain / totalRenovationCost. */
  renovationRoi: number | null;
  /**
   * Payback period in years: totalRenovationCost / incremental annual cash flow
   * (post-renovation CF - pre-renovation CF). Null when non-positive.
   */
  paybackPeriodYears: number | null;
  /** Deterministic downside stress tests. */
  downsideScenarios: DownsideScenarioResult[];
  /**
   * Weighted 0–10 score summarizing return, risk, and renovation efficiency.
   * Higher is better. Purely deterministic weighting, no AI.
   */
  weightedScore: number | null;
}

/**
 * Renovation plan, line items, categories, tiers.
 * Matches PropFolio RenovationCategory, RenovationEstimateTier, RenovationLineItem, RenovationPlan, RenovationCosts.
 */

export type RenovationEstimateTier = 'low' | 'base' | 'high';

export type RenovationCategory =
  | 'roof'
  | 'windows'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'foundation_structural'
  | 'flooring'
  | 'kitchens'
  | 'bathrooms'
  | 'paint'
  | 'exterior_envelope'
  | 'landscaping_site_work'
  | 'permits_contingency'
  | 'general_labor_demo';

export interface RenovationLineItem {
  category: RenovationCategory;
  low?: number | null;
  base?: number | null;
  high?: number | null;
}

export function lineItemValue(item: RenovationLineItem, tier: RenovationEstimateTier): number | null {
  const v = tier === 'low' ? item.low : tier === 'base' ? item.base : item.high;
  return v != null && v >= 0 ? v : null;
}

export interface RenovationPlan {
  lineItems: RenovationLineItem[];
  regionMultiplier?: number | null;
  contingencyPercent: number;
}

export function planSubtotal(plan: RenovationPlan, tier: RenovationEstimateTier): number {
  return plan.lineItems.reduce((sum, item) => sum + (lineItemValue(item, tier) ?? 0), 0);
}

export function planSubtotalWithRegion(plan: RenovationPlan, tier: RenovationEstimateTier): number {
  const sub = planSubtotal(plan, tier);
  const mult = plan.regionMultiplier != null && plan.regionMultiplier >= 1 ? plan.regionMultiplier : 1;
  return sub * mult;
}

export function planContingencyAmount(plan: RenovationPlan, tier: RenovationEstimateTier): number {
  const sub = planSubtotalWithRegion(plan, tier);
  return sub * (plan.contingencyPercent / 100);
}

export function planTotal(plan: RenovationPlan, tier: RenovationEstimateTier): number {
  return planSubtotalWithRegion(plan, tier) + planContingencyAmount(plan, tier);
}

/** Legacy simple totals by category; used when renovationPlan is not set. */
export interface RenovationCosts {
  kitchen?: number | null;
  bath?: number | null;
  exterior?: number | null;
  interior?: number | null;
  other?: number | null;
}

export function renovationCostsTotal(costs: RenovationCosts | null | undefined): number {
  if (!costs) return 0;
  const items = [
    costs.kitchen,
    costs.bath,
    costs.exterior,
    costs.interior,
    costs.other,
  ].filter((x): x is number => x != null && x >= 0);
  return items.reduce((a, b) => a + b, 0);
}
