import {
  normalizeListingUrl,
  preprocessListingPaste,
  parseListingImportForImport,
  parseListingImportForImportAsync,
  parseZillowUrl,
  parseRedfinUrl,
} from '../index';

describe('preprocessListingPaste', () => {
  it('strips BOM, collapses newlines and extra spaces', () => {
    expect(
      preprocessListingPaste('\uFEFF  https://www.zillow.com/foo \n bar  ')
    ).toBe('https://www.zillow.com/foo bar');
  });

  it('unwraps parentheses and quotes', () => {
    expect(preprocessListingPaste('("https://www.redfin.com/TX/Austin/x/home/1")')).toBe(
      'https://www.redfin.com/TX/Austin/x/home/1'
    );
    expect(preprocessListingPaste(`'https://zillow.com/homedetails/a/1_zpid/'`)).toBe(
      'https://zillow.com/homedetails/a/1_zpid/'
    );
  });
});

describe('normalizeListingUrl', () => {
  it('adds https and strips tracking params', () => {
    const u = normalizeListingUrl(
      'www.zillow.com/homedetails/foo?utm_source=email&gclid=1#reviews'
    );
    expect(u).toContain('https://');
    expect(u).not.toContain('utm_source');
    expect(u).not.toContain('gclid');
    expect(u).not.toContain('#');
  });

  it('lowercases hostname and handles mixed-case path segments', () => {
    const u = normalizeListingUrl(
      'HTTPS://WWW.ZILLOW.COM/homedetails/123-Main-St-Austin-TX-78701/205878656_zpid/'
    );
    expect(u).toMatch(/^https:\/\/www\.zillow\.com\//i);
    expect(u?.toLowerCase()).toContain('www.zillow.com');
  });

  it('accepts host without www and trims trailing slash on path', () => {
    const u = normalizeListingUrl('zillow.com/homedetails/foo-bar/205878656_zpid/');
    expect(u).toBe(
      'https://zillow.com/homedetails/foo-bar/205878656_zpid'
    );
  });

  it('strips utm_* keys case-insensitively', () => {
    const u = normalizeListingUrl(
      'https://www.redfin.com/TX/Austin/x/home/1?utm_medium=share&UTM_CAMPAIGN=x'
    );
    expect(u).not.toContain('utm');
  });

  it('returns null for garbage', () => {
    expect(normalizeListingUrl('not a url')).toBeNull();
  });

  it('prepends https for common pasted host/path without protocol', () => {
    const u = normalizeListingUrl('www.redfin.com/TX/Austin/123-Main-St-78701/home/77345678');
    expect(u).toMatch(/^https:\/\//);
  });
});

describe('parseZillowUrl', () => {
  it('parses standard homedetails URL with _zpid path', () => {
    const url =
      'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/205878656_zpid/';
    const r = parseZillowUrl(url);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.listingID).toBe('205878656');
      expect(r.value.source).toBe('zillow');
    }
  });

  it('parses zpid from query when path is minimal', () => {
    const url = 'https://www.zillow.com/homedetails/foo-bar/?zpid=12345678';
    const r = parseZillowUrl(url);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.listingID).toBe('12345678');
  });

  it('parses numeric zpid from p query param', () => {
    const url = 'https://www.zillow.com/homedetails/foo/?p=205878656';
    const r = parseZillowUrl(url);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.listingID).toBe('205878656');
  });

  it('accepts m.zillow.com', () => {
    const url =
      'https://m.zillow.com/homedetails/123-Main-St-Austin-TX-78701/205878656_zpid/';
    const r = parseZillowUrl(url);
    expect(r.ok).toBe(true);
  });

  it('extracts zpid from slug_zpid segment (street number must not become zpid)', () => {
    const url =
      'https://www.zillow.com/homedetails/8216-S-Maryland-Ave-Chicago-IL-60619_9876543210_zpid/';
    const r = parseZillowUrl(url);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.listingID).toBe('9876543210');
  });
});

describe('parseRedfinUrl', () => {
  it('parses standard /home/id path', () => {
    const url =
      'https://www.redfin.com/TX/Austin/123-Main-St-78701/home/77345678';
    const r = parseRedfinUrl(url);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.listingID).toBe('77345678');
  });

  it('accepts mobile.redfin.com', () => {
    const url =
      'https://mobile.redfin.com/TX/Austin/123-Main-St-78701/home/77345678';
    const r = parseRedfinUrl(url);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.listingID).toBe('77345678');
  });

  it('parses listingId query param', () => {
    const url = 'https://www.redfin.com/TX/Austin/foo/home?utm_medium=share&listingId=999';
    const r = parseRedfinUrl(url);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.listingID).toBe('999');
  });

  it('accepts redfin.com without www', () => {
    const url = 'https://redfin.com/TX/Austin/123-Main-St-78701/home/77345678';
    const r = parseRedfinUrl(url);
    expect(r.ok).toBe(true);
  });
});

describe('parseListingImportForImport', () => {
  it('returns zillow provider and address line for homedetails URL', () => {
    const r = parseListingImportForImport(
      'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/205878656_zpid/'
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.provider).toBe('zillow');
      expect(r.addressLine).toContain('78701');
      expect(r.listingId).toBe('205878656');
    }
  });

  it('normalizes pasted whitespace before parsing', () => {
    const r = parseListingImportForImport(
      `\n  https://WWW.ZILLOW.COM/homedetails/123-Main-St-Austin-TX-78701/205878656_zpid/  `
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.provider).toBe('zillow');
  });

  it('returns redfin for mobile host with tracking params', () => {
    const r = parseListingImportForImport(
      'https://mobile.redfin.com/TX/Austin/123-Main-St-78701/home/77345678?fbclid=1'
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.provider).toBe('redfin');
      expect(r.listingId).toBe('77345678');
    }
  });

  it('does not resolve short links — rfr.io stays unsupported until async pipeline', () => {
    const r = parseListingImportForImport('https://rfr.io/abc123');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unsupported');
  });

  it('returns unsupported for realtor.com', () => {
    const r = parseListingImportForImport('https://www.realtor.com/realestateandhomes-detail/123');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unsupported');
  });

  it('returns invalid_url for non-url text', () => {
    const r = parseListingImportForImport(':::');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_url');
  });

  it('returns missing_address for Zillow browse URL without zpid', () => {
    const r = parseListingImportForImport('https://www.zillow.com/browse/homes/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('missing_address');
  });
});

describe('parseListingImportForImportAsync', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('resolves allowlisted short link via fetch to Redfin listing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      url: 'https://www.redfin.com/TX/Austin/123-Main-St-78701/home/77345678',
      text: async () => '',
    }) as unknown as typeof fetch;

    const r = await parseListingImportForImportAsync('https://rfr.io/abc123');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.provider).toBe('redfin');
      expect(r.listingId).toBe('77345678');
    }
    expect(global.fetch).toHaveBeenCalled();
  });

  it('resolves zillow.me hop to Zillow homedetails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      url: 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/205878656_zpid/',
      text: async () => '',
    }) as unknown as typeof fetch;

    const r = await parseListingImportForImportAsync('https://zillow.me/xyz');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.provider).toBe('zillow');
      expect(r.listingId).toBe('205878656');
    }
  });

  it('falls back to sync behavior when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;

    const r = await parseListingImportForImportAsync('https://rfr.io/abc');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unsupported');
  });

  it('does not fetch for direct Zillow URLs', async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    const r = await parseListingImportForImportAsync(
      'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/205878656_zpid/'
    );
    expect(r.ok).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
