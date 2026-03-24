/**
 * Developer-only diagnostics for entitlement, offerings, purchase, and usage.
 * All logs are __DEV__ only and must not include secrets or PII (no user id, email, tokens).
 * Use for QA and debugging funnel state.
 *
 * logErrorSafe: use when logging errors so we never log full error objects (could contain tokens/PII).
 * Also forwards non-fatal signals to monitoring (Crashlytics on iOS when native module is available).
 */

import { recordNonFatal } from './monitoring';

const LOG_PREFIX = '[PropFolio]';

export type IntegrationName =
  | 'supabase'
  | 'supabase_edge_geocode'
  | 'supabase_edge_places'
  | 'supabase_edge_rentcast'
  | 'supabase_edge_census'
  | 'supabase_edge_openai'
  | 'supabase_edge_delete_account'
  | 'listing_parser'
  | 'google_maps'
  | 'rentcast'
  | 'census'
  | 'openai'
  | 'revenuecat';

export interface IntegrationDiagnosticsStatus {
  integration: IntegrationName;
  configured: boolean;
  requestSuccess: boolean;
  lastFailureReason: string | null;
  fallbackUsed: boolean;
  featureImpact: 'none' | 'partial' | 'blocked';
  updatedAt: string;
}

const integrationStatusStore = new Map<IntegrationName, IntegrationDiagnosticsStatus>();

export function reportIntegrationStatus(status: Omit<IntegrationDiagnosticsStatus, 'updatedAt'>): void {
  const next: IntegrationDiagnosticsStatus = { ...status, updatedAt: new Date().toISOString() };
  integrationStatusStore.set(status.integration, next);
  if (__DEV__) {
    console.log(
      `${LOG_PREFIX} Integration: ${status.integration} configured=${status.configured} success=${status.requestSuccess} fallback=${status.fallbackUsed} impact=${status.featureImpact}${status.lastFailureReason ? ` reason=${status.lastFailureReason}` : ''}`
    );
  }
}

export function getIntegrationDiagnosticsSnapshot(): IntegrationDiagnosticsStatus[] {
  return Array.from(integrationStatusStore.values()).sort((a, b) =>
    a.integration.localeCompare(b.integration)
  );
}

/**
 * Log an error in a safe way: only message or code, never the full object (may contain tokens or PII).
 * In __DEV__ logs the message; in production can be wired to a remote logger that still must not persist secrets.
 */
export function logErrorSafe(context: string, error: unknown): void {
  const msg =
    error instanceof Error ? error.message : typeof error === 'object' && error != null && 'message' in error ? String((error as { message?: unknown }).message) : String(error);
  if (__DEV__) {
    console.warn(`${LOG_PREFIX} ${context}:`, msg);
  }
  recordNonFatal(error instanceof Error ? error : new Error(msg), context);
}

export interface EntitlementState {
  hasProAccess: boolean;
  source: 'fresh' | 'cache';
}

export function logEntitlementState(state: EntitlementState): void {
  if (!__DEV__) return;
  console.log(
    `${LOG_PREFIX} Entitlement: ${state.hasProAccess ? 'Pro' : 'Free'} (source: ${state.source})`
  );
}

export interface OfferingsLoadState {
  planCount: number;
  hasOfferings: boolean;
  error?: boolean;
}

export function logOfferingsLoad(state: OfferingsLoadState): void {
  if (!__DEV__) return;
  const status = state.error ? 'error' : state.hasOfferings ? 'loaded' : 'empty';
  console.log(`${LOG_PREFIX} Offerings: ${status}, planCount=${state.planCount}`);
}

export type PurchaseOutcome = 'success' | 'cancelled' | 'pending' | 'failed';

export function logPurchaseOutcome(outcome: PurchaseOutcome, detail?: string): void {
  if (!__DEV__) return;
  const msg = detail ? `${outcome} (${detail})` : outcome;
  console.log(`${LOG_PREFIX} Purchase outcome: ${msg}`);
}

export interface UsageCheckState {
  canImport: boolean;
  freeRemaining: number;
  count: number;
}

export function logUsageCheck(state: UsageCheckState): void {
  if (!__DEV__) return;
  console.log(
    `${LOG_PREFIX} Usage: count=${state.count}, freeRemaining=${state.freeRemaining}, canImport=${state.canImport}`
  );
}

export type RestoreOutcome = 'success' | 'no_purchases' | 'failed' | 'offline';

export function logRestoreOutcome(outcome: RestoreOutcome): void {
  if (!__DEV__) return;
  console.log(`${LOG_PREFIX} Restore outcome: ${outcome}`);
}

/**
 * Import pipeline debug (__DEV__ only). Do not log PII (no user id, email, tokens).
 * Use for tracing: auth, profile, portfolio, payload shape, backend response.
 */
export function logImportStep(step: string, detail?: Record<string, unknown>): void {
  if (!__DEV__) return;
  const detailStr = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : '';
  console.log(`${LOG_PREFIX} Import: ${step}${detailStr}`);
}

/** Property analysis / scoring pipeline (__DEV__ only). No PII. */
export function logAnalysisStep(step: string, detail?: Record<string, unknown>): void {
  if (!__DEV__) return;
  const detailStr = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : '';
  console.log(`${LOG_PREFIX} Analysis: ${step}${detailStr}`);
}

/** Store / RevenueCat (__DEV__ only). */
export function logStoreStep(step: string, detail?: Record<string, unknown>): void {
  if (__DEV__) {
    const detailStr = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : '';
    console.log(`${LOG_PREFIX} Store: ${step}${detailStr}`);
  }
}

/** Auth/deep-link/session bootstrap (__DEV__ only). */
export function logAuthStep(step: string, detail?: Record<string, unknown>): void {
  if (!__DEV__) return;
  const detailStr = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : '';
  console.log(`${LOG_PREFIX} Auth: ${step}${detailStr}`);
}

/** Map / geocode sync pipeline (__DEV__ only). */
export function logMapStep(step: string, detail?: Record<string, unknown>): void {
  if (!__DEV__) return;
  const detailStr = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : '';
  console.log(`${LOG_PREFIX} Map: ${step}${detailStr}`);
}
