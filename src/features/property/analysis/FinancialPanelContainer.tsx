import type { ScoreBreakdown } from '@/scoring';
import type { PropertyRow } from '@/types/property';

import { BuyHoldFinancialsPanel } from './buyHold/BuyHoldFinancialsPanel';
import { FixFlipFinancialsPanel } from './fixFlip/FixFlipFinancialsPanel';
import { SharedFinancialMetricsPanel } from './panels/SharedFinancialMetricsPanel';
import type { FinancialPanelKind } from './resolveFinancialPanelKind';

type Props = {
  kind: FinancialPanelKind;
  property: PropertyRow;
  breakdown: ScoreBreakdown;
};

/**
 * Strategy-aware financial body — swaps panel by kind; shared shell stays in PropertyAnalysisScreen.
 */
export function FinancialPanelContainer({ kind, property, breakdown }: Props) {
  if (kind === 'buy_hold') {
    return <BuyHoldFinancialsPanel breakdown={breakdown} />;
  }
  if (kind === 'fix_flip') {
    return <FixFlipFinancialsPanel breakdown={breakdown} property={property} />;
  }
  return <SharedFinancialMetricsPanel variant={kind} property={property} breakdown={breakdown} />;
}
