/**
 * Client-side checks for typed US-style addresses (no network).
 * Used to decide if manual import can proceed when geocode is unavailable or returns no match.
 */

import { parseAddress } from '../lib/parsers';

/**
 * True when the line looks like a full US mailing address (street + 2-letter state + ZIP).
 * Accepts common comma-separated formats.
 */
export function isUsAddressLineLikelyComplete(trimmed: string): boolean {
  const p = parseAddress(trimmed);
  const streetOk = Boolean(p.streetAddress && p.streetAddress.trim().length >= 4);
  const stateOk = Boolean(p.state && /^[A-Z]{2}$/.test(p.state));
  const zipOk = Boolean(p.postalCode && /^\d{5}(-\d{4})?$/.test(p.postalCode.replace(/\s/g, '')));
  return streetOk && stateOk && zipOk;
}
