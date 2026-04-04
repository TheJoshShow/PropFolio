import { describe, expect, it } from 'vitest';

import type { ScoreBreakdown } from '@/scoring';
import type { PropertyRow } from '@/types/property';

import {
  FIX_FLIP_DISPLAY_DEFAULTS,
  formatDaysOnMarket,
  formatLtcPercent,
  formatLtvPercent,
  resolveFlipRoiRatio,
  resolveMaximumAllowableOffer,
} from './mapFixFlipFinancialMetrics';

function breakdown(overrides: Partial<ScoreBreakdown> = {}): ScoreBreakdown {
  const base: ScoreBreakdown = {
    schemaVersion: 2,
    engineVersion: 'test',
    computedAtIso: '',
    scenarioId: null,
    confidence: { score: 7, max: 10, base: 10, penalties: [] },
    primaryMetrics: [
      {
        key: 'arv',
        label: 'ARV',
        value: 500_000,
        normalized: null,
        availability: 'ok',
        formulaId: 't',
        missingDrivers: [],
        unit: 'currency_annual',
      },
    ],
    factors: [],
    effectiveInputs: {
      version: 1,
      unitCount: 1,
      monthlyRentGross: null,
      purchasePrice: 350_000,
      arv: 500_000,
      sqft: 2000,
      yearBuilt: null,
      propertyType: 'SFR',
      annualPropertyTax: null,
      annualInsurance: null,
      annualHoa: null,
      annualOtherOperating: null,
      rehabBudget: 40_000,
    },
    effectiveFinancing: {
      loanToValue: 0.75,
      interestRateAnnual: 0.07,
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

const minimalProperty = (inputs?: Record<string, number | string | null>): PropertyRow =>
  ({
    id: '1',
    user_id: 'u',
    source_type: 'manual_address',
    source_url: null,
    raw_input: null,
    status: 'ready',
    missing_fields: [],
    snapshot: {
      version: '1',
      address: { formatted: 'x' },
      geo: { lat: null, lng: null },
      scoringInputs: inputs ?? {},
    },
    place_id: null,
    formatted_address: null,
    latitude: null,
    longitude: null,
    confidence_score: null,
    last_import_error: null,
    created_at: '',
    updated_at: '',
  }) as PropertyRow;

describe('mapFixFlipFinancialMetrics', () => {
  it('computes MAO from ARV, rehab, and policy spread', () => {
    const b = breakdown();
    const mao = resolveMaximumAllowableOffer(b);
    expect(mao).not.toBeNull();
    const { MAO_SELLING_COST_PCT_OF_ARV, MAO_TARGET_PROFIT_PCT_OF_ARV } = FIX_FLIP_DISPLAY_DEFAULTS;
    const mult = 1 - MAO_SELLING_COST_PCT_OF_ARV - MAO_TARGET_PROFIT_PCT_OF_ARV;
    expect(mao).toBe(500_000 * mult - 40_000);
  });

  it('returns null MAO without ARV', () => {
    const base = breakdown();
    const b = breakdown({
      primaryMetrics: [],
      effectiveInputs: { ...base.effectiveInputs, arv: null },
    });
    expect(resolveMaximumAllowableOffer(b)).toBeNull();
  });

  it('computes flip ROI ratio when inputs valid', () => {
    const r = resolveFlipRoiRatio(breakdown());
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(-1);
  });

  it('formats LTV and LTC', () => {
    expect(formatLtvPercent(breakdown())).toBe('75%');
    expect(formatLtcPercent(breakdown())).toContain('%');
  });

  it('DOM reads scoringInputs.daysOnMarket', () => {
    expect(formatDaysOnMarket(minimalProperty())).toBe('—');
    expect(formatDaysOnMarket(minimalProperty({ daysOnMarket: 14 }))).toContain('14');
  });
});
