/**
 * Listing import: re-exports pure core + bounded network (redirects / short links).
 */

import {
  canonicalizeListingUrlForParser,
  extractListingCandidatesFromPaste,
  extractFirstUrlFromPastedText,
  hostnameIsRedfin,
  hostnameIsZillow,
  isRedfinNonPropertyPath,
  isZillowNonPropertyPath,
  MAX_URL_LENGTH,
  type ListingParseResult,
  parseListingUrl,
  sanitizeListingUrl,
  shouldAttemptRedirectResolution,
  type UnsupportedListingHost,
} from '../_shared/listingUrlCore.ts';

export type {
  ListingParseResult,
  ListingProvider,
  UnsupportedListingHost,
} from '../_shared/listingUrlCore.ts';
export {
  canonicalizeListingUrlForParser,
  extractListingCandidatesFromPaste,
  extractFirstUrlFromPastedText,
  hostnameIsRedfin,
  hostnameIsZillow,
  isRedfinNonPropertyPath,
  isZillowNonPropertyPath,
  MAX_URL_LENGTH,
  parseListingUrl,
  sanitizeListingUrl,
  shouldAttemptRedirectResolution,
} from '../_shared/listingUrlCore.ts';

const REDIRECT_TIMEOUT_MS = 6_500;
/**
 * Cap total listing prep (short links + redirect follows + parse) so a stuck Zillow/Redfin fetch
 * cannot block the edge function until the client gateway times out.
 * Must exceed worst-case: several candidates × (HEAD 6.5s + GET 6.5s) ≈ 13s each.
 */
const LISTING_PREP_TOTAL_BUDGET_MS = 60_000;

/**
 * Short-link hosts we may follow to reach Zillow/Redfin. Add new entries only after verifying
 * redirects are stable and typically land on listing domains (avoid generic shorteners that go anywhere).
 */
const SHORT_LINK_HOSTNAMES = new Set([
  'bit.ly',
  'bitly.com',
  'tinyurl.com',
  /** Redfin app / SMS share links — resolves to www.redfin.com/…/home/… */
  'redf.in',
]);

function shortLinkHostAllowlisted(hostname: string): boolean {
  const h = hostname.replace(/^www\./, '').toLowerCase();
  if (SHORT_LINK_HOSTNAMES.has(h)) return true;
  if (h.endsWith('.bit.ly')) return true;
  return false;
}

async function fetchFinalUrlAfterRedirects(urlStr: string): Promise<string | null> {
  try {
    const ctrl = AbortSignal.timeout(REDIRECT_TIMEOUT_MS);
    const res = await fetch(urlStr, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ctrl,
      headers: { 'User-Agent': 'PropFolioImport/1.0' },
    });
    const finalUrl = res.url?.slice(0, MAX_URL_LENGTH);
    if (finalUrl && /^https?:\/\//i.test(finalUrl)) {
      return finalUrl;
    }
  } catch {
    /* HEAD blocked */
  }
  try {
    const ctrl = AbortSignal.timeout(REDIRECT_TIMEOUT_MS);
    const res = await fetch(urlStr, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl,
      headers: { 'User-Agent': 'Mozilla/5.0 PropFolioImport/1.0', Range: 'bytes=0-0' },
    });
    const finalUrl = res.url?.slice(0, MAX_URL_LENGTH);
    if (finalUrl && /^https?:\/\//i.test(finalUrl)) {
      return finalUrl;
    }
  } catch {
    return null;
  }
  return null;
}

/** Unwrap allowlisted short link; return null if final URL is not zillow/redfin. */
export async function expandAllowlistedShortLink(urlStr: string): Promise<string | null> {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  if (!shortLinkHostAllowlisted(host)) {
    return null;
  }
  const finalUrl = await fetchFinalUrlAfterRedirects(urlStr);
  if (!finalUrl) {
    return null;
  }
  try {
    const fh = new URL(finalUrl).hostname.replace(/^www\./, '').toLowerCase();
    if (hostnameIsZillow(fh) || hostnameIsRedfin(fh)) {
      return finalUrl;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Best-effort redirect resolution for share/middleware URLs on zillow.com / redfin.com only.
 */
export async function resolveListingUrlWithRedirectCap(urlStr: string): Promise<string> {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return urlStr;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return urlStr;
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  if (!hostnameIsZillow(host) && !hostnameIsRedfin(host)) {
    return urlStr;
  }
  const out = await fetchFinalUrlAfterRedirects(urlStr);
  return out ?? urlStr;
}

type TryOneResult =
  | { ok: true; parsed: ListingParseResult; resolvedUrl: string }
  | { ok: false; unsupported: UnsupportedListingHost }
  | { ok: false; invalid: true };

async function tryPrepareOneListingCandidate(initial: string): Promise<TryOneResult> {
  let working = sanitizeListingUrl(initial);

  let u: URL;
  try {
    u = new URL(working);
  } catch {
    return { ok: false, invalid: true };
  }

  const host0 = u.hostname.replace(/^www\./, '').toLowerCase();
  if (shortLinkHostAllowlisted(host0)) {
    const expanded = await expandAllowlistedShortLink(working);
    if (!expanded) {
      return { ok: false, invalid: true };
    }
    working = canonicalizeListingUrlForParser(expanded);
    try {
      u = new URL(working);
    } catch {
      return { ok: false, invalid: true };
    }
  }

  working = canonicalizeListingUrlForParser(working);
  try {
    u = new URL(working);
  } catch {
    return { ok: false, invalid: true };
  }

  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  if (!hostnameIsZillow(host) && !hostnameIsRedfin(host)) {
    return { ok: false, invalid: true };
  }

  if (hostnameIsZillow(host) && isZillowNonPropertyPath(u.pathname)) {
    return {
      ok: false,
      unsupported: {
        unsupported: true,
        message:
          'This Zillow page isn’t a listing we can import (search, neighborhood, or agent page). Open the property listing and copy that link.',
        code: 'UNSUPPORTED_PAGE',
      },
    };
  }
  if (hostnameIsRedfin(host) && isRedfinNonPropertyPath(u.pathname)) {
    return {
      ok: false,
      unsupported: {
        unsupported: true,
        message:
          'This Redfin page isn’t a home listing we can import (search area or filter page). Open the property detail page and copy its link.',
        code: 'UNSUPPORTED_PAGE',
      },
    };
  }

  if (shouldAttemptRedirectResolution(u)) {
    working = await resolveListingUrlWithRedirectCap(working);
  }

  const parsed = parseListingUrl(working);
  if (!parsed) {
    return { ok: false, invalid: true };
  }
  if ('unsupported' in parsed) {
    return { ok: false, unsupported: parsed };
  }
  return { ok: true, parsed, resolvedUrl: working };
}

async function prepareListingUrlForImportUnbounded(raw: string): Promise<{
  parsed: ListingParseResult | UnsupportedListingHost | null;
  resolvedUrl: string;
}> {
  const candidates = extractListingCandidatesFromPaste(raw);
  if (candidates.length === 0 && raw.trim()) {
    candidates.push(raw.trim());
  }

  let lastUnsupported: UnsupportedListingHost | null = null;

  for (const cand of candidates) {
    const result = await tryPrepareOneListingCandidate(cand);
    if (result.ok) {
      return { parsed: result.parsed, resolvedUrl: result.resolvedUrl };
    }
    if ('unsupported' in result && result.unsupported) {
      lastUnsupported = result.unsupported;
      continue;
    }
  }

  if (lastUnsupported) {
    return { parsed: lastUnsupported, resolvedUrl: '' };
  }
  return {
    parsed: null,
    resolvedUrl: '',
  };
}

export async function prepareListingUrlForImport(raw: string): Promise<{
  parsed: ListingParseResult | UnsupportedListingHost | null;
  resolvedUrl: string;
}> {
  return await Promise.race([
    prepareListingUrlForImportUnbounded(raw),
    new Promise<{ parsed: null; resolvedUrl: string }>((resolve) =>
      setTimeout(
        () => resolve({ parsed: null, resolvedUrl: '' }),
        LISTING_PREP_TOTAL_BUDGET_MS,
      ),
    ),
  ]);
}
