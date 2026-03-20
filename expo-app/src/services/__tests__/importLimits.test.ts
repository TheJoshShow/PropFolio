import { addressToImportData, estimateListPriceFromMonthlyRent } from '../importLimits';

describe('estimateListPriceFromMonthlyRent', () => {
  it('estimates deterministically from monthly rent (default assumptions)', () => {
    // vacancy=5%, expenseRatioEGI=0.4, capRate=0.07
    // EGI annual = 2500*12*0.95 = 28500
    // NOI annual = 28500*(1-0.4) = 17100
    // price = 17100/0.07 = 244285.714 -> round = 244286
    expect(estimateListPriceFromMonthlyRent(2500)).toBe(244_286);
  });

  it('returns undefined for non-positive rent', () => {
    expect(estimateListPriceFromMonthlyRent(0)).toBeUndefined();
    expect(estimateListPriceFromMonthlyRent(-10)).toBeUndefined();
  });

  it('supports overriding assumptions deterministically', () => {
    // With capRate=0.08, price = 17100/0.08 = 213750
    expect(estimateListPriceFromMonthlyRent(2500, { capRate: 0.08 })).toBe(213_750);
  });
});

describe('addressToImportData', () => {
  it('populates listPrice when rent is provided', () => {
    const r = addressToImportData('123 Main St, Austin, TX 78701', 2500);
    expect(r.rent).toBe(2500);
    expect(r.listPrice).toBe(244_286);
  });
});

