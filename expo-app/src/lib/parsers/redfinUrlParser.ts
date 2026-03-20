/**
 * Parses Redfin desktop, mobile, and common URL shapes. Extracts listing ID and address.
 */

import type { PartialAddress, ParsedListingURL, ParseURLResult } from './types';
import { slugToAddressLine } from './slugToAddressLine';
import { getHostname } from './listingUrlNormalize';
import { isRedfinHost } from './listingProviders';

function getQueryParam(u: URL, key: string): string | null {
  return u.searchParams.get(key);
}

function partialFromSlug(slug: string): PartialAddress | null {
  const line = slugToAddressLine(slug);
  if (!line) return null;
  const parts = line.split(',').map((p) => p.trim());
  if (parts.length >= 3) {
    const tail = parts[parts.length - 1]?.split(/\s+/) ?? [];
    const zip = tail.find((x) => /^\d{5}/.test(x)) ?? null;
    const state = tail.find((x) => /^[A-Z]{2}$/.test(x)) ?? null;
    return {
      streetAddress: parts[0] ?? null,
      city: parts[1] ?? null,
      state,
      postalCode: zip,
    };
  }
  return { streetAddress: line, city: null, state: null, postalCode: null };
}

/**
 * Redfin paths often: /ST/City/street-zip/home/id or /ST/City/address-slug/home/id
 */
function extractListingIdFromComponents(components: string[]): string | null {
  const homeIdx = components.findIndex((c) => c.toLowerCase() === 'home');
  if (homeIdx >= 0 && components[homeIdx + 1] && /^\d+$/.test(components[homeIdx + 1])) {
    return components[homeIdx + 1];
  }
  const last = components[components.length - 1];
  if (last && /^\d+$/.test(last) && components.length >= 2) {
    const prev = components[components.length - 2]?.toLowerCase();
    if (prev === 'home' || prev === 'unit') return last;
  }
  if (last && /^\d{6,12}$/.test(last)) return last;
  return null;
}

function findAddressSlug(components: string[]): string | null {
  const homeIdx = components.findIndex((c) => c.toLowerCase() === 'home');
  if (homeIdx > 0) {
    const candidate = components[homeIdx - 1];
    if (candidate?.includes('-') && candidate.length > 5) return candidate;
  }
  const slug = components.find(
    (c) => c.includes('-') && c.length > 5 && !/^\d+$/.test(c) && c.toLowerCase() !== 'home'
  );
  return slug ?? null;
}

export function parseRedfinUrl(urlString: string): ParseURLResult {
  const host = getHostname(urlString);
  if (!host || !isRedfinHost(host)) {
    return { ok: false, error: { kind: 'unsupportedDomain' } };
  }

  try {
    const u = new URL(urlString);
    let listingID: string | null =
      getQueryParam(u, 'listingId') ??
      getQueryParam(u, 'listing_id') ??
      getQueryParam(u, 'listingID');

    const components = u.pathname.replace(/\/$/, '').split('/').filter(Boolean);

    if (!listingID) {
      listingID = extractListingIdFromComponents(components);
    }

    if (!listingID || listingID.length === 0) {
      return { ok: false, error: { kind: 'missingListingID' } };
    }

    const slug = findAddressSlug(components);
    const address = slug ? partialFromSlug(slug) : null;

    return {
      ok: true,
      value: {
        source: 'redfin',
        listingID,
        address,
        originalURL: urlString,
      },
    };
  } catch {
    return { ok: false, error: { kind: 'missingListingID' } };
  }
}

export function redfinAddressLineForImport(parsed: ParsedListingURL): string | null {
  try {
    const u = new URL(parsed.originalURL);
    const components = u.pathname.split('/').filter(Boolean);
    const slug = findAddressSlug(components);
    if (slug) {
      const line = slugToAddressLine(slug);
      if (line.trim()) return line.trim();
    }
  } catch {
    /* ignore */
  }
  const a = parsed.address;
  if (a) {
    const parts = [a.streetAddress, a.city, a.state, a.postalCode].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  return null;
}
