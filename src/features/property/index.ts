/**
 * Property detail + analysis tabs — deterministic metrics UI, AI summary section.
 */

export {
  PropertyAnalysisScreen,
  AnalysisSummaryCard,
  AnalysisTabSwitcher,
  FinancialPanelContainer,
  buildPropertyAnalysisSummary,
  financialPanelKindFromStrategy,
  type AnalysisSummaryRow,
  type AnalysisTabKey,
  type FinancialPanelKind,
} from './analysis';
export { PropertyDetailView } from './detail';
export { usePropertyDetail } from './usePropertyDetail';
export { usePropertyDetailScoring, isUserAssumptionOverridesEmpty } from './usePropertyDetailScoring';
