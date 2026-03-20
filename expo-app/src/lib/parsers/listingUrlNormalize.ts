/**
 * Listing URL normalization for paste flows: whitespace, protocol, tracking params,
 * fragments, hostname casing, trailing slashes (preserved where needed for parsing).
 */

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'spm',
  'ref',
  'src',
  'cid',
  'chid',
  'ssource',
  'rdst',
  'trk',
  'partner',
  'from',
  'source',
  'cmp',
  'rb_redirect',
  'redfin_open_in_app',
  'sc_cmp',
  'nvid',
  'ldpVisited',
];

/**
 * Clean raw pasted text (messages, share sheets, notes).
 */
export function preprocessListingPaste(input: string): string {
  let s = input.replace(/\uFEFF/g, '').trim();
  s = s.replace(/\s*\n\s*/g, ' ');
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/^[\s([<{]+/, '');
  s = s.replace(/[\s)\]}>]+$/, '');
  const paren = s.match(/^\((.*)\)$/);
  if (paren?.[1]) s = paren[1].trim();
  s = s.replace(/^["']|["']$/g, '');
  return s.trim();
}

/**
 * Returns a normalized absolute URL string for parsing, or null if invalid.
 * Does not resolve short links — use the async import pipeline for that.
 */
export function normalizeListingUrl(input: string): string | null {
  const raw = preprocessListingPaste(input);
  if (!raw) return null;

  let s = raw;
  if (!/^https?:\/\//i.test(s)) {
    if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(s) || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s.split('/')[0] ?? '')) {
      s = `https://${s}`;
    } else {
      s = `https://${s}`;
    }
  }

  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

    u.hostname = u.hostname.toLowerCase();

    for (const k of TRACKING_PARAMS) {
      u.searchParams.delete(k);
    }

    let keys = [...u.searchParams.keys()];
    for (const k of keys) {
      if (k.toLowerCase().startsWith('utm_')) u.searchParams.delete(k);
    }

    u.hash = '';

    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.replace(/\/+$/, '');
    }

    return u.toString();
  } catch {
    return null;
  }
}

export function getHostname(urlString: string): string | null {
  try {
    return new URL(urlString).hostname.toLowerCase();
  } catch {
    return null;
  }
}
