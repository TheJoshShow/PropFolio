import { describe, expect, it } from 'vitest';

import {
  canonicalizeListingUrlForParser,
  extractListingCandidatesFromPaste,
  isZillowNonPropertyPath,
  parseListingUrl,
} from '@listingUrlCore';

describe('listingUrlCore (shared with Edge)', () => {
  it('canonicalizes mobile Zillow host to www', () => {
    expect(canonicalizeListingUrlForParser('https://m.zillow.com/homedetails/a/1_zpid/')).toMatch(
      /www\.zillow\.com/,
    );
  });

  it('extracts multiple URLs from messy paste', () => {
    const raw = 'Hey\nhttps://www.zillow.com/homes/for-sale/\nand also https://www.zillow.com/homedetails/X/99999999_zpid/\n';
    const c = extractListingCandidatesFromPaste(raw);
    expect(c.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects Zillow search/browse paths quickly (sync)', () => {
    expect(isZillowNonPropertyPath('/homes/for_sale/Chicago_IL/')).toBe(true);
  });

  it('parses homedetails + zpid', () => {
    const r = parseListingUrl('https://www.zillow.com/homedetails/123-Main-St/88888888_zpid/');
    expect(r && 'provider' in r && r.provider).toBe('zillow');
    if (r && 'externalIds' in r) {
      expect(r.externalIds.zpid).toBe('88888888');
    }
  });

  it('parses Redfin /home/id', () => {
    const r = parseListingUrl('https://www.redfin.com/IL/Chicago/99-St-60601/home/12345678');
    expect(r && 'provider' in r && r.provider).toBe('redfin');
    if (r && 'externalIds' in r) {
      expect(r.externalIds.redfinListingId).toBe('12345678');
    }
  });

  it('returns unsupported for wrong host', () => {
    const r = parseListingUrl('https://example.com/foo');
    expect(r && 'unsupported' in r).toBe(true);
  });
});
