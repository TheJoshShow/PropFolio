/**
 * Pure listing URL extraction + parsing (no network). Used by `import-property` and Vitest.
 */

export type ListingProvider = 'zillow' | 'redfin';

export type ListingParseResult = {
  provider: ListingProvider;
  canonicalUrl: string;
  externalIds: { zpid?: string; redfinListingId?: string };
  addressHint: string | null;
  parsingStatus: 'ok' | 'partial' | 'unrecognized_host';
};

export const MAX_URL_LENGTH = 2048;

const TRACKING_PARAM_PREFIXES = ['utm_', 'itc_', 'nrp_', 'scid', 'nxsid'];
const TRACKING_PARAMS = new Set([
  'si',
  'rtoken',
  'vid',
  'fromRoute',
  'fromhomes',
  'fromHomeSummaryCard',
  'fm',
  'gclid',
  'fbclid',
  'msockid',
  'ref',
  'ssid',
  'settenant',
]);

export type UnsupportedListingHost = { unsupported: true; message: string; code?: string };

function trimTrailingPunctuation(s: string): string {
  return s.replace(/[),.;>\]}]+$/, '').trim();
}

export function extractListingCandidatesFromPaste(raw: string): string[] {
  const text = raw.replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n');
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (s: string) => {
    const t = trimTrailingPunctuation(s).slice(0, MAX_URL_LENGTH);
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  const withScheme = /https?:\/\/[^\s<>"'")\]\u201d\u2019\ufffc]+/gi;
  for (const m of text.matchAll(withScheme)) {
    push(m[0].trim());
  }

  const bareHost =
    /(?:^|[\s\n(>[\]])(www\.(?:zillow|redfin)\.com[^\s<>"'")\]\u201d\u2019]*)/gi;
  for (const m of text.matchAll(bareHost)) {
    const hostPart = m[1]?.trim();
    if (hostPart) {
      push(`https://${hostPart}`);
    }
  }

  const bareZillowPath =
    /(?:^|[\s\n(>[\]])((?:zillow|redfin)\.com\/[^\s<>"'")\]\u201d\u2019]+)/gi;
  for (const m of text.matchAll(bareZillowPath)) {
    const p = m[1]?.trim();
    if (p && !p.startsWith('www.')) {
      push(`https://www.${p}`);
    }
  }

  return out;
}

export function extractFirstUrlFromPastedText(raw: string): string | null {
  const all = extractListingCandidatesFromPaste(raw);
  return all[0] ?? null;
}

export function sanitizeListingUrl(raw: string): string {
  const t = raw.trim().replace(/\u00A0/g, ' ').slice(0, MAX_URL_LENGTH);
  if (!/^https?:\/\//i.test(t)) {
    return `https://${t}`;
  }
  return t;
}

export function canonicalizeListingUrlForParser(urlStr: string): string {
  let u: URL;
  try {
    u = new URL(sanitizeListingUrl(urlStr));
  } catch {
    return urlStr.slice(0, MAX_URL_LENGTH);
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return urlStr.slice(0, MAX_URL_LENGTH);
  }
  const h = u.hostname.toLowerCase();
  if (h === 'm.zillow.com' || h === 'mobile.zillow.com' || h === 'mw2.zillow.com') {
    u.hostname = 'www.zillow.com';
  } else if (h === 'm.redfin.com' || h === 'mobile.redfin.com') {
    u.hostname = 'www.redfin.com';
  }
  return u.toString().slice(0, MAX_URL_LENGTH);
}

function stripTrackingSearchParams(u: URL): void {
  const toDelete: string[] = [];
  u.searchParams.forEach((_, key) => {
    const lower = key.toLowerCase();
    if (TRACKING_PARAMS.has(lower)) {
      toDelete.push(key);
    }
    for (const p of TRACKING_PARAM_PREFIXES) {
      if (lower.startsWith(p)) {
        toDelete.push(key);
        break;
      }
    }
  });
  for (const k of toDelete) {
    u.searchParams.delete(k);
  }
}

export function hostnameIsZillow(host: string): boolean {
  const h = host.replace(/^www\./, '').toLowerCase();
  return h === 'zillow.com' || h.endsWith('.zillow.com');
}

export function hostnameIsRedfin(host: string): boolean {
  const h = host.replace(/^www\./, '').toLowerCase();
  return h === 'redfin.com' || h.endsWith('.redfin.com');
}

export function isZillowNonPropertyPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p.includes('/zipcode/')) return true;
  if (p.includes('/homes/')) return true;
  if (p.includes('/browse/')) return true;
  if (p.includes('/profile/')) return true;
  if (p.includes('/community/')) return true;
  if (p.includes('/mortgage') || p.includes('/lender')) return true;
  if (p.includes('/rentals') && !p.includes('homedetails')) return true;
  if (p.includes('/agents/')) return true;
  if (p.includes('/apartments/')) return true;
  if (p.includes('/schools/')) return true;
  if (p.includes('/office/')) return true;
  if (p.includes('/builder/')) return true;
  if (p.includes('/discussion/')) return true;
  return false;
}

export function isRedfinNonPropertyPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p.includes('/zipcode/')) return true;
  if (p.includes('/school/')) return true;
  if (p.includes('/neighborhood/')) return true;
  if (p.includes('/popular-streets')) return true;
  if (p.includes('/popular-homes')) return true;
  if (p.includes('/filter')) return true;
  if (p.includes('/min-price') || p.includes('/max-price')) return true;
  if (p.includes('/more-')) return true;
  if (p.includes('/staging')) return true;
  if (/\/collection\//i.test(p)) return true;
  if (p.includes('/winecountry')) return true;
  const seg = p.split('/').filter(Boolean);
  if (seg.length <= 2 && /^[a-z]{2}$/i.test(seg[0] ?? '')) {
    return true;
  }
  return false;
}

function slugToHint(slug: string): string | null {
  if (!slug || slug.length < 4) {
    return null;
  }
  const cleaned = slug.replace(/\.htm.*$/i, '').replace(/_zpid$/i, '');
  const hint = cleaned.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  return hint.length >= 6 ? hint : null;
}

function zpidFromHashFragment(hash: string): string | undefined {
  const h = hash.replace(/^#/, '');
  const m =
    h.match(/zpid[=\/]?(\d{5,})/i) ??
    h.match(/[?&]zpid=(\d{5,})/i);
  const id = m?.[1];
  return id && id.length >= 5 ? id : undefined;
}

function zillowUrlHasExplicitPropertySignals(u: URL, hashZpid?: string): boolean {
  if (hashZpid) return true;
  if (u.searchParams.get('zpid')?.replace(/\D/g, '').length) return true;
  const p = u.pathname;
  if (/homedetails/i.test(p)) return true;
  if (/\d{5,}_zpid/i.test(p)) return true;
  return false;
}

export function shouldAttemptRedirectResolution(u: URL): boolean {
  const hostRaw = u.hostname.replace(/^www\./, '').toLowerCase();
  const path = u.pathname;

  if (hostnameIsZillow(hostRaw)) {
    if (isZillowNonPropertyPath(path)) return false;
    if (zillowUrlHasExplicitPropertySignals(u, zpidFromHashFragment(u.hash))) return false;
    return true;
  }
  if (hostnameIsRedfin(hostRaw)) {
    if (isRedfinNonPropertyPath(path)) return false;
    if (/\/home\/\d{4,}/i.test(path) || /-home-\d{4,}/i.test(path)) return false;
    return true;
  }
  return false;
}

function parseZillow(
  u: URL,
  canonicalUrl: string,
  hashZpid?: string,
): ListingParseResult | UnsupportedListingHost {
  const path = u.pathname;
  if (isZillowNonPropertyPath(path)) {
    return {
      unsupported: true,
      message:
        'This Zillow page isn’t a listing we can import (search, neighborhood, or agent page). Open the property listing and copy that link.',
      code: 'UNSUPPORTED_PAGE',
    };
  }

  const qpidRaw = u.searchParams.get('zpid')?.replace(/\D/g, '');
  const qpid =
    (qpidRaw && qpidRaw.length >= 5 ? qpidRaw : undefined) ??
    (hashZpid && hashZpid.length >= 5 ? hashZpid : undefined);

  const zpidFromPath =
    path.match(/(\d{5,})_zpid\/?$/i)?.[1] ??
    path.match(/\/homedetails\/[^/]+\/(\d{5,})\/?$/i)?.[1] ??
    path.match(/(\d{5,})(?:_zpid)?\/?$/i)?.[1];

  const zpid = qpid ?? zpidFromPath;

  let addressHint: string | null = null;
  const hd = path.split('/').filter(Boolean);
  const hi = hd.findIndex((s) => /homedetails/i.test(s));
  if (hi >= 0 && hd[hi + 1]) {
    addressHint = slugToHint(hd[hi + 1]!);
  }

  const hasPropertySignal = Boolean(zpid || (hi >= 0 && hd[hi + 1]));
  if (!hasPropertySignal) {
    return {
      unsupported: true,
      message:
        'We couldn’t read a property ID from this Zillow link. If it opens in the app, use “Open in Safari” and copy the URL from the address bar.',
      code: 'UNSUPPORTED_PAGE',
    };
  }

  return {
    provider: 'zillow',
    canonicalUrl,
    externalIds: { zpid },
    addressHint,
    parsingStatus: zpid || addressHint ? 'ok' : 'partial',
  };
}

function parseRedfin(u: URL, canonicalUrl: string): ListingParseResult | UnsupportedListingHost {
  const path = u.pathname;
  if (isRedfinNonPropertyPath(path)) {
    return {
      unsupported: true,
      message:
        'This Redfin page isn’t a home listing we can import (search area or filter page). Open the property detail page and copy its link.',
      code: 'UNSUPPORTED_PAGE',
    };
  }

  const qHome = u.searchParams.get('home')?.match(/(\d{4,})/)?.[1];
  const homeMatch =
    path.match(/\/home\/(\d{4,})(?:\/|$|\?)/i) ?? path.match(/\/home\/(\d{4,})/i);
  const idFromDash = path.match(/-home-(\d{4,})(?:\/|$|\?)/i);
  const redfinListingId = qHome ?? homeMatch?.[1] ?? idFromDash?.[1] ?? undefined;

  let addressHint: string | null = null;
  const parts = path.split('/').filter(Boolean);
  const homeIdx = parts.findIndex((x) => /^home$/i.test(x));
  if (homeIdx > 0) {
    const slug = parts[homeIdx - 1];
    if (slug && !/^home$/i.test(slug)) {
      addressHint = slugToHint(slug);
    }
  }

  if (!redfinListingId) {
    return {
      unsupported: true,
      message:
        'We couldn’t read a Redfin listing ID from this link. Copy the URL from the property page (it should include /home/ and numbers).',
      code: 'UNSUPPORTED_PAGE',
    };
  }

  return {
    provider: 'redfin',
    canonicalUrl,
    externalIds: { redfinListingId },
    addressHint,
    parsingStatus: 'ok',
  };
}

export function parseListingUrl(
  rawInput: string,
): ListingParseResult | UnsupportedListingHost | null {
  const urlStr = sanitizeListingUrl(rawInput);
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return null;
    }
    const hashZpid = zpidFromHashFragment(u.hash);
    u.hash = '';
    stripTrackingSearchParams(u);
    const canonicalUrl = u.toString();

    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (hostnameIsZillow(host)) {
      return parseZillow(u, canonicalUrl, hashZpid);
    }
    if (hostnameIsRedfin(host)) {
      return parseRedfin(u, canonicalUrl);
    }

    return {
      unsupported: true,
      message: 'Paste a link from Zillow or Redfin (US property listing).',
      code: 'UNSUPPORTED_HOST',
    };
  } catch {
    return null;
  }
}
