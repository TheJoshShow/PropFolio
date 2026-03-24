/**
 * Parses Zillow desktop, mobile, and common URL shapes. Extracts zpid and address.
 */

import type { PartialAddress, ParsedListingURL, ParseURLResult } from './types';
import { slugToAddressLine } from './slugToAddressLine';
import { getHostname } from './listingUrlNormalize';
import { isZillowHost } from './listingProviders';

/**
 * Extract zpid from a path segment ending in `_zpid`.
 * Uses the last run of digits before `_zpid` so slug-prefixed segments like
 * `8216-S-Maryland-Ave-..._205878656_zpid` resolve to the real zpid, not the street number.
 */
function zpidFromPathComponent(segment: string): string | null {
  const m = segment.match(/(\d+)_zpid$/i);
  return m?.[1] && /^\d+$/.test(m[1]) ? m[1] : null;
}

/**
 * Address slug from a path segment that includes `_zpid` (e.g. `123-Main-St-Chicago-IL-60619_12345_zpid`).
 */
function slugFromZpidSegment(segment: string): string | null {
  if (!segment.includes('_zpid')) return null;
  const beforeZpid = segment.split('_zpid')[0] ?? '';
  if (!beforeZpid.includes('-') || beforeZpid.length < 6) return null;
  const numericTail = beforeZpid.match(/^(.+)-(\d{5}(?:-\d{4})?)$/);
  if (numericTail?.[1]) return beforeZpid;
  return beforeZpid;
}

/** Find homedetails address slug (before _zpid segment). */
function findHomedetailsSlug(components: string[]): string | null {
  const hi = components.findIndex((c) => c.toLowerCase() === 'homedetails');
  if (hi >= 0 && components[hi + 1]) {
    const next = components[hi + 1];
    if (!next.includes('_zpid')) {
      if (next.includes('-') && next.length > 5) return next;
    } else {
      const fromCombined = slugFromZpidSegment(next);
      if (fromCombined) return fromCombined;
    }
  }
  const slug = components.find(
    (c) => c.includes('-') && !c.includes('_zpid') && !/^\d+$/.test(c) && c.length > 5
  );
  if (slug) return slug;
  const combined = components.find((c) => c.includes('_zpid') && c.includes('-'));
  if (combined) {
    const s = slugFromZpidSegment(combined);
    if (s) return s;
  }
  return null;
}

function partialAddressFromSlug(slug: string): PartialAddress | null {
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

export function parseZillowUrl(urlString: string): ParseURLResult {
  const host = getHostname(urlString);
  if (!host || !isZillowHost(host)) {
    return { ok: false, error: { kind: 'unsupportedDomain' } };
  }

  try {
    const u = new URL(urlString);
    const path = u.pathname.replace(/\/$/, '');
    const components = path.split('/').filter(Boolean);

    let zpid: string | null =
      u.searchParams.get('zpid') ||
      u.searchParams.get('zpids')?.split(',')[0]?.trim() ||
      null;
    if (!zpid) {
      const p = u.searchParams.get('p');
      if (p && /^\d+$/.test(p)) zpid = p;
    }

    if (!zpid) {
      for (const c of components) {
        const z = zpidFromPathComponent(c);
        if (z) {
          zpid = z;
          break;
        }
      }
    }

    if (!zpid) {
      const all = [...path.matchAll(/(\d+)_zpid/gi)];
      const last = all[all.length - 1];
      if (last?.[1]) zpid = last[1];
    }

    if (!zpid || !/^\d+$/.test(zpid)) {
      return { ok: false, error: { kind: 'missingListingID' } };
    }

    const slug = findHomedetailsSlug(components);
    let address: PartialAddress | null = null;
    if (slug) {
      address = partialAddressFromSlug(slug);
    }

    const value: ParsedListingURL = {
      source: 'zillow',
      listingID: zpid,
      address,
      originalURL: urlString,
    };
    return { ok: true, value };
  } catch {
    return { ok: false, error: { kind: 'missingListingID' } };
  }
}

/** Best single-line address for import / geocode (slug → formatted line first; then partial address). */
export function zillowAddressLineForImport(parsed: ParsedListingURL): string | null {
  try {
    const u = new URL(parsed.originalURL);
    const components = u.pathname.split('/').filter(Boolean);
    const slug = findHomedetailsSlug(components);
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
