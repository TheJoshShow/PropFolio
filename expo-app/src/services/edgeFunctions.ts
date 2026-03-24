/**
 * Invoke Supabase Edge Functions (Google, RentCast, OpenAI, Census).
 * Requires getSupabase() to be configured; returns null if not.
 * Geocode, rent-estimate, places-autocomplete, openai/census, and delete-account use timeouts; retries where appropriate.
 * All invokes are wrapped so unexpected throws become structured errors (production-safe).
 */

import { getSupabase } from './supabase';
import { edgeFunctionToIntegrationName } from '../config/services';
import {
  coerceGeocodeResult,
  extractPlacesPredictions,
  isGeocodeNoResultsError,
  type GeocodeResult,
  type PlacesPrediction,
} from './edgeFunctionResponses';
import { reportIntegrationStatus } from './diagnostics';
import { recordFlowIssue } from './monitoring/flowInstrumentation';

export type { GeocodeResult, PlacesPrediction } from './edgeFunctionResponses';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 1;

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

function recoverableForEdgeKind(
  kind: 'no_client' | 'invoke_err' | 'edge_body' | 'catch' | 'timeout' | 'exhausted'
): boolean {
  if (kind === 'no_client') return false;
  return true;
}

function reportApiEdgeFailure(
  fn: string,
  kind: 'no_client' | 'invoke_err' | 'edge_body' | 'catch' | 'timeout' | 'exhausted',
  reason: string
): void {
  recordFlowIssue('api_edge_failed', {
    fn,
    kind,
    reason: reason.slice(0, 100),
    stage: 'edge_invoke',
    recoverable: recoverableForEdgeKind(kind),
  });
}

function reportApiSupabaseFnFailure(
  fn: string,
  kind: 'no_client' | 'invoke_err' | 'edge_body' | 'catch',
  reason: string
): void {
  recordFlowIssue('api_supabase_fn_failed', {
    fn,
    kind,
    reason: reason.slice(0, 100),
    stage: 'edge_invoke',
    recoverable: kind !== 'no_client',
  });
}

async function invoke<T>(name: string, body: object): Promise<{ data: T | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    reportIntegrationStatus({
      integration: 'supabase',
      configured: false,
      requestSuccess: false,
      lastFailureReason: 'Supabase not configured',
      fallbackUsed: true,
      featureImpact: 'blocked',
    });
    reportApiSupabaseFnFailure(name, 'no_client', 'Supabase not configured');
    return { data: null, error: 'Supabase not configured' };
  }
  try {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
      reportIntegrationStatus({
        integration: 'supabase',
        configured: true,
        requestSuccess: false,
        lastFailureReason: error.message,
        fallbackUsed: false,
        featureImpact: 'partial',
      });
      reportApiSupabaseFnFailure(name, 'invoke_err', error.message);
      return { data: null, error: error.message };
    }
    if (data && typeof data === 'object' && 'error' in data && (data as { error?: unknown }).error != null) {
      const msg = String((data as { error: unknown }).error);
      reportIntegrationStatus({
        integration: 'supabase',
        configured: true,
        requestSuccess: false,
        lastFailureReason: msg,
        fallbackUsed: false,
        featureImpact: 'partial',
      });
      reportApiSupabaseFnFailure(name, 'edge_body', msg);
      return { data: null, error: msg };
    }
    reportIntegrationStatus({
      integration: 'supabase',
      configured: true,
      requestSuccess: true,
      lastFailureReason: null,
      fallbackUsed: false,
      featureImpact: 'none',
    });
    return { data: data as T, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    reportIntegrationStatus({
      integration: 'supabase',
      configured: true,
      requestSuccess: false,
      lastFailureReason: msg,
      fallbackUsed: false,
      featureImpact: 'partial',
    });
    reportApiSupabaseFnFailure(name, 'catch', msg);
    return { data: null, error: msg };
  }
}

/**
 * Invoke Edge Function with timeout and optional retries. Retries on network-like errors or timeout.
 * Catches throws from the Supabase client (network, unexpected failures).
 */
async function invokeWithTimeout<T>(
  name: string,
  body: object,
  options: InvokeWithTimeoutOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0 } = options;
  const supabase = getSupabase();
  const edgeIntegration = edgeFunctionToIntegrationName(name);
  if (!supabase) {
    reportIntegrationStatus({
      integration: edgeIntegration,
      configured: false,
      requestSuccess: false,
      lastFailureReason: 'Supabase not configured',
      fallbackUsed: true,
      featureImpact: 'blocked',
    });
    reportApiEdgeFailure(name, 'no_client', 'Supabase not configured');
    return { data: null, error: 'Supabase not configured' };
  }

  let lastError: string | null = null;
  const invokeOptions = { body, timeout: timeoutMs } as { body: object; timeout?: number };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
          reportIntegrationStatus({
            integration: edgeIntegration,
            configured: true,
            requestSuccess: false,
            lastFailureReason: msg,
            fallbackUsed: attempt > 0,
            featureImpact: 'partial',
          });
          reportApiEdgeFailure(
            name,
            msg.toLowerCase().includes('timeout') || msg.includes('abort') ? 'timeout' : 'invoke_err',
            msg
          );
          if (__DEV__) console.warn(`[Edge] ${name} failed:`, msg);
          return {
            data: null,
            error:
              msg.includes('timeout') || msg.includes('abort')
                ? 'Request timed out. Please try again.'
                : msg,
          };
        }
        continue;
      }
      if (data && typeof data === 'object' && 'error' in data && (data as { error?: unknown }).error != null) {
        const errStr = String((data as { error: unknown }).error);
        lastError = errStr;
        const status = (data as { status?: number }).status;
        const isRetryable = attempt < retries && (status === 502 || status === 503);
        if (!isRetryable) {
          reportIntegrationStatus({
            integration: edgeIntegration,
            configured: true,
            requestSuccess: false,
            lastFailureReason: errStr,
            fallbackUsed: attempt > 0,
            featureImpact: 'partial',
          });
          reportApiEdgeFailure(name, 'edge_body', `s:${status ?? 0}:${errStr.slice(0, 80)}`);
          return { data: null, error: errStr };
        }
        continue;
      }
      reportIntegrationStatus({
        integration: edgeIntegration,
        configured: true,
        requestSuccess: true,
        lastFailureReason: null,
        fallbackUsed: attempt > 0,
        featureImpact: 'none',
      });
      return { data: data as T, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastError = msg;
      const isRetryable =
        attempt < retries &&
        (msg.toLowerCase().includes('fetch') ||
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('timeout') ||
          msg.toLowerCase().includes('abort'));
      if (!isRetryable) {
        reportIntegrationStatus({
          integration: edgeIntegration,
          configured: true,
          requestSuccess: false,
          lastFailureReason: msg,
          fallbackUsed: attempt > 0,
          featureImpact: 'partial',
        });
        reportApiEdgeFailure(
          name,
          msg.toLowerCase().includes('timeout') || msg.includes('abort') ? 'timeout' : 'catch',
          msg
        );
        if (__DEV__) console.warn(`[Edge] ${name} threw:`, msg);
        return {
          data: null,
          error:
            msg.includes('timeout') || msg.includes('abort')
              ? 'Request timed out. Please try again.'
              : msg,
        };
      }
    }
  }
  reportIntegrationStatus({
    integration: edgeIntegration,
    configured: true,
    requestSuccess: false,
    lastFailureReason: lastError ?? 'Request failed. Please try again.',
    fallbackUsed: retries > 0,
    featureImpact: 'partial',
  });
  reportApiEdgeFailure(name, 'exhausted', (lastError ?? 'unknown').slice(0, 100));
  return { data: null, error: lastError ?? 'Request failed. Please try again.' };
}

/** Geocode an address (Google Geocoding API). Uses timeout and one retry for transient failures. */
export async function geocodeAddress(
  address: string
): Promise<{ data: GeocodeResult | null; error: string | null }> {
  const trimmed = typeof address === 'string' ? address.trim() : '';
  if (!trimmed) return { data: null, error: 'Missing address' };
  const res = await invokeWithTimeout<Record<string, unknown>>(
    'geocode-address',
    { address: trimmed },
    { timeoutMs: DEFAULT_TIMEOUT_MS, retries: DEFAULT_RETRIES }
  );

  if (res.error && isGeocodeNoResultsError(res.error)) {
    return {
      data: { lat: null, lng: null, formatted_address: null, place_id: null },
      error: null,
    };
  }
  if (res.error) {
    return { data: null, error: res.error };
  }
  const coerced = coerceGeocodeResult(res.data);
  return { data: coerced, error: null };
}

/** Address autocomplete (Google Places API). Uses timeout and one retry. */
export async function placesAutocomplete(input: string): Promise<{
  data: { predictions: PlacesPrediction[] } | null;
  error: string | null;
}> {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return { data: { predictions: [] }, error: null };
  const res = await invokeWithTimeout<Record<string, unknown>>(
    'places-autocomplete',
    { input: trimmed },
    { timeoutMs: DEFAULT_TIMEOUT_MS, retries: DEFAULT_RETRIES }
  );

  if (res.error) {
    return { data: null, error: res.error };
  }
  const predictions = extractPlacesPredictions(res.data);
  return { data: { predictions }, error: null };
}

/** Rent estimate for an address (RentCast API). Uses timeout and one retry. */
export async function rentEstimate(params: {
  address: string;
  bedrooms?: number;
  propertyType?: string;
}): Promise<{ data: RentEstimateResult | null; error: string | null }> {
  const address = typeof params?.address === 'string' ? params.address.trim() : '';
  if (!address) return { data: null, error: 'Missing address' };
  return invokeWithTimeout<RentEstimateResult>(
    'rent-estimate',
    {
      address,
      ...(typeof params.bedrooms === 'number' && Number.isFinite(params.bedrooms) ? { bedrooms: params.bedrooms } : {}),
      ...(typeof params.propertyType === 'string' ? { propertyType: params.propertyType } : {}),
    },
    { timeoutMs: DEFAULT_TIMEOUT_MS, retries: DEFAULT_RETRIES }
  );
}

/** Plain-English summary (OpenAI). No financial calculations. Uses timeout like other user-facing edges. */
export async function openaiSummarize(params: {
  text: string;
  prompt?: string;
}): Promise<{ data: OpenAISummarizeResult | null; error: string | null }> {
  return invokeWithTimeout<OpenAISummarizeResult>('openai-summarize', params, {
    timeoutMs: DEFAULT_TIMEOUT_MS,
    retries: DEFAULT_RETRIES,
  });
}

/** Census data for an area (state/county/tract or lat/lng). */
export async function censusData(params: {
  state?: string;
  county?: string;
  tract?: string;
  lat?: number;
  lng?: number;
}): Promise<{ data: CensusDataResult | null; error: string | null }> {
  return invokeWithTimeout<CensusDataResult>('census-data', params, {
    timeoutMs: DEFAULT_TIMEOUT_MS,
    retries: DEFAULT_RETRIES,
  });
}

/** Delete the current user's account (App Store compliance). Longer timeout; no retries (avoid duplicate server work). */
export async function deleteAccount(): Promise<{ data: { success: boolean } | null; error: string | null }> {
  return invokeWithTimeout<{ success: boolean }>('delete-account', {}, { timeoutMs: 60_000, retries: 0 });
}
