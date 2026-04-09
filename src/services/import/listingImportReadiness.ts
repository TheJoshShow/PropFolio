/**
 * Client-side import readiness — must match server `prepareListingUrlForImport` + `parseListingUrl`
 * so we never show “verified” for links the Edge function will reject.
 */
import {
  extractListingCandidatesFromPaste,
  parseListingUrl,
  sanitizeListingUrl,
  type ListingParseResult,
} from '@listingUrlCore';

function isImportableParse(
  r: ReturnType<typeof parseListingUrl>,
): r is ListingParseResult {
  return r != null && typeof r === 'object' && 'provider' in r && !('unsupported' in r);
}

function hostnameIsRedfinOfficialShortLink(hostname: string): boolean {
  return hostname.replace(/^www\./i, '').toLowerCase() === 'redf.in';
}

/**
 * Redfin’s `redf.in` share URLs — `parseListingUrl` can’t resolve them without HTTP; the import Edge
 * function expands allowlisted short links before parsing. We mirror allowlist here for UI parity.
 */
function pasteHasAllowlistedShortLinkForImport(raw: string): boolean {
  for (const c of extractListingCandidatesFromPaste(raw)) {
    try {
      const u = new URL(c);
      if (hostnameIsRedfinOfficialShortLink(u.hostname)) {
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  const t = raw.replace(/\u00A0/g, ' ').trim();
  if (t.length < 8) {
    return false;
  }
  try {
    const u = new URL(sanitizeListingUrl(t));
    return hostnameIsRedfinOfficialShortLink(u.hostname);
  } catch {
    return false;
  }
}

/**
 * True if some URL in the paste (or the trimmed paste as a single URL) parses as a Zillow/Redfin
 * listing the server can import (same rules as `import-property` after local URL normalization),
 * or is an allowlisted short link the server will expand (e.g. `redf.in`).
 */
export function pasteContainsImportableListing(raw: string): boolean {
  const base = raw.replace(/\u00A0/g, ' ').trim();
  if (!base) {
    return false;
  }
  if (pasteHasAllowlistedShortLinkForImport(base)) {
    return true;
  }
  for (const c of extractListingCandidatesFromPaste(base)) {
    if (isImportableParse(parseListingUrl(c))) {
      return true;
    }
  }
  const t = base;
  if (t.length >= 8) {
    if (isImportableParse(parseListingUrl(t))) {
      return true;
    }
  }
  return false;
}
