/**
 * Portfolio: fetch user's default portfolio and saved properties from Supabase.
 * Used by portfolio list and detail.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logErrorSafe } from './diagnostics';

const PROPERTY_SELECT_COLUMNS = [
  'id',
  'portfolio_id',
  'street_address',
  'unit',
  'city',
  'state',
  'postal_code',
  'country_code',
  'list_price',
  'bedrooms',
  'bathrooms',
  'sqft',
  'lot_sqft',
  'year_built',
  'property_type',
  'normalized_snapshot',
  'overall_confidence',
  'data_source',
  'fetched_at',
  'created_at',
  'updated_at',
  'rent',
  'latitude',
  'longitude',
  'full_address',
  'geocode_status',
  'geocode_source',
  'geocode_error',
  'last_geocoded_at',
].join(', ');

/** Raw property row as returned by Supabase (snake_case). */
export interface PropertyRow {
  id: string;
  portfolio_id: string;
  street_address: string;
  unit: string | null;
  city: string;
  state: string;
  postal_code: string;
  country_code: string | null;
  list_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lot_sqft?: number | null;
  year_built?: number | null;
  property_type?: string | null;
  normalized_snapshot?: Record<string, unknown> | null;
  overall_confidence?: number | null;
  data_source: string | null;
  fetched_at: string;
  created_at?: string | null;
  updated_at?: string | null;
  rent?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  full_address?: string | null;
  geocode_status?: 'pending' | 'in_progress' | 'resolved' | 'failed' | null;
  geocode_source?: string | null;
  geocode_error?: string | null;
  last_geocoded_at?: string | null;
}

function asFiniteNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asNullableString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function asGeocodeStatus(v: unknown): PropertyRow['geocode_status'] {
  if (v === 'pending' || v === 'in_progress' || v === 'resolved' || v === 'failed') {
    return v;
  }
  return null;
}

function looksLikeSchemaColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('column') &&
    (m.includes('does not exist') || m.includes('schema cache') || m.includes('could not find'))
  );
}

/**
 * Defensive row normalization so app code can rely on known optional fields even if
 * schema evolves or stale rows contain unexpected values.
 */
function normalizePropertyRow(raw: unknown): PropertyRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    row.id.trim().length === 0 ||
    typeof row.portfolio_id !== 'string' ||
    row.portfolio_id.trim().length === 0
  ) {
    return null;
  }
  return {
    ...(row as PropertyRow),
    rent: asFiniteNumber(row.rent),
    latitude: asFiniteNumber(row.latitude),
    longitude: asFiniteNumber(row.longitude),
    lot_sqft: asFiniteNumber(row.lot_sqft),
    year_built: asFiniteNumber(row.year_built),
    overall_confidence: asFiniteNumber(row.overall_confidence),
    property_type: asNullableString(row.property_type),
    normalized_snapshot:
      row.normalized_snapshot && typeof row.normalized_snapshot === 'object'
        ? (row.normalized_snapshot as Record<string, unknown>)
        : null,
    geocode_status: asGeocodeStatus(row.geocode_status),
  };
}

/** Single-line address for geocoding / map fallbacks */
export function formatPropertyAddressLine(
  row: Pick<PropertyRow, 'street_address' | 'unit' | 'city' | 'state' | 'postal_code'>
): string {
  const line1 = [row.street_address, row.unit].filter(Boolean).join(', ');
  return [line1, row.city, row.state, row.postal_code].filter(Boolean).join(', ');
}

export interface GetPortfolioPropertiesResult {
  properties: PropertyRow[];
  error: string | null;
}

/**
 * Get the default portfolio id for the user (first by user_id).
 */
export async function getDefaultPortfolioId(
  supabase: SupabaseClient | null,
  userId: string
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error) {
    logErrorSafe('portfolio getDefaultPortfolioId', error);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Fetch all properties for the user's default portfolio.
 * Order by fetched_at desc (or updated_at if present).
 */
export async function getPortfolioProperties(
  supabase: SupabaseClient | null,
  userId: string
): Promise<GetPortfolioPropertiesResult> {
  if (!supabase) return { properties: [], error: 'Not configured' };
  const portfolioId = await getDefaultPortfolioId(supabase, userId);
  if (!portfolioId) {
    return { properties: [], error: null };
  }
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT_COLUMNS)
    .eq('portfolio_id', portfolioId)
    .order('fetched_at', { ascending: false });
  if (error) {
    if (looksLikeSchemaColumnError(error.message ?? '')) {
      logErrorSafe(
        'portfolio schema mismatch: expected properties columns are missing (run latest migrations)',
        error
      );
    }
    logErrorSafe('portfolio getPortfolioProperties', error);
    return { properties: [], error: error.message };
  }
  const properties = (data ?? [])
    .map((row) => normalizePropertyRow(row))
    .filter((row): row is PropertyRow => row != null);
  return { properties, error: null };
}

/**
 * Fetch a single property by id. Returns null if not found or not in user's portfolio.
 */
export async function getPropertyById(
  supabase: SupabaseClient | null,
  userId: string,
  propertyId: string
): Promise<PropertyRow | null> {
  if (!supabase || !propertyId) return null;
  const portfolioId = await getDefaultPortfolioId(supabase, userId);
  if (!portfolioId) return null;
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT_COLUMNS)
    .eq('id', propertyId)
    .eq('portfolio_id', portfolioId)
    .maybeSingle();
  if (error) {
    if (looksLikeSchemaColumnError(error.message ?? '')) {
      logErrorSafe(
        'portfolio schema mismatch: expected properties columns are missing (run latest migrations)',
        error
      );
    }
    logErrorSafe('portfolio getPropertyById', error);
    return null;
  }
  return normalizePropertyRow(data);
}
