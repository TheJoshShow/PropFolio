import { describe, expect, it } from 'vitest';

import { defaultOperating } from '../assumptions/mergeAssumptions';
import type { NormalizedPropertyInputs } from '../domain/types';
import { computeOperatingCore } from './operating';

const baseInputs = (): NormalizedPropertyInputs => ({
  version: 1,
  unitCount: 2,
  monthlyRentGross: 2_000,
  purchasePrice: 250_000,
  arv: null,
  sqft: 1_800,
  yearBuilt: 1990,
  propertyType: 'SFR',
  annualPropertyTax: 3_000,
  annualInsurance: 1_200,
  annualHoa: 0,
  annualOtherOperating: 600,
  rehabBudget: 0,
});

describe('computeOperatingCore', () => {
  it('computes GPR from total monthly rent × 12', () => {
    const op = defaultOperating();
    const core = computeOperatingCore(baseInputs(), op);
    expect(core.gprAnnual).toBe(24_000);
    expect(core.egiAnnual).toBeCloseTo(24_000 * (1 - op.vacancyRate), 5);
  });

  it('marks missing rent', () => {
    const inputs = { ...baseInputs(), monthlyRentGross: null };
    const core = computeOperatingCore(inputs, defaultOperating());
    expect(core.gprAnnual).toBeNull();
    expect(core.missingDrivers).toContain('monthlyRentGross');
  });
});
