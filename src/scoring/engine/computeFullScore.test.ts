import { describe, expect, it } from 'vitest';

import { defaultFinancing, defaultOperating, mergeUserAssumptions } from '../assumptions/mergeAssumptions';
import type { NormalizedPropertyInputs } from '../domain/types';
import { computeFullScore } from './computeFullScore';

const norm = (): NormalizedPropertyInputs => ({
  version: 1,
  unitCount: 1,
  monthlyRentGross: 2_400,
  purchasePrice: 280_000,
  arv: null,
  sqft: 1_500,
  yearBuilt: 2000,
  propertyType: 'SFR',
  annualPropertyTax: 3_200,
  annualInsurance: 1_000,
  annualHoa: 0,
  annualOtherOperating: 0,
  rehabBudget: 0,
});

describe('computeFullScore', () => {
  it('returns versioned breakdown with metrics and factors', () => {
    const merged = mergeUserAssumptions(norm(), defaultFinancing(), defaultOperating(), undefined);
    const bd = computeFullScore({
      normalized: merged.normalized,
      financing: merged.financing,
      operating: merged.operating,
    });
    expect(bd.schemaVersion).toBe(2);
    expect(bd.primaryMetrics.length).toBeGreaterThan(5);
    expect(bd.factors.some((f) => f.kind === 'upside_potential')).toBe(true);
    expect(bd.confidence.penalties).toBeDefined();
  });

  it('recalculates when scenario changes purchase price', () => {
    const base = computeFullScore({
      normalized: norm(),
      financing: defaultFinancing(),
      operating: defaultOperating(),
    });
    const stressed = computeFullScore({
      normalized: norm(),
      financing: defaultFinancing(),
      operating: defaultOperating(),
      activeScenario: {
        id: 'hi',
        label: 'Higher price',
        purchasePrice: 320_000,
      },
    });
    const cap0 = base.primaryMetrics.find((m) => m.key === 'cap_rate')?.value;
    const cap1 = stressed.primaryMetrics.find((m) => m.key === 'cap_rate')?.value;
    expect(cap0).not.toBeNull();
    expect(cap1).not.toBeNull();
    expect(cap1 as number).toBeLessThan(cap0 as number);
  });
});
