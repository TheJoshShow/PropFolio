import { describe, expect, it } from 'vitest';

import { annualDebtService, cashInvestedAtClose, loanAmountFromLtv } from './financing';

describe('loanAmountFromLtv', () => {
  it('returns purchase × LTV', () => {
    expect(loanAmountFromLtv(400_000, 0.75)).toBe(300_000);
  });

  it('guards invalid inputs', () => {
    expect(loanAmountFromLtv(0, 0.75)).toBeNull();
    expect(loanAmountFromLtv(100_000, 0)).toBeNull();
    expect(loanAmountFromLtv(100_000, 1.1)).toBeNull();
  });
});

describe('annualDebtService', () => {
  it('computes IO as principal × rate', () => {
    expect(annualDebtService(300_000, 0.06, 30, true)).toBeCloseTo(18_000, 5);
  });

  it('computes amortizing annual payment', () => {
    const ds = annualDebtService(300_000, 0.065, 30, false);
    expect(ds).not.toBeNull();
    expect(ds!).toBeGreaterThan(18_000);
    expect(ds!).toBeLessThan(30_000);
  });
});

describe('cashInvestedAtClose', () => {
  it('sums down payment, closing costs, and rehab', () => {
    const invested = cashInvestedAtClose({
      purchasePrice: 400_000,
      loanPrincipal: 300_000,
      closingCostPctOfLoan: 0.02,
      rehabBudget: 25_000,
    });
    expect(invested).toBe(100_000 + 6_000 + 25_000);
  });
});
