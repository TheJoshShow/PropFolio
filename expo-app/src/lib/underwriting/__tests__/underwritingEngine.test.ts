/**
 * Unit tests for underwriting engine. All money-related calculations must be tested.
 */

import { calculate } from '../underwritingEngine';

describe('UnderwritingEngine', () => {
  it('returns nil metrics when purchase price and rent are missing', () => {
    const out = calculate({});
    expect(out.noi).toBeUndefined();
    expect(out.capRate).toBeUndefined();
    expect(out.monthlyCashFlow).toBeUndefined();
    expect(out.dscr).toBeUndefined();
  });

  it('computes NOI and cap rate from price, rent, and expenses', () => {
    const out = calculate({
      purchasePrice: 300_000,
      monthlyRent: 2_000,
      operatingExpensesAnnual: 12_000,
    });
    const gsr = 2_000 * 12;
    const noi = gsr - 12_000;
    expect(out.noi).toBe(noi);
    expect(out.capRate).toBe(noi / 300_000);
  });

  it('computes DSCR when loan and rate are provided', () => {
    const out = calculate({
      purchasePrice: 300_000,
      loanAmount: 225_000,
      interestRateAnnual: 0.065,
      termYears: 30,
      monthlyRent: 2_000,
      operatingExpensesAnnual: 10_000,
    });
    expect(out.noi).toBeDefined();
    expect(out.annualDebtService).toBeDefined();
    expect(out.dscr).toBeDefined();
    if (out.noi != null && out.annualDebtService != null && out.annualDebtService > 0) {
      expect(out.dscr).toBe(out.noi / out.annualDebtService);
    }
  });

  it('applies vacancy when provided', () => {
    const out = calculate({
      purchasePrice: 300_000,
      monthlyRent: 2_000,
      vacancyPercent: 5,
      operatingExpensesAnnual: 0,
    });
    const gsr = 2_000 * 12;
    const egi = gsr * 0.95;
    expect(out.effectiveGrossIncome).toBe(egi);
    expect(out.noi).toBe(egi);
  });
});
