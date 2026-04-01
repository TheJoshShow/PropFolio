/**
 * Structured import failure mapping: autocomplete, geocode hints, Supabase errors, and unknown exceptions.
 * Keeps user-facing text centralized and avoids generic "try again" where we can be precise.
 */

import { IMPORT_USER_MESSAGES } from './importErrorMessages';

export type ImportAlertKind =
  | 'autocomplete_config'
  | 'autocomplete_network'
  | 'autocomplete_generic'
  | 'geocode_warning'
  | 'exception'
  | 'unknown';

/** Map Google / edge-function autocomplete error strings to UI copy. */
export function mapAutocompleteEdgeError(error: string | null | undefined): {
  userMessage: string;
  kind: ImportAlertKind;
} {
  if (!error || error.trim() === '') {
    return { userMessage: '', kind: 'unknown' };
  }
  const e = error.toLowerCase();

  if (e.includes('google_maps_api_key') || e.includes('api key') || e.includes('key is missing')) {
    return {
      userMessage:
        'Address suggestions are not configured (Maps API). You can still type a full street address, city, state, and ZIP, then tap Use address.',
      kind: 'autocomplete_config',
    };
  }
  if (
    e.includes('request_denied') ||
    e.includes('access denied') ||
    e.includes('referer') ||
    e.includes('restriction')
  ) {
    return {
      userMessage:
        'Address suggestions are blocked by API settings. You can still type the full address and tap Use address.',
      kind: 'autocomplete_config',
    };
  }
  if (
    e.includes('timeout') ||
    e.includes('network') ||
    e.includes('fetch') ||
    e.includes('abort') ||
    e.includes('econnrefused') ||
    e.includes('offline')
  ) {
    return {
      userMessage:
        'Address lookup is temporarily unavailable. Check your connection, or type the address manually and tap Use address.',
      kind: 'autocomplete_network',
    };
  }

  if (e.includes('non-2xx') || e.includes('edge function returned')) {
    return {
      userMessage:
        'Address suggestions hit a server error. Pull to refresh or try again shortly; you can still type the full address and tap Use address.',
      kind: 'autocomplete_network',
    };
  }

  if (e.includes('over_query_limit') || e.includes('resource_exhausted')) {
    return {
      userMessage:
        'Address suggestions are rate-limited right now. Try again in a minute, or type the address manually and tap Use address.',
      kind: 'autocomplete_network',
    };
  }

  return {
    userMessage:
      'Suggestions unavailable right now. You can still type an address and tap Use address.',
    kind: 'autocomplete_generic',
  };
}

/**
 * Turn persisted geocode_error strings into short, actionable copy for analysis warnings.
 */
export function mapGeocodeErrorForDisplay(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) {
    return 'We could not verify coordinates for this address yet.';
  }
  const r = raw.trim();
  const lower = r.toLowerCase();

  if (lower.includes('google_maps_api_key') || r.includes('GOOGLE_MAPS_API_KEY')) {
    return 'Maps geocoding is not configured on the server (missing API key). Ask your admin to set GOOGLE_MAPS_API_KEY for Supabase Edge Functions.';
  }
  if (lower.includes('non-2xx') || lower.includes('edge function returned')) {
    return 'The geocoding service returned an error. Try again; if it persists, confirm Edge Functions are deployed and the Maps API key is valid.';
  }
  if (lower.includes('request_denied') || lower.includes('access denied')) {
    return 'Google rejected the geocoding request (API key restrictions or billing). Check the Maps API key and enabled APIs in Google Cloud.';
  }
  if (lower.includes('over_query_limit') || lower.includes('quota')) {
    return 'Geocoding quota exceeded. Try again later or ask your admin to raise Google Maps usage limits.';
  }
  if (lower.includes('missing address') || lower.includes('missing address fields')) {
    return 'Address fields were incomplete, so we could not geocode. Edit the property and add street, city, state, and ZIP.';
  }
  if (lower.includes('no coordinates')) {
    return 'The geocoder had no coordinates for this address line. Check spelling and ZIP, then save again.';
  }
  if (lower.includes('zero_results')) {
    return 'No match for this address from the geocoder. Confirm the full street, city, state, and ZIP.';
  }

  return r.length > 220 ? `${r.slice(0, 217)}…` : r;
}

/**
 * Map Supabase PostgREST / insert errors to user-safe import messages (no raw SQL).
 */
export function mapPropertyInsertError(rawMessage: string, code?: string): string {
  const m = rawMessage.toLowerCase();
  const c = code ?? '';

  if (c === '23505' || m.includes('duplicate') || m.includes('unique constraint')) {
    return 'This property may already be in your portfolio. Check your list or try a slightly different address.';
  }
  if (c === '23503' || m.includes('foreign key')) {
    return IMPORT_USER_MESSAGES.portfolioCreateFailed;
  }
  if (
    c === '42501' ||
    m.includes('row-level security') ||
    m.includes('permission denied') ||
    m.includes('violates row-level security')
  ) {
    return 'We could not save this property with your account permissions. Try signing out and back in, or try again in a moment.';
  }
  if (m.includes('null value') && m.includes('violates not-null')) {
    return 'Some required property data is missing. Try entering a full street, city, state, and ZIP.';
  }
  return IMPORT_USER_MESSAGES.importTemporaryFailure;
}

export function mapRpcImportError(rawMessage: string, code?: string): string {
  const m = rawMessage.toLowerCase();
  const c = code ?? '';
  if (c === 'PGRST301' || m.includes('jwt') || m.includes('expired')) {
    return IMPORT_USER_MESSAGES.sessionExpired;
  }
  return IMPORT_USER_MESSAGES.importTemporaryFailure;
}

/** Map thrown errors from link pipeline (short-link fetch, rare bugs) to a safe message. */
export function mapImportException(e: unknown): { title: string; message: string } {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();

  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('abort') ||
    lower.includes('failed to fetch')
  ) {
    return {
      title: 'Connection problem',
      message:
        "We couldn't reach the server to finish this import. Check your connection and try again, or paste the listing URL again.",
    };
  }

  return {
    title: 'Import failed',
    message: IMPORT_USER_MESSAGES.linkImportProcessingFailed,
  };
}
