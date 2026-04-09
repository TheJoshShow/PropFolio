/**
 * Server-side credit preflight, idempotent replay, consume-after-save + rollback.
 */
import type { AuthedContext } from '../_shared/auth.ts';

type SupabaseUserClient = AuthedContext['supabase'];

export function importIdempotencyKey(correlationId: string): string {
  return `import:${correlationId.trim()}`;
}

export async function findCompletedPropertyIdForCorrelation(
  supabase: SupabaseUserClient,
  userId: string,
  correlationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('property_imports')
    .select('property_id')
    .eq('user_id', userId)
    .eq('correlation_id', correlationId)
    .eq('step', 'complete')
    .not('property_id', 'is', null)
    .maybeSingle();

  if (error) {
    console.warn('property_imports idempotency lookup failed', error.message);
    return null;
  }
  const pid = data?.property_id;
  return typeof pid === 'string' && pid.length ? pid : null;
}

export async function loadPropertyForReplay(
  supabase: SupabaseUserClient,
  userId: string,
  propertyId: string,
): Promise<{
  status: string;
  missingFields: string[];
  snapshot: Record<string, unknown>;
} | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('status, missing_fields, snapshot')
    .eq('id', propertyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  const mf = data.missing_fields;
  const missingFields = Array.isArray(mf) ? (mf as string[]) : [];
  const snap = data.snapshot;
  if (snap == null || typeof snap !== 'object') {
    return null;
  }
  return {
    status: typeof data.status === 'string' ? data.status : 'draft',
    missingFields,
    snapshot: snap as Record<string, unknown>,
  };
}

/**
 * Matches `consume_import_credit` subscription gate: when a `user_subscription_status` row exists,
 * require active entitlement or an unexpired trial. No row → allow (webhook lag).
 */
export async function checkImportSubscriptionPreflight(
  supabase: SupabaseUserClient,
  userId: string,
): Promise<{ ok: true } | { ok: false }> {
  const { data, error } = await supabase
    .from('user_subscription_status')
    .select('entitlement_active, trial_end_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('user_subscription_status preflight read failed', error.message);
    return { ok: true };
  }
  if (data == null) {
    return { ok: true };
  }

  if (data.entitlement_active === true) {
    return { ok: true };
  }

  const raw = data.trial_end_at;
  if (raw != null) {
    const end = new Date(raw as string);
    if (!Number.isNaN(end.getTime()) && end > new Date()) {
      return { ok: true };
    }
  }

  return { ok: false };
}

export async function getWalletBalance(
  supabase: SupabaseUserClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('user_credit_wallet')
    .select('current_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('user_credit_wallet preflight read failed', error.message);
    return 0;
  }
  const b = data?.current_balance;
  return typeof b === 'number' && Number.isFinite(b) ? b : 0;
}

type ConsumeRpc = {
  success?: boolean;
  idempotent?: boolean;
  balance_after?: number | null;
  code?: string;
};

export async function consumeImportCreditAfterSave(
  supabase: SupabaseUserClient,
  userId: string,
  propertyId: string,
  correlationId: string,
): Promise<
  | { ok: true; balanceAfter: number | null }
  | {
      ok: false;
      code: 'insufficient_credits' | 'subscription_required' | 'forbidden' | 'rpc_error';
      balanceAfter?: number | null;
      rpcMessage?: string;
    }
> {
  const key = importIdempotencyKey(correlationId);
  const { data, error } = await supabase.rpc('consume_import_credit', {
    p_user_id: userId,
    p_property_id: propertyId,
    p_idempotency_key: key,
  });

  if (error) {
    return { ok: false, code: 'rpc_error', rpcMessage: error.message };
  }

  const row = data as ConsumeRpc | null;
  if (!row || typeof row !== 'object') {
    return { ok: false, code: 'rpc_error', rpcMessage: 'empty_rpc_response' };
  }

  if (row.success === true) {
    const ba = row.balance_after;
    return {
      ok: true,
      balanceAfter: typeof ba === 'number' ? ba : null,
    };
  }

  const code = row.code;
  if (code === 'insufficient_credits') {
    return {
      ok: false,
      code: 'insufficient_credits',
      balanceAfter: row.balance_after ?? null,
    };
  }
  if (code === 'subscription_required') {
    return {
      ok: false,
      code: 'subscription_required',
      balanceAfter: row.balance_after ?? null,
    };
  }
  if (code === 'forbidden') {
    return { ok: false, code: 'forbidden', balanceAfter: row.balance_after ?? null };
  }

  return {
    ok: false,
    code: 'rpc_error',
    rpcMessage: code ?? 'consume_failed',
    balanceAfter: row.balance_after ?? null,
  };
}

export async function deletePropertyAfterFailedCredit(
  supabase: SupabaseUserClient,
  propertyId: string,
): Promise<void> {
  await supabase.from('property_snapshots').delete().eq('property_id', propertyId);
  await supabase.from('property_imports').delete().eq('property_id', propertyId);
  const { error } = await supabase.from('properties').delete().eq('id', propertyId);
  if (error) {
    console.warn('rollback property after credit failure', error.message);
  }
}

export type PropertyPersistStatus = 'draft' | 'ready' | 'error';

/**
 * Charges one credit only when the saved property is `ready` (complete import).
 * Draft/error/partial snapshots do not consume credits; balance is read for the response.
 * On consume failure for `ready`, the property row is rolled back.
 */
export async function finalizeCreditForSavedImport(
  supabase: SupabaseUserClient,
  userId: string,
  propertyId: string,
  correlationId: string,
  propertyStatus: PropertyPersistStatus,
): Promise<
  | { ok: true; balanceAfter: number | null; creditConsumed: boolean }
  | {
      ok: false;
      httpStatus: number;
      body: Record<string, unknown>;
    }
> {
  if (propertyStatus !== 'ready') {
    const balanceAfter = await getWalletBalance(supabase, userId);
    return { ok: true, balanceAfter, creditConsumed: false };
  }

  const credit = await consumeImportCreditAfterSave(supabase, userId, propertyId, correlationId);
  if (!credit.ok) {
    await deletePropertyAfterFailedCredit(supabase, propertyId);
    if (credit.code === 'insufficient_credits') {
      return {
        ok: false,
        httpStatus: 200,
        body: {
          ok: false,
          code: 'INSUFFICIENT_CREDITS',
          message: 'You have no import credits left. Add credits or subscribe to continue.',
          balance_after: credit.balanceAfter ?? 0,
        },
      };
    }
    if (credit.code === 'subscription_required') {
      return {
        ok: false,
        httpStatus: 200,
        body: {
          ok: false,
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'An active PropFolio membership is required to import properties.',
          balance_after: credit.balanceAfter ?? 0,
        },
      };
    }
    return {
      ok: false,
      httpStatus: 200,
      body: {
        ok: false,
        code: 'CREDIT_CONSUME_FAILED',
        message: credit.rpcMessage ?? 'Could not apply import credit.',
      },
    };
  }

  return {
    ok: true,
    balanceAfter: credit.balanceAfter,
    creditConsumed: true,
  };
}
