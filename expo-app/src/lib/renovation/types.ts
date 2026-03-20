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
