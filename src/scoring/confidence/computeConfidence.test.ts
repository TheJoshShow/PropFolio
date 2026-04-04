import { describe, expect, it } from 'vitest';

import type { NormalizedPropertyInputs } from '../domain/types';
import { computeConfidence } from './computeConfidence';

const full = (): NormalizedPropertyInputs => ({
  version: 1,
  unitCount: 1,
  monthlyRentGross: 2_000,
  purchasePrice: 250_000,
  arv: 260_000,
  sqft: 1_400,
  yearBuilt: 2010,
  propertyType: 'SFR',
  annualPropertyTax: 3_000,
  annualInsurance: 1_200,
  annualHoa: 0,
  annualOtherOperating: 0,
  rehabBudget: 0,
});

describe('computeConfidence', () => {
  it('deducts for missing purchase and rent', () => {
    const c = computeConfidence({
      ...full(),
      purchasePrice: null,
      monthlyRentGross: null,
    });
    expect(c.penalties.map((p) => p.code)).toEqual(expect.arrayContaining(['purchase', 'rent']));
    expect(c.score).toBeLessThan(c.base);
  });

  it('hits max when core fields present', () => {
    const c = computeConfidence(full());
    expect(c.score).toBeGreaterThan(0);
    expect(c.score).toBeLessThanOrEqual(c.max);
  });
});
