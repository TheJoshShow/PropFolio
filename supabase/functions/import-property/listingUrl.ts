/**
 * Listing URL normalization + light parsing (extensible for future scrapers).
 * Does not scrape HTML — only URL structure.
 */

export type ListingProvider = 'zillow' | 'redfin';

export type ListingParseResult = {
  provider: ListingProvider;
  canonicalUrl: string;
  externalIds: { zpid?: string; redfinListingId?: string };
  /** Heuristic address string from path slug; may be wrong — user should confirm via Places */
  addressHint: string | null;
  parsingStatus: 'ok' | 'partial' | 'unrecognized_host';
};

const MAX_URL_LENGTH = 2048;

export function sanitizeListingUrl(raw: string): string {
  const t = raw.trim().slice(0, MAX_URL_LENGTH);
  if (!/^https?:\/\//i.test(t)) {
    return `https://${t}`;
  }
  return t;
}

export type UnsupportedListingHost = { unsupported: true; message: string };

export function parseListingUrl(
  rawInput: string,
): ListingParseResult | UnsupportedListingHost | null {
  const urlStr = sanitizeListingUrl(rawInput);
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return null;
    }
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    u.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref', 'fbclid'].forEach((p) =>
      u.searchParams.delete(p)
    );
    const canonicalUrl = u.toString();

    if (host.includes('zillow.com')) {
      return parseZillow(u, canonicalUrl);
    }
    if (host.includes('redfin.com')) {
      return parseRedfin(u, canonicalUrl);
    }

    return {
      unsupported: true,
      message: 'Only Zillow or Redfin listing links are supported for paste import.',
    };
  } catch {
    return null;
  }
}

function slugToHint(slug: string): string | null {
  if (!slug || slug.length < 4) {
    return null;
  }
  const cleaned = slug.replace(/\.htm.*$/i, '').replace(/_zpid$/i, '');
  const hint = cleaned.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  return hint.length >= 6 ? hint : null;
}

function parseZillow(u: URL, canonicalUrl: string): ListingParseResult {
  const path = u.pathname;
  const zpidMatch = path.match(/(\d+)(?:_zpid)?\/?$/i);
  const zpid = zpidMatch ? zpidMatch[1] : undefined;

  let addressHint: string | null = null;
  const hd = path.split('/').filter(Boolean);
  const hi = hd.indexOf('homedetails');
  if (hi >= 0 && hd[hi + 1]) {
    addressHint = slugToHint(hd[hi + 1]);
  }

  return {
    provider: 'zillow',
    canonicalUrl,
    externalIds: { zpid },
    addressHint,
    parsingStatus: zpid || addressHint ? 'ok' : 'partial',
  };
}

function parseRedfin(u: URL, canonicalUrl: string): ListingParseResult {
  const path = u.pathname;
  const homeMatch = path.match(/\/home\/(\d+)/i);
  const redfinListingId = homeMatch ? homeMatch[1] : undefined;

  let addressHint: string | null = null;
  const parts = path.split('/').filter(Boolean);
  const homeIdx = parts.indexOf('home');
  if (homeIdx > 0) {
    const slug = parts[homeIdx - 1];
    if (slug && slug !== 'home') {
      addressHint = slugToHint(slug);
    }
  }

  return {
    provider: 'redfin',
    canonicalUrl,
    externalIds: { redfinListingId },
    addressHint,
    parsingStatus: redfinListingId || addressHint ? 'ok' : 'partial',
  };
}
