/**
 * Parses a single typed address string into partial components. No network.
 * Matches PropFolio AddressInputParser.
 */

import type { PartialAddress } from './types';

function parseStateZip(s: string): { state: string | null; postalCode: string | null } {
  const t = s.trim();
  const tokens = t.split(/\s+/);
  let state: string | null = null;
  let zip: string | null = null;
  for (const token of tokens) {
    if (token.length === 2 && /^[A-Za-z]+$/.test(token)) {
      state = token.toUpperCase();
    } else if (token.length === 5 && /^\d+$/.test(token)) {
      zip = token;
    }
  }
  return { state, postalCode: zip };
}

/** Remove state/zip from end of string for street/city. */
function stateZipRemoved(s: string): string {
  return s
    .replace(/\s+[A-Za-z]{2}\s+\d{5}(-\d{4})?\s*$/, '')
    .replace(/\s+\d{5}(-\d{4})?\s*$/, '')
    .trim();
}

export function parseAddress(input: string): PartialAddress {
  const trimmed = input.trim();
  if (!trimmed) {
    return { streetAddress: null, city: null, state: null, postalCode: null };
  }

  const parts = trimmed.split(',').map((p) => p.trim());

  if (parts.length >= 3) {
    const street = parts[0] || null;
    const city = parts[1] || null;
    const { state, postalCode } = parseStateZip(parts[2]);
    return { streetAddress: street, city, state, postalCode };
  }

  if (parts.length === 2) {
    const street = parts[0] || null;
    const { state, postalCode } = parseStateZip(parts[1]);
    return { streetAddress: street, city: null, state, postalCode };
  }

  const { state, postalCode } = parseStateZip(trimmed);
  if (state != null || postalCode != null) {
    const street = stateZipRemoved(trimmed).trim();
    return {
      streetAddress: street || null,
      city: null,
      state,
      postalCode,
    };
  }

  return {
    streetAddress: trimmed,
    city: null,
    state: null,
    postalCode: null,
  };
}
