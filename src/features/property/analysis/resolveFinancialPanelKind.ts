import type { InvestmentStrategy } from '@/lib/investmentStrategy';

/** Which financial panel implementation to mount — extends as buy_hold / fix_flip diverge. */
export type FinancialPanelKind = InvestmentStrategy | 'unknown';

/**
 * Maps persisted snapshot strategy to panel kind. No fabricated defaults — unknown stays unknown.
 */
export function financialPanelKindFromStrategy(
  strategy: InvestmentStrategy | null | undefined,
): FinancialPanelKind {
  if (strategy === 'buy_hold' || strategy === 'fix_flip') {
    return strategy;
  }
  return 'unknown';
}
