import { describe, expect, it } from 'vitest';

import { defaultFinancing, defaultOperating } from '../assumptions/mergeAssumptions';
import type { NormalizedPropertyInputs } from '../domain/types';
import { applyScenario } from './applyScenario';

const norm = (): NormalizedPropertyInputs => ({
  version: 1,
  unitCount: 1,
  monthlyRentGross: 2_000,
  purchasePrice: 200_000,
  arv: null,
  sqft: 1_000,
  yearBuilt: 1999,
  propertyType: 'SFR',
  annualPropertyTax: 2_000,
  annualInsurance: 1_000,
  annualHoa: null,
  annualOtherOperating: null,
  rehabBudget: 10_000,
});

describe('applyScenario', () => {
  it('does not mutate originals', () => {
    const n = norm();
    const f = defaultFinancing();
    const o = defaultOperating();
    applyScenario(n, f, o, {
      id: 's1',
      label: 'Test',
      purchasePrice: 180_000,
    });
    expect(n.purchasePrice).toBe(200_000);
    expect(f.loanToValue).toBe(defaultFinancing().loanToValue);
  });

  it('merges financing partials', () => {
    const out = applyScenario(norm(), defaultFinancing(), defaultOperating(), {
      id: 's2',
      label: 'Lower LTV',
      financing: { loanToValue: 0.65 },
    });
    expect(out.financing.loanToValue).toBe(0.65);
    expect(out.financing.interestRateAnnual).toBe(defaultFinancing().interestRateAnnual);
    expect(out.scenarioId).toBe('s2');
  });

  it('applies capex reserve override', () => {
    const out = applyScenario(norm(), defaultFinancing(), defaultOperating(), {
      id: 's3',
      label: 'Higher reserve',
      capexReserveMonthly: 300,
    });
    expect(out.operating.capexReserveMonthly).toBe(300);
  });
});
