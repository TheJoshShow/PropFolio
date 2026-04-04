/**
 * Portfolio feature — list, totals, and property card UI will live here.
 * Screens in `app/(main)/portfolio.tsx` compose feature components.
 */

export { buildPortfolioView } from './buildPortfolioView';
export type { PortfolioAggregateStats, PortfolioPropertyListItem } from './buildPortfolioView';
export { useProperties } from './useProperties';
export { usePortfolioHeader } from './usePortfolioHeader';
