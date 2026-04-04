export type InvestmentStrategy = 'buy_hold' | 'fix_flip';

export const INVESTMENT_STRATEGIES: readonly InvestmentStrategy[] = ['buy_hold', 'fix_flip'] as const;

export function isInvestmentStrategy(v: unknown): v is InvestmentStrategy {
  return v === 'buy_hold' || v === 'fix_flip';
}

export function investmentStrategyLabel(s: InvestmentStrategy | null | undefined): string {
  if (s === 'fix_flip') {
    return 'Fix & flip';
  }
  if (s === 'buy_hold') {
    return 'Buy & hold';
  }
  return 'Not set';
}
