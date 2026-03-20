/**
 * Free tier import limits: count, canImport, sync entitlement to server, record import.
 * Server enforces limit via trigger on property_imports; this module provides UI and persistence.
 * Portfolios.user_id references profiles(id); profile must exist before portfolio create.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logErrorSafe, logImportStep } from './diagnostics';
import { parseAddress } from '../lib/parsers';
import { ensureUserReadyForImport } from './accountReady';
import { IMPORT_USER_MESSAGES } from './importErrorMessages';

const FREE_IMPORT_LIMIT = 2;

export interface ImportCountResult {
  count: number;
  freeRemaining: number;
  canImport: boolean;
}

export interface PropertyImportData {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string;
  unit?: string;
  listPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  rent?: number;
  /** WGS84 from geocode (import); persisted for map pins */
  latitude?: number;
  longitude?: number;
}

export type ImportSource = 'zillow' | 'redfin' | 'rentcast' | 'manual' | 'other';

/** Server-authoritative result status from record_property_import RPC. */
export type ImportRecordStatus =
  | 'allowed_free'
  | 'allowed_paid'
  | 'blocked_upgrade_required'
  | 'failed_retryable'
  | 'failed_nonretryable';

/** Structured result from the enforcement layer (RPC). */
export type RecordPropertyImportResult =
  | { status: 'allowed_free' | 'allowed_paid'; propertyId: string; property_import_count: number }
  | { status: 'blocked_upgrade_required' }
  | { status: 'failed_retryable'; error: string }
  | { status: 'failed_nonretryable'; error: string };

/**
 * Get import count and remaining free imports for the current user.
 * Requires Supabase client with authenticated user.
 */
export async function getImportCount(supabase: SupabaseClient | null): Promise<ImportCountResult> {
  if (!supabase) {
    return { count: 0, freeRemaining: FREE_IMPORT_LIMIT, canImport: true };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return { count: 0, freeRemaining: FREE_IMPORT_LIMIT, canImport: true };
  }

  const { count, error } = await supabase
    .from('property_imports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    logErrorSafe('ImportLimits getImportCount', error);
    return { count: 0, freeRemaining: FREE_IMPORT_LIMIT, canImport: true };
  }

  const n = typeof count === 'number' ? count : 0;
  const freeRemaining = Math.max(0, FREE_IMPORT_LIMIT - n);
  return {
    count: n,
    freeRemaining,
    canImport: true, // Caller combines with hasProAccess: canImport = (n < FREE_IMPORT_LIMIT) || hasProAccess
  };
}

/**
 * Sync subscription_status.entitlement_active for the current user.
 * Call when RevenueCat customerInfo indicates Pro (so server trigger allows imports).
 */
export async function syncSubscriptionStatus(
  supabase: SupabaseClient | null,
  userId: string,
  entitlementActive: boolean
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('subscription_status').upsert(
      {
        user_id: userId,
        entitlement_active: entitlementActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    logErrorSafe('ImportLimits syncSubscriptionStatus', e);
  }
}

/** Result of ensureDefaultPortfolio: id or structured failure for accurate error messaging. */
type EnsurePortfolioResult =
  | { portfolioId: string }
  | { portfolioId: null; step: 'lookup' | 'create'; message: string; code?: string };

/**
 * Get or create a default portfolio for the user.
 * Portfolios.user_id FK references profiles(id); caller must ensure profile exists first.
 */
async function ensureDefaultPortfolio(supabase: SupabaseClient, userId: string): Promise<EnsurePortfolioResult> {
  logImportStep('portfolio_lookup', { authPresent: true });

  const { data: existing, error: selectError } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    logErrorSafe('ImportLimits ensureDefaultPortfolio select', selectError);
    logImportStep('portfolio_lookup_failed', { step: 'lookup', code: (selectError as { code?: string }).code });
    return {
      portfolioId: null,
      step: 'lookup',
      message: selectError.message ?? 'Could not load portfolio',
      code: (selectError as { code?: string }).code,
    };
  }

  if (existing?.id) {
    logImportStep('portfolio_lookup_ok', { found: true });
    return { portfolioId: existing.id };
  }

  logImportStep('portfolio_create', {});
  const { data: inserted, error: insertError } = await supabase
    .from('portfolios')
    .insert({ user_id: userId, name: 'My Portfolio' })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    logErrorSafe('ImportLimits ensureDefaultPortfolio insert', insertError);
    const err = insertError as { message?: string; code?: string } | null;
    logImportStep('portfolio_create_failed', { step: 'create', code: err?.code });
    return {
      portfolioId: null,
      step: 'create',
      message: err?.message ?? 'Could not create portfolio',
      code: err?.code,
    };
  }

  logImportStep('portfolio_create_ok', { created: true });
  return { portfolioId: inserted.id };
}

/**
 * Build property row from import data. Ensures state 2 chars, postal 5–10.
 */
function toPropertyRow(
  portfolioId: string,
  data: PropertyImportData,
  source: ImportSource
): Record<string, unknown> {
  const state = data.state.length === 2 ? data.state : 'XX';
  const postal = data.postalCode.length >= 5 && data.postalCode.length <= 10
    ? data.postalCode
    : data.postalCode.slice(0, 10).padEnd(5, '0');
  const row: Record<string, unknown> = {
    portfolio_id: portfolioId,
    street_address: data.streetAddress,
    unit: data.unit ?? null,
    city: data.city,
    state,
    postal_code: postal,
    country_code: data.countryCode ?? 'US',
    list_price: data.listPrice ?? null,
    bedrooms: data.bedrooms ?? null,
    bathrooms: data.bathrooms ?? null,
    sqft: data.sqft ?? null,
    rent: data.rent ?? null,
    data_source: source,
    fetched_at: new Date().toISOString(),
  };
  if (
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number' &&
    Number.isFinite(data.latitude) &&
    Number.isFinite(data.longitude)
  ) {
    row.latitude = data.latitude;
    row.longitude = data.longitude;
  }
  return row;
}

/**
 * Server-authoritative import: create property then call record_property_import RPC.
 * Usage is incremented only after a successful saved import; retries are idempotent (no double count).
 * Returns structured status for UI (paywall, retry, non-retry).
 *
 * @example
 * const result = await recordPropertyImportEnforced(supabase, userId, data, 'manual');
 * if (result.status === 'allowed_free' || result.status === 'allowed_paid') {
 *   router.push(`/portfolio/${result.propertyId}`);
 * } else if (result.status === 'blocked_upgrade_required') {
 *   router.push('/paywall');
 * } else if (result.status === 'failed_retryable') {
 *   showRetryAlert(result.error);
 * } else {
 *   showError(result.error);
 * }
 */
export async function recordPropertyImportEnforced(
  supabase: SupabaseClient | null,
  _userId: string,
  data: PropertyImportData,
  source: ImportSource
): Promise<RecordPropertyImportResult> {
  if (!supabase) {
    logImportStep('import_abort', { reason: 'supabase_not_configured' });
    return { status: 'failed_nonretryable', error: 'Supabase is not configured.' };
  }

  logImportStep('import_start', { source, authPresent: true });

  // Profiles(id) is a FK dependency for portfolios(user_id). Use a centralized account readiness helper
  // so import doesn't fail during auth hydration races.
  const ready = await ensureUserReadyForImport(supabase, _userId);
  if (ready.status !== 'ready') {
    logImportStep('import_account_ready_failed', { status: ready.status });
    return { status: 'failed_nonretryable', error: ready.message };
  }

  const portfolioResult = await ensureDefaultPortfolio(supabase, _userId);
  if (portfolioResult.portfolioId === null) {
    const userMessage =
      portfolioResult.step === 'create'
        ? IMPORT_USER_MESSAGES.portfolioCreateFailed
        : IMPORT_USER_MESSAGES.portfolioLoadFailed;
    logImportStep('import_portfolio_failed', { step: portfolioResult.step });
    return { status: 'failed_nonretryable', error: userMessage };
  }
  const portfolioId = portfolioResult.portfolioId;

  const propertyRow = toPropertyRow(portfolioId, data, source);
  logImportStep('import_property_insert', { portfolioIdPresent: true });

  const { data: property, error: propError } = await supabase
    .from('properties')
    .insert(propertyRow)
    .select('id')
    .single();

  if (propError || !property?.id) {
    logErrorSafe('ImportLimits property insert', propError);
    logImportStep('import_property_insert_failed', {
      code: (propError as { code?: string })?.code,
      message: (propError as { message?: string })?.message,
    });
    return {
      status: 'failed_retryable',
      error: IMPORT_USER_MESSAGES.importTemporaryFailure,
    };
  }
  logImportStep('import_property_ok', { propertyIdPresent: true });

  const { data: rpcRows, error: rpcError } = await supabase.rpc('record_property_import', {
    p_property_id: property.id,
    p_source: source,
  });

  if (rpcError) {
    logErrorSafe('ImportLimits record_property_import RPC', rpcError);
    logImportStep('import_rpc_failed', { code: (rpcError as { code?: string }).code });
    return {
      status: 'failed_retryable',
      error: IMPORT_USER_MESSAGES.importTemporaryFailure,
    };
  }

  const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
  const status = row?.status as ImportRecordStatus | undefined;
  const count = typeof row?.property_import_count === 'number' ? row.property_import_count : undefined;
  logImportStep('import_rpc_ok', { status: status ?? 'unknown' });

  switch (status) {
    case 'allowed_free':
    case 'allowed_paid':
      return {
        status,
        propertyId: property.id,
        property_import_count: count ?? 0,
      };
    case 'blocked_upgrade_required':
      await supabase.from('properties').delete().eq('id', property.id);
      return { status: 'blocked_upgrade_required' };
    case 'failed_nonretryable':
      return { status: 'failed_nonretryable', error: 'Import not allowed' };
    case 'failed_retryable':
      return { status: 'failed_retryable', error: 'Please try again' };
    default: {
      // Empty array, missing status, or future/unknown RPC shape — avoid silent orphan `properties` rows.
      logImportStep('import_rpc_unexpected_response', {
        status: status == null ? 'missing' : String(status),
        hasRow: row != null,
      });
      await supabase.from('properties').delete().eq('id', property.id);
      return {
        status: 'failed_retryable',
        error: IMPORT_USER_MESSAGES.importTemporaryFailure,
      };
    }
  }
}

/**
 * Parse formatted address string into PropertyImportData (with fallbacks for required fields).
 */
const DEFAULT_VACANCY_RATE_PERCENT = 5;
const DEFAULT_EXPENSE_RATIO_EGI = 0.4; // 40% of EGI
// Deterministic cap-rate assumption used only to estimate list price from a (real) rent input.
const DEFAULT_CAP_RATE_FOR_LIST_PRICE_ESTIMATE = 0.07; // 7% expressed as decimal

/**
 * Deterministically estimate list price (purchase price) from monthly rent.
 * This is used to keep manual address imports fully functional in the testing flow
 * when we only have an address + rent estimate (no listing price).
 *
 * Formula:
 * - EGI ~= rent * 12 * (1 - vacancy%)
 * - NOI ~= EGI * (1 - expenseRatioEGI)
 * - price ~= NOI / capRate
 */
export function estimateListPriceFromMonthlyRent(
  monthlyRent: number,
  opts?: {
    vacancyRatePercent?: number;
    expenseRatioEgi?: number;
    capRate?: number;
  }
): number | undefined {
  if (monthlyRent == null || !Number.isFinite(monthlyRent) || monthlyRent <= 0) return undefined;

  const vacancyRatePercent = opts?.vacancyRatePercent ?? DEFAULT_VACANCY_RATE_PERCENT;
  const expenseRatioEgi = opts?.expenseRatioEgi ?? DEFAULT_EXPENSE_RATIO_EGI;
  const capRate = opts?.capRate ?? DEFAULT_CAP_RATE_FOR_LIST_PRICE_ESTIMATE;

  if (!Number.isFinite(vacancyRatePercent) || vacancyRatePercent < 0 || vacancyRatePercent >= 100) return undefined;
  if (!Number.isFinite(expenseRatioEgi) || expenseRatioEgi < 0 || expenseRatioEgi >= 1) return undefined;
  if (!Number.isFinite(capRate) || capRate <= 0) return undefined;

  const egiAnnual = monthlyRent * 12 * (1 - vacancyRatePercent / 100);
  const noiAnnual = egiAnnual * (1 - expenseRatioEgi);
  const price = noiAnnual / capRate;

  if (!Number.isFinite(price) || price <= 0) return undefined;
  return Math.round(price);
}

export function addressToImportData(
  formattedAddress: string,
  rent?: number
): PropertyImportData {
  const parsed = parseAddress(formattedAddress);
  const streetAddress = parsed.streetAddress ?? formattedAddress.slice(0, 200);
  const city = parsed.city ?? 'Unknown';
  const state = (parsed.state && parsed.state.length === 2) ? parsed.state : 'XX';
  const postalCode = (parsed.postalCode && parsed.postalCode.length >= 5)
    ? parsed.postalCode.slice(0, 10)
    : '00000';

  const inferredListPrice =
    rent != null && Number.isFinite(rent) && rent > 0
      ? estimateListPriceFromMonthlyRent(Number(rent))
      : undefined;

  return {
    streetAddress,
    city,
    state,
    postalCode,
    countryCode: 'US',
    rent,
    listPrice: inferredListPrice,
  };
}

export { FREE_IMPORT_LIMIT };
