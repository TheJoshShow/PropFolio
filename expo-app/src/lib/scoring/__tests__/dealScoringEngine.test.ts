/**
 * Unit tests for deal scoring engine.
 */

import { score, listMissingDealScoreRequirements } from '../dealScoringEngine';
import { bandFromScore } from '../types';

describe('DealScoringEngine', () => {
  it('listMissingDealScoreRequirements lists absent gates', () => {
    expect(listMissingDealScoreRequirements({ capRate: 0.06 })).toEqual(
      expect.arrayContaining(['DSCR', 'data confidence'])
    );
  });

  it('returns insufficientData when cap rate, cash flow, DSCR, or confidence missing', () => {
    const r = score({ capRate: 0.06 });
    expect(r.band).toBe('insufficientData');
    expect(r.totalScore).toBeNull();
  });

  it('scores a deal when cap rate, DSCR, and data confidence are present', () => {
    const r = score({
      capRate: 0.07,
      dscr: 1.35,
      dataConfidence: 0.8,
    });
    expect(r.band).not.toBe('insufficientData');
    expect(r.totalScore).toBeGreaterThanOrEqual(0);
    expect(r.totalScore).toBeLessThanOrEqual(100);
  });

  it('reduces score when data confidence is low (confidence cap can apply)', () => {
    const high = score({
      capRate: 0.08,
      annualCashFlow: 22000,
      dscr: 1.7,
      expenseRatio: 0.32,
      dataConfidence: 0.9,
    });
    const low = score({
      capRate: 0.08,
      annualCashFlow: 22000,
      dscr: 1.7,
      expenseRatio: 0.32,
      dataConfidence: 0.25,
    });
    expect(high.totalScore).toBeGreaterThan(low.totalScore ?? 0);
    expect(low.totalScore).toBeLessThanOrEqual(100);
  });
});

describe('bandFromScore', () => {
  it('maps score to band correctly', () => {
    expect(bandFromScore(95)).toBe('exceptional');
    expect(bandFromScore(80)).toBe('strong');
    expect(bandFromScore(65)).toBe('good');
    expect(bandFromScore(50)).toBe('fair');
    expect(bandFromScore(35)).toBe('weak');
    expect(bandFromScore(20)).toBe('poor');
  });
});
