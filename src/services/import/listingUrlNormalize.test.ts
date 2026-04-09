import { describe, expect, it } from 'vitest';

import {
  clipListingPasteForSubmit,
  extractListingCandidatesFromPaste,
  extractListingUrlFromPaste,
  inferPrimaryListingHost,
  listingPasteLooksActionable,
  listingPasteLooksActionableRedfin,
  listingPasteLooksActionableZillow,
} from './listingUrlNormalize';

describe('listingUrlNormalize', () => {
  it('extracts multiple candidates in document order', () => {
    const raw =
      'Search first https://www.zillow.com/homes/60601 then listing https://www.zillow.com/homedetails/123-Main-St/98765432_zpid/';
    const c = extractListingCandidatesFromPaste(raw);
    expect(c.length).toBeGreaterThanOrEqual(2);
    expect(c[0]).toContain('/homes/');
    expect(c.some((x) => x.includes('homedetails'))).toBe(true);
  });

  it('extracts Zillow URL from iMessage-style paste', () => {
    const raw =
      'Check this out https://www.zillow.com/homedetails/123-Main-St-Chicago-IL-60653/12345678_zpid/?utm_source=foo ok';
    expect(extractListingUrlFromPaste(raw)).toContain('zillow.com/homedetails');
  });

  it('extracts Redfin URL surrounded by newlines and brackets', () => {
    const raw = 'Property:\n(https://www.redfin.com/IL/Chicago/123-Main-St-60601/home/1234567)\nThanks';
    expect(extractListingUrlFromPaste(raw)).toContain('redfin.com');
  });

  it('clipListingPasteForSubmit preserves full blob for server scanning', () => {
    const raw = 'Subject: hi\n\nSee https://www.zillow.com/homedetails/x/1_zpid/\n\n--';
    expect(clipListingPasteForSubmit(raw)).toContain('Subject: hi');
    expect(clipListingPasteForSubmit(raw)).toContain('homedetails');
  });

  it('listingPasteLooksActionable is true for messy paste with hostname', () => {
    expect(listingPasteLooksActionable('yo check zillow.com/homedetails/foo/123_zpid')).toBe(true);
  });

  it('listingPasteLooksActionable is false for empty', () => {
    expect(listingPasteLooksActionable('   ')).toBe(false);
  });

  it('listingPasteLooksActionableZillow accepts mobile host', () => {
    expect(
      listingPasteLooksActionableZillow('https://m.zillow.com/homedetails/foo/123_zpid/'),
    ).toBe(true);
  });

  it('listingPasteLooksActionableZillow rejects bare Redfin paste', () => {
    expect(listingPasteLooksActionableZillow('https://www.redfin.com/IL/Chicago/x/home/1')).toBe(
      false,
    );
  });

  it('listingPasteLooksActionableRedfin accepts www host', () => {
    expect(
      listingPasteLooksActionableRedfin('Check https://www.redfin.com/IL/Chicago/x/home/1 ok'),
    ).toBe(true);
  });

  it('listingPasteLooksActionableRedfin rejects Zillow paste', () => {
    expect(listingPasteLooksActionableRedfin('https://www.zillow.com/homedetails/x/1_zpid/')).toBe(
      false,
    );
  });

  it('inferPrimaryListingHost picks first extracted URL host in document order', () => {
    const raw =
      'see https://www.zillow.com/homedetails/123-Main-St/98765432_zpid/ and https://www.redfin.com/IL/Chicago/x/home/1';
    expect(inferPrimaryListingHost(raw)).toBe('zillow');
  });

  it('inferPrimaryListingHost returns redfin when only redfin is actionable', () => {
    expect(inferPrimaryListingHost('https://www.redfin.com/IL/Chicago/x/home/1')).toBe('redfin');
  });

  it('inferPrimaryListingHost returns null for unrelated text', () => {
    expect(inferPrimaryListingHost('hello world')).toBe(null);
  });
});
