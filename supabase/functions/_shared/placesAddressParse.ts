/**
 * Map Google Places API (New) `addressComponents` into structured fields.
 */
export type ParsedAddressComponents = {
  streetNumber: string | null;
  route: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export function parsePlacesAddressComponents(
  components: Array<{ longText?: string; shortText?: string; types?: string[] }> | undefined,
): ParsedAddressComponents {
  const out: ParsedAddressComponents = {
    streetNumber: null,
    route: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
  };
  if (!Array.isArray(components)) {
    return out;
  }
  for (const c of components) {
    const types = c.types ?? [];
    const long = typeof c.longText === 'string' ? c.longText.trim() : '';
    if (!long) {
      continue;
    }
    if (types.includes('street_number')) {
      out.streetNumber = long;
    } else if (types.includes('route')) {
      out.route = long;
    } else if (types.includes('locality')) {
      out.city = long;
    } else if (types.includes('administrative_area_level_1')) {
      out.state = long;
    } else if (types.includes('postal_code')) {
      out.postalCode = long;
    } else if (types.includes('country')) {
      out.country = long;
    }
  }
  return out;
}

export function buildNormalizedOneLine(
  formatted: string,
  parsed: ParsedAddressComponents,
): string {
  const ft = formatted?.trim() ?? '';
  if (ft.length > 0) {
    return ft;
  }
  const line1 = [parsed.streetNumber, parsed.route].filter(Boolean).join(' ').trim();
  const tail = [parsed.city, parsed.state, parsed.postalCode].filter(Boolean).join(', ');
  if (line1 && tail) {
    return `${line1}, ${tail}`;
  }
  return line1 || tail || '';
}
