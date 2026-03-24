/**
 * Maps edge-function and Supabase errors to safe, actionable user messages.
 * No PII; raw messages only used for substring classification.
 */

import { IMPORT_USER_MESSAGES } from './importErrorMessages';

/** Classify Google / edge failures for autocomplete and geocoding. */
export function mapPlacesOrGeocodeError(raw: string | null | undefined): string {
  const m = (raw ?? '').toLowerCase();
  if (!m) return IMPORT_USER_MESSAGES.addressLookupUnavailable;

  if (
    m.includes('google_maps_api_key') ||
    m.includes('api key') ||
    m.includes('request_denied') ||
    m.includes('invalid_request') ||
    m.includes('referer') ||
    m.includes('ip') ||
    m.includes('billing') ||
    m.includes('quota')
  ) {
    return IMPORT_USER_MESSAGES.addressLookupUnavailable;
  }

  if (
    m.includes('network') ||
    m.includes('fetch') ||
    m.includes('timeout') ||
    m.includes('abort') ||
    m.includes('failed to fetch')
  ) {
    return IMPORT_USER_MESSAGES.networkUnavailable;
  }

  if (m.includes('supabase not configured')) {
    return IMPORT_USER_MESSAGES.supabaseNotConfigured;
  }

  return IMPORT_USER_MESSAGES.addressLookupUnavailable;
}

/** Map property insert / RPC failures to user-visible text (no raw Postgres text). */
export function mapPropertyImportDbError(raw: string | null | undefined, code?: string): string {
  const c = code ?? '';
  const m = (raw ?? '').toLowerCase();

  if (c === '23505' || m.includes('duplicate') || m.includes('unique')) {
    return IMPORT_USER_MESSAGES.duplicateProperty;
  }
  if (c === '23503' || m.includes('foreign key')) {
    return IMPORT_USER_MESSAGES.importAccountOrPortfolio;
  }
  if (
    c === '42501' ||
    m.includes('row-level security') ||
    m.includes('permission denied') ||
    m.includes('rls')
  ) {
    return IMPORT_USER_MESSAGES.importPermissionDenied;
  }
  if (m.includes('jwt') || m.includes('expired')) {
    return IMPORT_USER_MESSAGES.sessionExpired;
  }
  if (
    c === '42703' ||
    (m.includes('column') && m.includes('does not exist')) ||
    m.includes('schema cache')
  ) {
    return IMPORT_USER_MESSAGES.importDatabaseSchemaMismatch;
  }

  return IMPORT_USER_MESSAGES.importBackendUnavailable;
}
