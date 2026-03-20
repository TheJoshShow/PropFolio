/**
 * Convert URL path slugs (hyphen-separated) into a single line geocoders understand.
 * Used when structured PartialAddress extraction fails (common for Zillow/Redfin paths).
 */

/**
 * Turn e.g. `123-Main-St-Austin-TX-78701` into `123 Main St, Austin, TX 78701`.
 * Falls back to space-separated slug if the structured parse doesn't match.
 */
export function slugToAddressLine(slug: string): string {
  const t = slug.replace(/\/$/, '').trim();
  if (!t) return '';
  const parts = t.split('-').filter(Boolean);
  if (parts.length < 4) {
    return t.replace(/-/g, ' ');
  }

  const last = parts[parts.length - 1] ?? '';
  const secondLast = parts[parts.length - 2] ?? '';
  const thirdLast = parts[parts.length - 3] ?? '';

  // ... TX 78701 or ... TX-78701
  if (/^\d{5}(-\d{4})?$/.test(last) && /^[A-Za-z]{2}$/.test(secondLast)) {
    const zip = last.replace(/-/g, '');
    const state = secondLast.toUpperCase();
    const city = thirdLast;
    const streetParts = parts.slice(0, -3);
    const street = streetParts.join(' ');
    if (street && city && state) {
      return `${street}, ${city}, ${state} ${zip}`;
    }
  }

  return t.replace(/-/g, ' ');
}
