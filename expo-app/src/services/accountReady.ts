import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileMetadata } from './profile';
import { ensureProfileWithFallback } from './profile';
import { logErrorSafe, logImportStep } from './diagnostics';
import { IMPORT_USER_MESSAGES, messageForAccountSetupFailure } from './importErrorMessages';

export type AccountReadyResult =
  | { status: 'ready'; usedMinimalProfile?: boolean }
  | { status: 'no_session'; message: string }
  | { status: 'profile_upsert_failed'; message: string; diagnostic?: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log import diagnostics for debugging. Never logs user id, email, or tokens (PII policy).
 * Logs step name + optional error code / action label.
 */
function logImportDiagnostic(
  step: string,
  detail: { code?: string; action?: string; usedMinimal?: boolean }
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const parts = [step];
  if (detail.code) parts.push(`code=${detail.code}`);
  if (detail.action) parts.push(`action=${detail.action}`);
  if (detail.usedMinimal != null) parts.push(`minimal=${detail.usedMinimal}`);
  console.log(`[PropFolio] Import diagnostic: ${parts.join(' | ')}`);
}

/**
 * Ensures Supabase client has a valid session + JWT, then ensures `profiles` row exists.
 *
 * Root causes this addresses:
 * - Race after sign-in: JWT not yet attached for RLS-protected upsert → retry + optional refresh.
 * - Stale React `session.id` vs server: validate with getUser() and compare ids.
 * - Schema drift / partial failures on full profile payload → fallback to minimal upsert (`id` + `updated_at`).
 *
 * Idempotent: safe to call on every import attempt.
 */
export async function ensureUserReadyForImport(
  supabase: SupabaseClient,
  expectedUserId: string
): Promise<AccountReadyResult> {
  logImportStep('account_ready_start', {});

  // 1) Local session (ensures client has loaded persisted session from storage)
  let sessionUserId: string | null = null;
  for (let s = 0; s < 2; s++) {
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) logErrorSafe('AccountReady getSession', sessionErr);
      sessionUserId = sessionData?.session?.user?.id ?? null;
    } catch (e) {
      logErrorSafe('AccountReady getSession (throw)', e);
    }
    if (sessionUserId) break;
    if (s === 0) await sleep(300);
  }

  if (!sessionUserId) {
    logImportDiagnostic('account_ready_no_session', { action: 'getSession' });
    return { status: 'no_session', message: IMPORT_USER_MESSAGES.sessionExpired };
  }

  if (sessionUserId !== expectedUserId) {
    logImportDiagnostic('account_ready_session_mismatch', { action: 'session_vs_expected' });
    return { status: 'no_session', message: IMPORT_USER_MESSAGES.sessionMismatch };
  }

  // 2) Validated user (network-validated JWT); more retries than getSession alone
  let user: User | null = null;
  const authAttempts = 4;
  for (let i = 0; i < authAttempts; i++) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        logErrorSafe('AccountReady getUser', error);
        const code = (error as { code?: string }).code;
        logImportDiagnostic('account_ready_get_user_error', { code });
        // One refresh attempt mid-loop if JWT looks stale
        if (i === 1) {
          const { error: refErr } = await supabase.auth.refreshSession();
          if (refErr) logErrorSafe('AccountReady refreshSession', refErr);
        }
      } else {
        user = data?.user ?? null;
        if (user?.id) break;
      }
    } catch (e) {
      logErrorSafe('AccountReady getUser (throw)', e);
    }
    if (i < authAttempts - 1) await sleep(400 * (i + 1));
  }

  if (!user?.id) {
    logImportDiagnostic('account_ready_get_user_empty', { action: 'after_retries' });
    return { status: 'no_session', message: IMPORT_USER_MESSAGES.sessionExpired };
  }

  if (user.id !== expectedUserId) {
    return { status: 'no_session', message: IMPORT_USER_MESSAGES.sessionMismatch };
  }

  const metadata = (user.user_metadata ?? null) as ProfileMetadata | null;

  // 3) Profile row (full payload with metadata, then minimal fallback inside ensureProfileWithFallback)
  const profileAttempts = 3;
  let lastErr: Error | null = null;
  let usedMinimal = false;

  for (let i = 0; i < profileAttempts; i++) {
    const { error, usedMinimal: um } = await ensureProfileWithFallback(
      supabase,
      user.id,
      metadata
    );
    usedMinimal = um;
    if (!error) {
      logImportStep('account_ready_profile_ok', { attempt: i + 1 });
      logImportDiagnostic('account_ready_profile_ok', { usedMinimal: um });
      return { status: 'ready', usedMinimalProfile: um };
    }
    lastErr = error;
    logErrorSafe('AccountReady ensureProfileWithFallback', error);
    const pgCode = (error as { code?: string }).code;
    const msg = error.message ?? '';
    logImportDiagnostic('account_ready_profile_fail', {
      code: pgCode ?? msg.slice(0, 80),
      action: 'ensureProfileWithFallback',
      usedMinimal: um,
    });

    // Last attempt: try refresh session once more then retry
    if (i === profileAttempts - 2) {
      await supabase.auth.refreshSession();
      await sleep(500);
    }
    if (i < profileAttempts - 1) await sleep(500 * (i + 1));
  }

  const mapped = messageForAccountSetupFailure({
    rawMessage: lastErr?.message ?? '',
    code: (lastErr as { code?: string } | undefined)?.code,
  });

  // After retries: persistent permission / RLS failures are unlikely to self-heal on the device.
  const low = lastErr?.message?.toLowerCase() ?? '';
  const unrecoverable =
    low.includes('permission denied') ||
    low.includes('row-level security') ||
    low.includes('violates row-level security');

  return {
    status: 'profile_upsert_failed',
    message: unrecoverable ? IMPORT_USER_MESSAGES.accountSetupUnrecoverable : mapped.userMessage,
    diagnostic: lastErr?.message,
  };
}

/** @deprecated Use ensureUserReadyForImport — same implementation */
export const ensureUserAccountReady = ensureUserReadyForImport;
