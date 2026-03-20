/**
 * Property detail analysis service: contract and behavior.
 */

import { runPropertyDetailAnalysis } from '../property_detail_analysis_service';
import type { PropertyDetailAnalysisInput } from '../property_detail_types';

describe('runPropertyDetailAnalysis', () => {
  const baseInput: PropertyDetailAnalysisInput = {
    listPrice: 300_000,
    rent: 2500,
    streetAddress: '123 Main St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
  };

  it('returns result with dealScore, confidence, keyMetrics, flags, assumptions', () => {
    const result = runPropertyDetailAnalysis(baseInput);

    expect(result.dealScore).toBeDefined();
    expect(result.dealScore.band).toBeDefined();
    expect(result.dealScore.components).toBeDefined();
    expect(result.dealScore.explanationSummary).toBeDefined();
    expect(typeof result.dealScore.wasCappedByConfidence).toBe('boolean');

    expect(result.confidence).toBeDefined();
    expect(result.confidence.score).toBeGreaterThanOrEqual(0);
    expect(result.confidence.score).toBeLessThanOrEqual(100);
    expect(result.confidence.recommendedActions).toBeInstanceOf(Array);

    expect(result.keyMetrics).toBeDefined();
    expect(result.riskFlags).toBeInstanceOf(Array);
    expect(result.strengthFlags).toBeInstanceOf(Array);
    expect(result.assumptions).toBeInstanceOf(Array);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it('produces a numeric deal score when rent, price, and defaults are present', () => {
    const result = runPropertyDetailAnalysis(baseInput);

    expect(result.dealScore.totalScore).toBeDefined();
    if (result.dealScore.totalScore != null) {
      expect(result.dealScore.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.dealScore.totalScore).toBeLessThanOrEqual(100);
    }
  });

  it('returns insufficientData when listPrice is missing', () => {
    const input: PropertyDetailAnalysisInput = {
      ...baseInput,
      listPrice: null,
    };
    const result = runPropertyDetailAnalysis(input);

    expect(result.dealScore.band).toBe('insufficientData');
    expect(result.dealScore.totalScore).toBeNull();
  });

  it('is deterministic for same input', () => {
    const a = runPropertyDetailAnalysis(baseInput);
    const b = runPropertyDetailAnalysis(baseInput);

    expect(a.dealScore.totalScore).toBe(b.dealScore.totalScore);
    expect(a.confidence.score).toBe(b.confidence.score);
  });
});
