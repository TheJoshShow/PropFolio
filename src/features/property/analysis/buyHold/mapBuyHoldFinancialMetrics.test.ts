import { describe, expect, it } from 'vitest';

import type { ScoreBreakdown } from '@/scoring';

import {
  buildBuyHoldPrimaryRows,
  formatBreakEvenTime,
  formatRentPerSqFt,
  resolveTotalCashInvested,
} from './mapBuyHoldFinancialMetrics';

function minimalBreakdown(overrides: Partial<ScoreBreakdown> = {}): ScoreBreakdown {
  const base: ScoreBreakdown = {
    schemaVersion: 2,
    engineVersion: 'test',
    computedAtIso: '',
    scenarioId: null,
    confidence: { score: 7, max: 10, base: 10, penalties: [] },
    primaryMetrics: [],
    factors: [],
    effectiveInputs: {
      version: 1,
      unitCount: 1,
      monthlyRentGross: 2000,
      purchasePrice: 400_000,
      arv: null,
      sqft: 1000,
      yearBuilt: null,
      propertyType: 'SFR',
      annualPropertyTax: null,
      annualInsurance: null,
      annualHoa: null,
      annualOtherOperating: null,
      rehabBudget: 0,
    },
    effectiveFinancing: {
      loanToValue: 0.8,
      interestRateAnnual: 0.065,
      amortizationYears: 30,
      interestOnly: false,
      closingCostPctOfLoan: 0.01,
    },
    effectiveOperating: {
      vacancyRate: 0.05,
      maintenancePctOfEgi: 0.08,
      managementPctOfEgi: 0.1,
      capexReserveMonthly: 0,
    },
  };
  return { ...base, ...overrides };
}

describe('mapBuyHoldFinancialMetrics', () => {
  it('resolves total cash invested from financing + purchase', () => {
    const b = minimalBreakdown();
    const invested = resolveTotalCashInvested(b);
    expect(invested).not.toBeNull();
    expect(invested!).toBeGreaterThan(0);
  });

  it('returns null invested when purchase missing', () => {
    const full = minimalBreakdown();
    const b: ScoreBreakdown = {
      ...full,
      effectiveInputs: {
        ...full.effectiveInputs,
        purchasePrice: null,
      },
    };
    expect(resolveTotalCashInvested(b)).toBeNull();
  });

  it('formats break-even when cash flow positive', () => {
    const b = minimalBreakdown({
      primaryMetrics: [
        {
          key: 'cash_flow_annual',
          label: 'Cash flow',
          value: 12_000,
          normalized: null,
          availability: 'ok',
          formulaId: 't',
          missingDrivers: [],
          unit: 'currency_annual',
        },
      ],
    });
    const invested = resolveTotalCashInvested(b);
    const be = formatBreakEvenTime(b, invested);
    expect(be).not.toBe('—');
    expect(be).toMatch(/mo|yrs/);
  });

  it('buildBuyHoldPrimaryRows never throws', () => {
    const rows = buildBuyHoldPrimaryRows(minimalBreakdown({ primaryMetrics: [] }));
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => typeof r.value === 'string')).toBe(true);
  });

  it('formatRentPerSqFt uses effective inputs', () => {
    expect(formatRentPerSqFt(minimalBreakdown())).toContain('sq ft');
  });
});
