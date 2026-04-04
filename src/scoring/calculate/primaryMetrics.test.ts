import { describe, expect, it } from 'vitest';

import { defaultFinancing, defaultOperating } from '../assumptions/mergeAssumptions';
import type { NormalizedPropertyInputs } from '../domain/types';
import { computePrimaryMetrics } from './primaryMetrics';

function sampleInputs(): NormalizedPropertyInputs {
  return {
    version: 1,
    unitCount: 1,
    monthlyRentGross: 2_500,
    purchasePrice: 300_000,
    arv: 320_000,
    sqft: 1_600,
    yearBuilt: 2005,
    propertyType: 'SFR',
    annualPropertyTax: 3_600,
    annualInsurance: 1_440,
    annualHoa: 0,
    annualOtherOperating: 0,
    rehabBudget: 0,
  };
}

describe('computePrimaryMetrics', () => {
  it('exposes cap rate as NOI / purchase', () => {
    const metrics = computePrimaryMetrics(sampleInputs(), defaultFinancing(), defaultOperating());
    const noi = metrics.find((m) => m.key === 'noi_annual')?.value;
    const cap = metrics.find((m) => m.key === 'cap_rate')?.value;
    expect(noi).not.toBeNull();
    expect(cap).toBeCloseTo((noi as number) / 300_000, 5);
  });

  it('computes DSCR when debt service is known', () => {
    const metrics = computePrimaryMetrics(sampleInputs(), defaultFinancing(), defaultOperating());
    const noi = metrics.find((m) => m.key === 'noi_annual')?.value as number;
    const ds = metrics.find((m) => m.key === 'debt_service_annual')?.value as number;
    const dscr = metrics.find((m) => m.key === 'dscr')?.value;
    expect(dscr).toBeCloseTo(noi / ds, 5);
  });
});
