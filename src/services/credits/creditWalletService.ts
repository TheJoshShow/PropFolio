import type { SupabaseClient } from '@supabase/supabase-js';

import { tryGetSupabaseClient } from '@/services/supabase';

/** JSON returned by `get_user_credit_state` RPC (subset used by the app). */
export type UserCreditStateRpc = {
  user_id?: string;
  error?: string;
  wallet?: {
    current_balance?: number;
    lifetime_credits_granted?: number;
    lifetime_credits_used?: number;
    signup_bonus_credits_granted?: number;
    monthly_included_credits_granted?: number;
    purchased_credits_granted?: number;
    updated_at?: string | null;
  };
  subscription?: Record<string, unknown>;
  /** Optional server hint; client gates use `computeAppAccess` + membership rules, not this field. */
  has_app_access_hint?: boolean;
};

export type MonthlyIncludedGrantStatus = 'granted' | 'pending' | 'unknown';

/** Result shape from `consume_import_credit` RPC. */
export type ConsumeImportCreditRpc = {
  success: boolean;
  idempotent?: boolean;
  balance_after?: number | null;
  /** e.g. insufficient_credits, subscription_required, forbidden */
  code?: string;
};

function parseRpcJson(value: unknown): Record<string, unknown> | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/**
 * Loads wallet + subscription summary for the signed-in user (server truth).
 */
export async function fetchMyCreditState(client: SupabaseClient): Promise<UserCreditStateRpc | null> {
  const { data: sessionData } = await client.auth.getUser();
  const uid = sessionData.user?.id;
  if (!uid) {
    return null;
  }

  const { data, error } = await client.rpc('get_user_credit_state', { p_user_id: uid });
  if (error) {
    throw new Error(error.message);
  }

  const row = parseRpcJson(data);
  if (!row) {
    return null;
  }

  return row as unknown as UserCreditStateRpc;
}

/**
 * Ensures the server has applied the signup wallet grant (2 bonus + 1 cycle-one monthly).
 * Idempotent — safe on every sign-in / refresh. Does nothing useful when not authenticated.
 */
export async function ensureSignupCreditsProvisioned(client: SupabaseClient): Promise<void> {
  const { data: sessionData } = await client.auth.getUser();
  if (!sessionData.user?.id) {
    return;
  }
  const { error } = await client.rpc('ensure_signup_credits_self');
  if (error) {
    console.warn('[credits] ensure_signup_credits_self:', error.message);
  }
}

/**
 * After optional provisioning, returns current balance (preferred after sign-in).
 */
export async function fetchMyCreditBalanceAfterProvisioning(client: SupabaseClient): Promise<number> {
  await ensureSignupCreditsProvisioned(client);
  return fetchMyCreditBalance(client);
}

/**
 * Current spendable credits for the session user. Returns 0 if no wallet row yet.
 */
export async function fetchMyCreditBalance(client: SupabaseClient): Promise<number> {
  const state = await fetchMyCreditState(client);
  return balanceFromCreditState(state);
}

export function balanceFromCreditState(state: UserCreditStateRpc | null): number {
  if (state?.error) {
    return 0;
  }
  const b = state?.wallet?.current_balance;
  return typeof b === 'number' && Number.isFinite(b) ? b : 0;
}

function periodsAlign(ledgerIso: string | null | undefined, periodStartIso: string | null | undefined): boolean {
  if (!ledgerIso || !periodStartIso) {
    return false;
  }
  const a = new Date(ledgerIso).getTime();
  const b = new Date(periodStartIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return false;
  }
  if (a === b) {
    return true;
  }
  return ledgerIso.slice(0, 10) === periodStartIso.slice(0, 10);
}

/**
 * Whether a monthly included credit ledger entry exists for the subscription’s current period start.
 */
export async function fetchMonthlyIncludedGrantStatus(
  client: SupabaseClient,
  subscriptionCurrentPeriodStart: string | null | undefined,
  entitlementActive: boolean,
): Promise<MonthlyIncludedGrantStatus> {
  if (!entitlementActive) {
    return 'unknown';
  }
  if (!subscriptionCurrentPeriodStart) {
    return 'unknown';
  }

  const { data, error } = await client
    .from('user_credit_ledger')
    .select('related_period_start')
    .eq('entry_reason', 'monthly_credit_grant')
    .order('created_at', { ascending: false })
    .limit(32);

  if (error) {
    return 'unknown';
  }
  if (!data?.length) {
    return 'pending';
  }

  const match = data.some((row: { related_period_start?: string | null }) =>
    periodsAlign(row.related_period_start ?? undefined, subscriptionCurrentPeriodStart),
  );

  return match ? 'granted' : 'pending';
}

export async function fetchCreditWalletSnapshot(client: SupabaseClient): Promise<{
  state: UserCreditStateRpc | null;
  monthlyIncluded: MonthlyIncludedGrantStatus;
}> {
  await ensureSignupCreditsProvisioned(client);
  const state = await fetchMyCreditState(client);
  if (!state || state.error) {
    return { state, monthlyIncluded: 'unknown' };
  }

  const sub = state.subscription as Record<string, unknown> | undefined;
  const active = Boolean(sub?.entitlement_active);
  const periodStart = typeof sub?.current_period_start === 'string' ? sub.current_period_start : null;
  const monthlyIncluded = await fetchMonthlyIncludedGrantStatus(client, periodStart, active);

  return { state, monthlyIncluded };
}

/**
 * Convenience when a client may be absent (logged out).
 */
export async function fetchMyCreditBalanceSafe(): Promise<number> {
  const client = tryGetSupabaseClient();
  if (!client) {
    return 0;
  }
  try {
    return await fetchMyCreditBalance(client);
  } catch {
    return 0;
  }
}
