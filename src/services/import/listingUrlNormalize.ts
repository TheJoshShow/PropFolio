/**
 * Client-side helpers for messy listing paste (Messages, Notes, email).
 * Server `prepareListingUrlForImport` is authoritative; we mirror extraction for UX + send full paste.
 */

const MAX_PASTE_LENGTH = 2048;

function trimTrailingPunctuation(s: string): string {
  return s.replace(/[),.;>\]}]+$/, '').trim();
}

/** Same discovery order as server: https URLs, then www.*, then bare host paths. */
export function extractListingCandidatesFromPaste(raw: string): string[] {
  const text = raw.replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n');
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (s: string) => {
    const t = trimTrailingPunctuation(s).slice(0, MAX_PASTE_LENGTH);
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

  const barePath =
    /(?:^|[\s\n(>[\]])((?:zillow|redfin)\.com\/[^\s<>"'")\]\u201d\u2019]+)/gi;
  for (const m of text.matchAll(barePath)) {
    const p = m[1]?.trim();
    if (p && !p.startsWith('www.')) {
      push(`https://www.${p}`);
    }
  }

  return out;
}

/** True if paste likely contains something we can send to listing import. */
export function listingPasteLooksActionable(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 8) {
    return false;
  }
  if (extractListingCandidatesFromPaste(raw).length > 0) {
    return true;
  }
  const lower = t.toLowerCase();
  return lower.includes('zillow') || lower.includes('redfin');
}

function hostnameFromCandidate(urlish: string): string | null {
  const s = urlish.trim();
  if (!s) {
    return null;
  }
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Whether paste appears to reference a Zillow host (desktop, mobile, or bare path). */
export function listingPasteLooksActionableZillow(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 8) {
    return false;
  }
  for (const c of extractListingCandidatesFromPaste(raw)) {
    const h = hostnameFromCandidate(c);
    if (h && (h === 'zillow.com' || h.endsWith('.zillow.com'))) {
      return true;
    }
  }
  const lower = t.toLowerCase();
  if (lower.includes('zillow.com') || /\bzillow\./i.test(t)) {
    return true;
  }
  return false;
}

/** Whether paste appears to reference a Redfin host (desktop, mobile, or bare path). */
export function listingPasteLooksActionableRedfin(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 8) {
    return false;
  }
  for (const c of extractListingCandidatesFromPaste(raw)) {
    const h = hostnameFromCandidate(c);
    if (h && (h === 'redfin.com' || h.endsWith('.redfin.com'))) {
      return true;
    }
  }
  const lower = t.toLowerCase();
  if (lower.includes('redfin.com') || /\bredfin\./i.test(t)) {
    return true;
  }
  return false;
}

/**
 * First listing host found in extracted URL candidates (document order).
 * Used when both Zillow and Redfin heuristics match the same paste.
 */
export function inferPrimaryListingHost(raw: string): 'zillow' | 'redfin' | null {
  for (const c of extractListingCandidatesFromPaste(raw)) {
    const h = hostnameFromCandidate(c);
    if (!h) continue;
    if (h === 'zillow.com' || h.endsWith('.zillow.com')) {
      return 'zillow';
    }
    if (h === 'redfin.com' || h.endsWith('.redfin.com')) {
      return 'redfin';
    }
  }
  const z = listingPasteLooksActionableZillow(raw);
  const r = listingPasteLooksActionableRedfin(raw);
  if (z && !r) return 'zillow';
  if (r && !z) return 'redfin';
  if (z && r) return 'zillow';
  return null;
}

/** Send full user paste (trimmed/capped) so server can scan all embedded links. */
export function clipListingPasteForSubmit(raw: string): string {
  return raw.replace(/\u00A0/g, ' ').trim().slice(0, MAX_PASTE_LENGTH);
}

/**
 * Prefer a single display/summary URL for empty states (first candidate).
 * @deprecated Prefer `clipListingPasteForSubmit` for API body.
 */
export function extractListingUrlFromPaste(raw: string): string | null {
  const all = extractListingCandidatesFromPaste(raw);
  return all[0] ?? null;
}

/** @deprecated use `clipListingPasteForSubmit` for server body */
export function normalizeListingPasteForSubmit(raw: string): string {
  const extracted = extractListingUrlFromPaste(raw);
  return clipListingPasteForSubmit(extracted ?? raw);
}
