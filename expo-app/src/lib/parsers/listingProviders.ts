/**
 * Central listing-site domain detection (Zillow / Redfin).
 * All hostname checks should go through this module for consistent behavior.
 */

export type ListingProviderId = 'zillow' | 'redfin' | 'unknown';

/**
 * Detect Zillow or Redfin from a hostname (already lowercased or not).
 * Uses suffix rules so www, mobile, m., etc. all match.
 */
export function detectListingProviderFromHostname(hostname: string): ListingProviderId {
  const h = hostname.trim().toLowerCase();
  if (!h) return 'unknown';
  if (h === 'zillow.com' || h.endsWith('.zillow.com')) return 'zillow';
  if (h === 'redfin.com' || h.endsWith('.redfin.com')) return 'redfin';
  return 'unknown';
}

export function isZillowHost(hostname: string): boolean {
  return detectListingProviderFromHostname(hostname) === 'zillow';
}

export function isRedfinHost(hostname: string): boolean {
  return detectListingProviderFromHostname(hostname) === 'redfin';
}
