import { buildAnalysisInputWithWhatIf, sanitizeWhatIfDraft } from '../whatIfAssumptions';

describe('whatIfAssumptions', () => {
  it('clamps values to sane ranges', () => {
    const s = sanitizeWhatIfDraft({
      useOverrides: true,
      interestRatePercent: 999,
      vacancyRatePercent: -12,
      downPaymentPercent: 1000,
    });
    expect(s.interestRatePercent).toBe(30);
    expect(s.vacancyRatePercent).toBe(0);
    expect(s.downPaymentPercent).toBe(100);
  });

  it('applies overrides into analysis input when enabled', () => {
    const result = buildAnalysisInputWithWhatIf(
      {
        listPrice: 200000,
        rent: 1800,
        streetAddress: '1 Main',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
      },
      {
        useOverrides: true,
        listPrice: 300000,
        interestRatePercent: 8,
      }
    );
    expect(result.listPrice).toBe(300000);
    expect(result.interestRateAnnual).toBe(0.08);
    expect((result.manualOverrideCount ?? 0) > 0).toBe(true);
  });
});
