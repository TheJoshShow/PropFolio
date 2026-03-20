/**
 * Best-effort resolution of known short / redirect URLs to a final https URL
 * before Zillow/Redfin parsing. Safe allowlist only; no open redirect chasing.
 */

import { getHostname } from './listingUrlNormalize';

/** Hosts where one hop may reveal a Zillow/Redfin (or redirect) destination. */
const SHORT_LINK_HOST_ALLOWLIST = new Set<string>([
  'rfr.io',
  'www.rfr.io',
  'zillow.me',
  'www.zillow.me',
  'bit.ly',
  'www.bit.ly',
  'tinyurl.com',
  'www.tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
]);

function hostAllowedForResolve(host: string): boolean {
  const h = host.toLowerCase();
  if (SHORT_LINK_HOST_ALLOWLIST.has(h)) return true;
  if (h === 'bit.ly' || h.endsWith('.bit.ly')) return true;
  return false;
}

function abortAfter(ms: number): { signal: AbortSignal; cancel: () => void } {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  return {
    signal: c.signal,
    cancel: () => clearTimeout(id),
  };
}

/**
 * If URL is a known short link, follow redirects and return final URL string.
 * On failure or non-short host, returns the input unchanged.
 */
export async function resolveListingShortUrlIfNeeded(url: string): Promise<string> {
  const host = getHostname(url);
  if (!host || !hostAllowedForResolve(host)) {
    return url;
  }

  const first = abortAfter(10_000);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { Accept: '*/*' },
      signal: first.signal,
    });
    first.cancel();
    let finalUrl = res.url && res.url.length > 0 ? res.url : url;
    if (finalUrl === url || !res.ok) {
      const second = abortAfter(10_000);
      try {
        res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: second.signal,
        });
        second.cancel();
        finalUrl = res.url && res.url.length > 0 ? res.url : url;
        try {
          await res.text();
        } catch {
          /* ignore body errors */
        }
      } catch {
        second.cancel();
        return url;
      }
    }
    return finalUrl !== url ? finalUrl : url;
  } catch {
    first.cancel();
    return url;
  }
}
