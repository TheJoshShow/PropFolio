/**
 * Normalizes JSON bodies from Supabase Edge Functions (geocode, places autocomplete).
 * Keeps parsing in one place so the Import flow and tests stay consistent.
 */

export interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  formatted_address: string | null;
  place_id: string | null;
}

export interface PlacesPrediction {
  description: string;
  place_id: string;
}

/** True when geocode returned no match — not a fatal import error. */
export function isGeocodeNoResultsError(error: string | null | undefined): boolean {
  if (!error) return false;
  const e = error.toLowerCase();
  return e.includes('no results') || e === 'zero_results';
}

/**
 * Places API responses may be `{ predictions }` or legacy `{ data: { predictions } }`.
 */
export function extractPlacesPredictions(data: unknown): PlacesPrediction[] {
  if (data == null || typeof data !== 'object') return [];
  const d = data as { predictions?: unknown; data?: { predictions?: unknown } };
  const raw = Array.isArray(d.predictions)
    ? d.predictions
    : Array.isArray(d.data?.predictions)
      ? d.data.predictions
      : [];
  const out: PlacesPrediction[] = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const o = p as { description?: unknown; place_id?: unknown };
    const description = String(o.description ?? '').trim();
    const place_id = String(o.place_id ?? '').trim();
    if (description.length > 0) out.push({ description, place_id });
  }
  return out;
}

/**
 * Coerce geocode function JSON to GeocodeResult (allows partial / null fields).
 */
export function coerceGeocodeResult(data: unknown): GeocodeResult | null {
  if (data == null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const parseNum = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  const lat = parseNum(d.lat);
  const lng = parseNum(d.lng);
  const formatted_address =
    typeof d.formatted_address === 'string' ? d.formatted_address : null;
  const place_id = typeof d.place_id === 'string' ? d.place_id : null;
  return { lat, lng, formatted_address, place_id };
}
