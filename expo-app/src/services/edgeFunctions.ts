/**
 * Invoke Supabase Edge Functions (Google, RentCast, OpenAI, Census).
 * Requires getSupabase() to be configured; returns null if not.
 * Geocode, rent-estimate, and places-autocomplete use timeout and optional retry for graceful degradation.
 */

import { getSupabase } from './supabase';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 1;

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

export interface RentEstimateResult {
  rent?: number;
  comparableProperties?: unknown[];
  [key: string]: unknown;
}

export interface OpenAISummarizeResult {
  summary: string;
}

export interface CensusDataResult {
  data: {
    name: string | null;
    population: number | null;
    median_household_income: number | null;
    median_home_value: number | null;
  } | null;
}

export interface InvokeWithTimeoutOptions {
  timeoutMs?: number;
  retries?: number;
}

async function invoke<T>(name: string, body: object): Promise<{ data: T | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: String(data.error) };
  return { data: data as T, error: null };
}

/**
 * Invoke Edge Function with timeout and optional retries. Retries on network-like errors or timeout.
 * Uses Supabase client's timeout option when available; logs only event name and outcome (no PII).
 */
async function invokeWithTimeout<T>(
  name: string,
  body: object,
  options: InvokeWithTimeoutOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0 } = options;
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: 'Supabase not configured' };

  let lastError: string | null = null;
  const invokeOptions = { body, timeout: timeoutMs } as { body: object; timeout?: number };
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabase.functions.invoke(name, invokeOptions);
    if (error) {
      const msg = error?.message ?? String(error);
      lastError = msg;
      const isRetryable =
        attempt < retries &&
        (msg.toLowerCase().includes('fetch') ||
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('timeout') ||
          msg.toLowerCase().includes('abort'));
      if (!isRetryable) {
        if (__DEV__) console.warn(`[Edge] ${name} failed:`, msg);
        return { data: null, error: msg.includes('timeout') || msg.includes('abort') ? 'Request timed out. Please try again.' : msg };
      }
      continue;
    }
    if (data?.error) {
      lastError = String(data.error);
      const status = (data as { status?: number }).status;
      const isRetryable = attempt < retries && (status === 502 || status === 503);
      if (!isRetryable) return { data: null, error: String(data.error) };
      continue;
    }
    return { data: data as T, error: null };
  }
  return { data: null, error: lastError ?? 'Request failed. Please try again.' };
}

/** Geocode an address (Google Geocoding API). Uses timeout and one retry for transient failures. */
export async function geocodeAddress(address: string): Promise<{ data: GeocodeResult | null; error: string | null }> {
  const trimmed = typeof address === 'string' ? address.trim() : '';
  if (!trimmed) return { data: null, error: 'Missing address' };
  return invokeWithTimeout<GeocodeResult>('geocode-address', { address: trimmed }, { timeoutMs: DEFAULT_TIMEOUT_MS, retries: DEFAULT_RETRIES });
}

/** Address autocomplete (Google Places API). Uses timeout and one retry. */
export async function placesAutocomplete(input: string): Promise<{
  data: { predictions: PlacesPrediction[] } | null;
  error: string | null;
}> {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return { data: { predictions: [] }, error: null };
  return invokeWithTimeout<{ predictions: PlacesPrediction[] }>('places-autocomplete', { input: trimmed }, { timeoutMs: DEFAULT_TIMEOUT_MS, retries: DEFAULT_RETRIES });
}

/** Rent estimate for an address (RentCast API). Uses timeout and one retry. */
export async function rentEstimate(params: {
  address: string;
  bedrooms?: number;
  propertyType?: string;
}): Promise<{ data: RentEstimateResult | null; error: string | null }> {
  const address = typeof params?.address === 'string' ? params.address.trim() : '';
  if (!address) return { data: null, error: 'Missing address' };
  return invokeWithTimeout<RentEstimateResult>('rent-estimate', {
    address,
    ...(typeof params.bedrooms === 'number' && Number.isFinite(params.bedrooms) ? { bedrooms: params.bedrooms } : {}),
    ...(typeof params.propertyType === 'string' ? { propertyType: params.propertyType } : {}),
  }, { timeoutMs: DEFAULT_TIMEOUT_MS, retries: DEFAULT_RETRIES });
}

/** Plain-English summary (OpenAI). No financial calculations. */
export async function openaiSummarize(params: {
  text: string;
  prompt?: string;
}): Promise<{ data: OpenAISummarizeResult | null; error: string | null }> {
  return invoke<OpenAISummarizeResult>('openai-summarize', params);
}

/** Census data for an area (state/county/tract or lat/lng). */
export async function censusData(params: {
  state?: string;
  county?: string;
  tract?: string;
  lat?: number;
  lng?: number;
}): Promise<{ data: CensusDataResult | null; error: string | null }> {
  return invoke<CensusDataResult>('census-data', params);
}

/** Delete the current user's account (App Store compliance). Server deletes auth user; caller should clear session. */
export async function deleteAccount(): Promise<{ data: { success: boolean } | null; error: string | null }> {
  return invoke<{ success: boolean }>('delete-account', {});
}
