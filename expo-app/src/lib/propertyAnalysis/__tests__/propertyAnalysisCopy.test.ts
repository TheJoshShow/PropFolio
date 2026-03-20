/**
 * Labels and copy: ensure every band and category returns a non-empty string.
 * Prevents "undefined" in UI for score labels and disclaimers.
 */

import {
  dealBandLabel,
  dealBandDescription,
  confidenceBandLabel,
  confidenceBandDescription,
  INSUFFICIENT_DATA_REASON,
  SCORE_SURFACE_DISCLAIMER,
  DISCLAIMER_COPY,
} from '../propertyAnalysisCopy';
import type { DealBand, ConfidenceBand } from '../propertyAnalysisTypes';

describe('propertyAnalysisCopy', () => {
  describe('dealBandLabel', () => {
    const bands: DealBand[] = [
      'exceptional',
      'strong',
      'good',
      'fair',
      'weak',
      'poor',
      'insufficientData',
    ];

    it('returns non-empty string for every DealBand', () => {
      bands.forEach((band) => {
        const label = dealBandLabel(band);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('returns fallback for unknown band', () => {
      const label = dealBandLabel('unknown' as DealBand);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label).toBe('Insufficient data');
    });
  });

  describe('dealBandDescription', () => {
    it('returns non-empty string for every DealBand', () => {
      const bands: DealBand[] = [
        'exceptional',
        'strong',
        'good',
        'fair',
        'weak',
        'poor',
        'insufficientData',
      ];
      bands.forEach((band) => {
        const desc = dealBandDescription(band);
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe('confidenceBandLabel', () => {
    const bands: ConfidenceBand[] = ['high', 'medium', 'low', 'veryLow'];

    it('returns non-empty string for every ConfidenceBand', () => {
      bands.forEach((band) => {
        const label = confidenceBandLabel(band);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('returns fallback for unknown band', () => {
      const label = confidenceBandLabel('unknown' as ConfidenceBand);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label).toBe('Very low');
    });
  });

  describe('confidenceBandDescription', () => {
    it('returns non-empty string for every ConfidenceBand', () => {
      const bands: ConfidenceBand[] = ['high', 'medium', 'low', 'veryLow'];
      bands.forEach((band) => {
        const desc = confidenceBandDescription(band);
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe('constants', () => {
    it('INSUFFICIENT_DATA_REASON is non-empty', () => {
      expect(typeof INSUFFICIENT_DATA_REASON).toBe('string');
      expect(INSUFFICIENT_DATA_REASON.length).toBeGreaterThan(0);
    });

    it('SCORE_SURFACE_DISCLAIMER is non-empty and includes key phrases', () => {
      expect(typeof SCORE_SURFACE_DISCLAIMER).toBe('string');
      expect(SCORE_SURFACE_DISCLAIMER.length).toBeGreaterThan(0);
      expect(SCORE_SURFACE_DISCLAIMER).toContain('model outputs');
      expect(SCORE_SURFACE_DISCLAIMER).toContain('not investment advice');
    });

    it('DISCLAIMER_COPY is non-empty', () => {
      expect(typeof DISCLAIMER_COPY).toBe('string');
      expect(DISCLAIMER_COPY.length).toBeGreaterThan(0);
    });
  });
});
