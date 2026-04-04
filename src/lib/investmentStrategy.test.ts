import { describe, expect, it } from 'vitest';

import { INVESTMENT_STRATEGIES, investmentStrategyLabel, isInvestmentStrategy } from './investmentStrategy';

describe('investmentStrategy', () => {
  it('validates known strategies', () => {
    expect(isInvestmentStrategy('buy_hold')).toBe(true);
    expect(isInvestmentStrategy('fix_flip')).toBe(true);
    expect(isInvestmentStrategy('rental')).toBe(false);
    expect(isInvestmentStrategy(undefined)).toBe(false);
  });

  it('labels strategies for UI', () => {
    expect(investmentStrategyLabel('buy_hold')).toBe('Buy & hold');
    expect(investmentStrategyLabel('fix_flip')).toBe('Fix & flip');
    expect(investmentStrategyLabel(undefined)).toBe('Not set');
  });

  it('keeps strategy union exhaustive for tests', () => {
    expect(INVESTMENT_STRATEGIES).toEqual(['buy_hold', 'fix_flip']);
  });
});
