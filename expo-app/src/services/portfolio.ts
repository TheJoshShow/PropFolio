/**
 * Portfolio: fetch user's default portfolio and saved properties from Supabase.
 * Used by portfolio list and detail.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logErrorSafe } from './diagnostics';

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
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('fetched_at', { ascending: false });
  if (error) {
    logErrorSafe('portfolio getPortfolioProperties', error);
    return { properties: [], error: error.message };
  }
  const properties = (data ?? []) as PropertyRow[];
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
    .select('*')
    .eq('id', propertyId)
    .eq('portfolio_id', portfolioId)
    .maybeSingle();
  if (error) {
    logErrorSafe('portfolio getPropertyById', error);
    return null;
  }
  const row = data as PropertyRow | null;
  if (
    !row ||
    typeof row.id !== 'string' ||
    row.id.trim().length === 0 ||
    typeof row.portfolio_id !== 'string' ||
    row.portfolio_id.trim().length === 0
  ) {
    return null;
  }
  return row;
}
