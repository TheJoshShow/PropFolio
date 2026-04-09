import type { AutocompletePrediction, PlacesAutocompleteResponse, ResolvedPlaceDto } from './types';

const MAX_SUGGESTIONS = 5;

function trimOrEmpty(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Maps one raw prediction from the edge function into our DTO; returns null if unusable.
 */
export function normalizeAutocompletePrediction(raw: unknown): AutocompletePrediction | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const placeId = trimOrEmpty(o.placeId);
  if (!placeId) {
    return null;
  }
  const primaryText = trimOrEmpty(o.primaryText);
  const secondaryText = trimOrEmpty(o.secondaryText);
  const fullText = trimOrEmpty(o.fullText);
  const legacyText = trimOrEmpty(o.text);
  const full =
    fullText ||
    legacyText ||
    [primaryText, secondaryText].filter((x) => x.length > 0).join(', ');
  const primary = primaryText || full.split(',')[0]?.trim() || full;
  const line = full || primary;
  return {
    placeId,
    primaryText: primary || line,
    secondaryText,
    fullText: line,
    text: line,
  };
}

export function parseAutocompletePredictionsList(raw: unknown): AutocompletePrediction[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: AutocompletePrediction[] = [];
  for (const item of raw) {
    const n = normalizeAutocompletePrediction(item);
    if (n) {
      out.push(n);
    }
    if (out.length >= MAX_SUGGESTIONS) {
      break;
    }
  }
  return out;
}

export function parsePlacesAutocompletePayload(payload: unknown): PlacesAutocompleteResponse {
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Invalid response from address search');
  }
  const o = payload as Record<string, unknown>;
  if (typeof o.error === 'string' && o.error.length > 0) {
    throw new Error(o.error);
  }
  return { predictions: parseAutocompletePredictionsList(o.predictions) };
}

export function parseResolvedPlaceDto(o: Record<string, unknown>): ResolvedPlaceDto {
  const placeId = trimOrEmpty(o.placeId);
  const formattedAddress = trimOrEmpty(o.formattedAddress);
  const lat = o.latitude;
  const lng = o.longitude;
  return {
    placeId,
    formattedAddress,
    latitude: typeof lat === 'number' && Number.isFinite(lat) ? lat : null,
    longitude: typeof lng === 'number' && Number.isFinite(lng) ? lng : null,
    normalizedOneLine: trimOrEmpty(o.normalizedOneLine) || null,
    streetNumber: trimOrEmpty(o.streetNumber) || null,
    route: trimOrEmpty(o.route) || null,
    city: trimOrEmpty(o.city) || null,
    state: trimOrEmpty(o.state) || null,
    postalCode: trimOrEmpty(o.postalCode) || null,
    country: trimOrEmpty(o.country) || null,
  };
}

/** True when the user picked a place we can send to `import-property` without relying on free text. */
export function isResolvedPlaceComplete(place: ResolvedPlaceDto | null): boolean {
  if (!place?.placeId) {
    return false;
  }
  const line =
    place.formattedAddress.trim() ||
    (typeof place.normalizedOneLine === 'string' ? place.normalizedOneLine.trim() : '');
  return line.length > 0;
}
