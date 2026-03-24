/**
 * Property detail analysis service: contract and behavior.
 */

import * as simulationEngine from '../../../lib/simulation/simulationEngine';
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
    expect(result.pipelineError).toBeUndefined();
  });

  it('produces a numeric deal score when rent, price, and defaults are present', () => {
    const result = runPropertyDetailAnalysis(baseInput);

    expect(result.dealScore.totalScore).toBeDefined();
    if (result.dealScore.totalScore != null) {
      expect(result.dealScore.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.dealScore.totalScore).toBeLessThanOrEqual(100);
    }
  });

  it('infers list price from rent when listPrice is missing so scoring can run', () => {
    const input: PropertyDetailAnalysisInput = {
      ...baseInput,
      listPrice: null,
    };
    const result = runPropertyDetailAnalysis(input);

    expect(result.dealScore.band).not.toBe('insufficientData');
    expect(result.dealScore.totalScore).not.toBeNull();
    expect(result.assumptions.some((a) => a.id === 'inferred_list_price')).toBe(true);
  });

  it('infers rent from list price when rent is missing', () => {
    const input: PropertyDetailAnalysisInput = {
      ...baseInput,
      rent: null,
    };
    const result = runPropertyDetailAnalysis(input);

    expect(result.dealScore.band).not.toBe('insufficientData');
    expect(result.dealScore.totalScore).not.toBeNull();
    expect(result.assumptions.some((a) => a.id === 'inferred_rent')).toBe(true);
  });

  it('returns insufficientData when both price and rent are missing', () => {
    const result = runPropertyDetailAnalysis({
      ...baseInput,
      listPrice: null,
      rent: null,
    });
    expect(result.dealScore.band).toBe('insufficientData');
    expect(result.dealScore.totalScore).toBeNull();
  });

  it('is deterministic for same input', () => {
    const a = runPropertyDetailAnalysis(baseInput);
    const b = runPropertyDetailAnalysis(baseInput);

    expect(a.dealScore.totalScore).toBe(b.dealScore.totalScore);
    expect(a.confidence.score).toBe(b.confidence.score);
  });

  it('returns pipelineError instead of throwing when simulation throws', () => {
    const spy = jest.spyOn(simulationEngine, 'run').mockImplementation(() => {
      throw new Error('sim boom');
    });
    try {
      const result = runPropertyDetailAnalysis(baseInput);
      expect(result.pipelineError).toBe('sim boom');
      expect(result.dealScore.band).toBe('insufficientData');
    } finally {
      spy.mockRestore();
    }
  });
});
