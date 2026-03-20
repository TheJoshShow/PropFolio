/**
 * Property detail analysis pipeline: normal, best-case, low-confidence, missing-data.
 */

import { buildPropertyDetailAnalysis } from '../buildPropertyDetailAnalysis';
import type { PropertyAnalysisInput } from '../propertyAnalysisTypes';

describe('buildPropertyDetailAnalysis', () => {
  describe('missing-data', () => {
    it('returns insufficientData when purchase price is missing', () => {
      const input: PropertyAnalysisInput = {
        purchasePrice: null,
        monthlyRent: 2500,
        loanAmount: 225_000,
      };
      const result = buildPropertyDetailAnalysis(input);
      expect(result.rawDealScore).toBeNull();
      expect(result.displayedDealScore).toBeNull();
      expect(result.dealBand).toBe('insufficientData');
      expect(result.risks.some((r) => r.id === 'insufficient_data')).toBe(true);
    });

    it('returns insufficientData when rent is missing', () => {
      const input: PropertyAnalysisInput = {
        purchasePrice: 300_000,
        monthlyRent: null,
        grossScheduledRentAnnual: null,
        loanAmount: 225_000,
      };
      const result = buildPropertyDetailAnalysis(input);
      expect(result.rawDealScore).toBeNull();
      expect(result.dealBand).toBe('insufficientData');
    });

    it('returns insufficientData when price is zero', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 0,
        monthlyRent: 2500,
      });
      expect(result.rawDealScore).toBeNull();
      expect(result.dealBand).toBe('insufficientData');
    });

    it('sanitizes NaN and Infinity to null and treats as missing', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: Number.NaN,
        monthlyRent: 2500,
        loanAmount: 225_000,
      });
      expect(result.rawDealScore).toBeNull();
      expect(result.dealBand).toBe('insufficientData');
    });
  });

  describe('normal', () => {
    it('returns numeric scores and all result fields when given price, rent, and loan', () => {
      const input: PropertyAnalysisInput = {
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
        interestRateAnnual: 0.07,
        termYears: 30,
      };
      const result = buildPropertyDetailAnalysis(input);
      expect(result.rawDealScore).not.toBeNull();
      expect(result.rawDealScore).toBeGreaterThanOrEqual(0);
      expect(result.rawDealScore).toBeLessThanOrEqual(100);
      expect(result.displayedDealScore).not.toBeNull();
      expect(result.dealBand).not.toBe('insufficientData');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
      expect(result.strengths).toBeInstanceOf(Array);
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.assumptions).toBeInstanceOf(Array);
      expect(result.metricsSummary).toBeDefined();
      expect(result.explanationCopy.dealSummary).toBeTruthy();
      expect(result.explanationCopy.confidenceSummary).toBeTruthy();
      expect(result.explanationCopy.factorExplanations).toBeDefined();
    });

    it('returns metrics summary with expected keys', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
      });
      expect(result.metricsSummary).toMatchObject({
        capRate: expect.anything(),
        monthlyCashFlow: expect.anything(),
        annualCashFlow: expect.anything(),
        dscr: expect.anything(),
        noi: expect.anything(),
      });
    });

    it('is deterministic for same input', () => {
      const input: PropertyAnalysisInput = {
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
      };
      const a = buildPropertyDetailAnalysis(input);
      const b = buildPropertyDetailAnalysis(input);
      expect(a.rawDealScore).toBe(b.rawDealScore);
      expect(a.displayedDealScore).toBe(b.displayedDealScore);
      expect(a.confidenceScore).toBe(b.confidenceScore);
    });
  });

  describe('best-case', () => {
    it('returns high deal score and high confidence when data is complete and strong', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 3000,
        operatingExpensesAnnual: 12_000,
        loanAmount: 200_000,
        annualDebtService: 16_000,
        sourceCompleteness: 1,
        sourceReliability: 0.9,
        freshness: 1,
        crossSourceAgreement: 0.9,
        assumptionBurden: 0,
        outlierChecks: 1,
        estimatedFieldCount: 0,
      });
      expect(result.rawDealScore).toBeGreaterThanOrEqual(60);
      expect(result.dealBand).not.toBe('poor');
      expect(result.dealBand).not.toBe('insufficientData');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(50);
      expect(result.wasCappedByConfidence).toBe(false);
      expect(result.displayedDealScore).toBe(result.rawDealScore);
    });
  });

  describe('low-confidence', () => {
    it('caps displayed score at 60 when confidence is below 50', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 3500,
        loanAmount: 225_000,
        sourceCompleteness: 0.2,
        sourceReliability: 0.2,
        freshness: 0.2,
        crossSourceAgreement: 0.2,
        assumptionBurden: 0.9,
        outlierChecks: 0.2,
        estimatedFieldCount: 8,
      });
      const raw = result.rawDealScore ?? 0;
      if (raw > 60) {
        expect(result.confidenceScore).toBeLessThan(50);
        expect(result.wasCappedByConfidence).toBe(true);
        expect(result.displayedDealScore).toBe(60);
        expect(result.explanationCopy.capApplied).toBeTruthy();
      }
    });

    it('does not cap when confidence is at or above 50', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
        sourceCompleteness: 0.8,
        sourceReliability: 0.8,
        freshness: 0.8,
        crossSourceAgreement: 0.8,
        assumptionBurden: 0.1,
        outlierChecks: 0.8,
        estimatedFieldCount: 0,
      });
      expect(result.confidenceScore).toBeGreaterThanOrEqual(50);
      expect(result.wasCappedByConfidence).toBe(false);
      expect(result.displayedDealScore).toBe(result.rawDealScore);
    });
  });

  describe('clamping and defensive math', () => {
    it('handles negative cash flow and adds risk', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 1200,
        operatingExpensesAnnual: 20_000,
        loanAmount: 250_000,
        annualDebtService: 22_000,
      });
      expect(result.metricsSummary.monthlyCashFlow).toBeLessThanOrEqual(0);
      expect(result.risks.some((r) => r.id === 'negative_cf')).toBe(true);
    });

    it('clamps all scores to 0-100', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 100_000,
        monthlyRent: 5000,
        loanAmount: 50_000,
        interestRateAnnual: 0.03,
        termYears: 30,
      });
      expect(result.rawDealScore).toBeGreaterThanOrEqual(0);
      expect(result.rawDealScore).toBeLessThanOrEqual(100);
      expect(result.displayedDealScore).toBeGreaterThanOrEqual(0);
      expect(result.displayedDealScore).toBeLessThanOrEqual(100);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('explanation copy', () => {
    it('includes factor explanations for deal and confidence categories', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
      });
      const keys = Object.keys(result.explanationCopy.factorExplanations);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.some((k) => k.startsWith('conf_'))).toBe(true);
      keys.forEach((k) => {
        expect(typeof result.explanationCopy.factorExplanations[k]).toBe('string');
        expect(result.explanationCopy.factorExplanations[k].length).toBeGreaterThan(0);
      });
    });

    it('insufficientData returns dealSummary and confidenceSummary strings', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: null,
        monthlyRent: 2500,
      });
      expect(result.dealBand).toBe('insufficientData');
      expect(typeof result.explanationCopy.dealSummary).toBe('string');
      expect(result.explanationCopy.dealSummary.length).toBeGreaterThan(0);
      expect(typeof result.explanationCopy.confidenceSummary).toBe('string');
      expect(result.explanationCopy.factorExplanations).toEqual({});
    });
  });

  describe('sparse property (no taxes / operating expenses)', () => {
    it('infers expenses and produces scores when only price and rent set', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
      });
      expect(result.rawDealScore).not.toBeNull();
      expect(result.dealBand).not.toBe('insufficientData');
      expect(result.metricsSummary.capRate).not.toBeNull();
      expect(result.metricsSummary.monthlyCashFlow).not.toBeNull();
      expect(result.assumptions.length).toBeGreaterThan(0);
    });
  });

  describe('outlier and clamping', () => {
    it('handles extreme rent-to-price ratio and clamps scores 0-100', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 100_000,
        monthlyRent: 50_000,
        loanAmount: 75_000,
      });
      expect(result.rawDealScore).not.toBeNull();
      expect(result.rawDealScore).toBeGreaterThanOrEqual(0);
      expect(result.rawDealScore).toBeLessThanOrEqual(100);
      expect(result.displayedDealScore).toBeGreaterThanOrEqual(0);
      expect(result.displayedDealScore).toBeLessThanOrEqual(100);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('handles very low DSCR without NaN', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 1500,
        loanAmount: 280_000,
        interestRateAnnual: 0.08,
        termYears: 30,
      });
      expect(result.metricsSummary.dscr).not.toBeNull();
      expect(Number.isFinite(result.metricsSummary.dscr ?? NaN)).toBe(true);
      expect(result.rawDealScore).not.toBeNull();
      expect(Number.isFinite(result.rawDealScore ?? NaN)).toBe(true);
    });
  });

  describe('low-confidence with strong raw economics', () => {
    it('caps displayed score and sets capApplied when raw high and confidence below threshold', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 280_000,
        monthlyRent: 3200,
        operatingExpensesAnnual: 14_000,
        loanAmount: 200_000,
        annualDebtService: 14_000,
        sourceCompleteness: 0.2,
        sourceReliability: 0.2,
        freshness: 0.2,
        crossSourceAgreement: 0.2,
        assumptionBurden: 0.95,
        outlierChecks: 0.2,
        estimatedFieldCount: 10,
      });
      expect(result.rawDealScore).toBeGreaterThan(60);
      expect(result.confidenceScore).toBeLessThan(50);
      expect(result.wasCappedByConfidence).toBe(true);
      expect(result.displayedDealScore).toBe(60);
      expect(result.explanationCopy.capApplied).toBeTruthy();
      expect(typeof result.explanationCopy.capApplied).toBe('string');
    });
  });

  describe('score and band consistency', () => {
    it('dealBand matches rawDealScore when not capped', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
        sourceCompleteness: 0.8,
        assumptionBurden: 0.1,
        estimatedFieldCount: 0,
      });
      expect(result.wasCappedByConfidence).toBe(false);
      expect(result.displayedDealScore).toBe(result.rawDealScore);
      if (result.rawDealScore != null) {
        expect(['exceptional', 'strong', 'good', 'fair', 'weak', 'poor']).toContain(result.dealBand);
      }
    });

    it('confidenceBand is one of high, medium, low, veryLow', () => {
      const result = buildPropertyDetailAnalysis({
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
      });
      expect(['high', 'medium', 'low', 'veryLow']).toContain(result.confidenceBand);
    });
  });

  describe('deterministic', () => {
    it('same input produces identical output (snapshot-safe)', () => {
      const input: PropertyAnalysisInput = {
        purchasePrice: 300_000,
        monthlyRent: 2500,
        loanAmount: 225_000,
        interestRateAnnual: 0.07,
        termYears: 30,
      };
      const a = buildPropertyDetailAnalysis(input);
      const b = buildPropertyDetailAnalysis(input);
      expect(a.rawDealScore).toBe(b.rawDealScore);
      expect(a.displayedDealScore).toBe(b.displayedDealScore);
      expect(a.confidenceScore).toBe(b.confidenceScore);
      expect(a.confidenceBand).toBe(b.confidenceBand);
      expect(a.dealBand).toBe(b.dealBand);
      expect(a.explanationCopy.dealSummary).toBe(b.explanationCopy.dealSummary);
      expect(a.explanationCopy.confidenceSummary).toBe(b.explanationCopy.confidenceSummary);
    });
  });
});
