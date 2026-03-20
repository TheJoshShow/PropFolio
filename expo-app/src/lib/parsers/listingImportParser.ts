/**
 * Single entry for "paste listing link" import: normalize URL, optional short-link resolve,
 * detect provider, derive address line.
 */

import { normalizeListingUrl } from './listingUrlNormalize';
import { resolveListingShortUrlIfNeeded } from './listingUrlResolveShort';
import { parseZillowUrl, zillowAddressLineForImport } from './zillowUrlParser';
import { parseRedfinUrl, redfinAddressLineForImport } from './redfinUrlParser';
import type { ListingSource } from './types';

export type ListingImportParseResult =
  | { ok: true; provider: ListingSource; addressLine: string; normalizedUrl: string; listingId: string }
  | { ok: false; reason: 'invalid_url' | 'unsupported' | 'missing_address' };

function parseNormalizedUrl(normalizedUrl: string): ListingImportParseResult {
  const z = parseZillowUrl(normalizedUrl);
  if (z.ok) {
    const line = zillowAddressLineForImport(z.value);
    if (line?.trim()) {
      return {
        ok: true,
        provider: 'zillow',
        addressLine: line.trim(),
        normalizedUrl,
        listingId: z.value.listingID,
      };
    }
    return { ok: false, reason: 'missing_address' };
  }

  const r = parseRedfinUrl(normalizedUrl);
  if (r.ok) {
    const line = redfinAddressLineForImport(r.value);
    if (line?.trim()) {
      return {
        ok: true,
        provider: 'redfin',
        addressLine: line.trim(),
        normalizedUrl,
        listingId: r.value.listingID,
      };
    }
    return { ok: false, reason: 'missing_address' };
  }

  if (z.error.kind === 'unsupportedDomain' && r.error.kind === 'unsupportedDomain') {
    return { ok: false, reason: 'unsupported' };
  }

  return { ok: false, reason: 'missing_address' };
}

/**
 * Sync parse after URL is already normalized (tests, or callers that pre-normalize).
 */
export function parseListingImportFromNormalizedUrl(normalizedUrl: string): ListingImportParseResult {
  return parseNormalizedUrl(normalizedUrl);
}

/**
 * Parse pasted text: normalize only (no network). Short links are not resolved.
 */
export function parseListingImportForImport(rawInput: string): ListingImportParseResult {
  const normalizedUrl = normalizeListingUrl(rawInput);
  if (!normalizedUrl) {
    return { ok: false, reason: 'invalid_url' };
  }
  return parseNormalizedUrl(normalizedUrl);
}

/**
 * Full pipeline: normalize → resolve known short URLs (async) → normalize again → parse.
 * Import UI should prefer this so rfr.io / zillow.me etc. work when they redirect to listing pages.
 */
export async function parseListingImportForImportAsync(
  rawInput: string
): Promise<ListingImportParseResult> {
  let normalizedUrl = normalizeListingUrl(rawInput);
  if (!normalizedUrl) {
    return { ok: false, reason: 'invalid_url' };
  }

  const expanded = await resolveListingShortUrlIfNeeded(normalizedUrl);
  if (expanded !== normalizedUrl) {
    const again = normalizeListingUrl(expanded);
    if (again) normalizedUrl = again;
  }

  return parseNormalizedUrl(normalizedUrl);
}
