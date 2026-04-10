import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthPrepError, isInvalidRefreshTokenError } from './authPrepErrors';
import { coalescedRefreshSession } from './coalescedRefreshSession';
import { logAuthSessionSnapshot, readAuthSessionSnapshot } from './authSessionDiagnostics';
import {
  AUTH_REFRESH_SESSION_TIMEOUT_MS,
  GET_SESSION_FOR_EDGE_BUDGET_MS,
} from './edgeInvokeAuthConstants';
import { logImportAuthEvent, logRefreshTimeout } from './importAuthTelemetry';
import { syncSessionMirrorFromSession } from './sessionMirrorForEdge';

async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => Error): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(onTimeout()), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/**
 * Ensures persisted session is loaded into the in-memory mirror for Edge calls.
 *
 * Root cause addressed (RN): without AppState → `startAutoRefresh`, tokens often stay stale until
 * import forces `refreshSession()`. That competes with other work and our old 45s-ahead proactive
 * refresh duplicated GoTrue work, so `refreshSession()` could stall until `withTimeout` fired — user
 * saw “Could not refresh your sign-in in time” even on a valid account.
 *
 * We only call `refreshSession()` here when the access token is **already expired** (not merely
 * “within 45s of expiry”); imminent refresh is handled by Supabase auto-refresh + edgeInvoke’s
 * Authorization path.
 *
 * All refreshes go through `coalescedRefreshSession` so we never stack multiple GoTrue refresh calls.
 */
export async function prepareSessionForEdgeInvoke(client: SupabaseClient): Promise<void> {
  logImportAuthEvent('prepare_session_start');

  const { data, error } = await withTimeout(
    client.auth.getSession(),
    GET_SESSION_FOR_EDGE_BUDGET_MS,
    () =>
      new AuthPrepError(
        'get_session_timeout',
        'Could not read your saved sign-in. Check your connection or try signing in again.',
      ),
  );

  if (error) {
    syncSessionMirrorFromSession(null);
    if (isInvalidRefreshTokenError(error)) {
      throw new AuthPrepError(
        'invalid_refresh',
        'Your session is no longer valid. Please sign in again.',
      );
    }
    throw new Error(error.message || 'Sign-in data could not be read.');
  }

  let session = data.session;
  syncSessionMirrorFromSession(session ?? null);

  if (!session?.access_token || !session.user?.id) {
    throw new AuthPrepError('no_session', 'Sign in to import properties.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const exp = session.expires_at;
  const accessExpired = typeof exp === 'number' && exp <= nowSec;

  if (accessExpired) {
    if (!session.refresh_token) {
      throw new AuthPrepError(
        'invalid_refresh',
        'Your session is no longer valid. Please sign in again.',
      );
    }

    logImportAuthEvent('prepare_session_expired_access', { expiresAt: exp, nowSec });

    const { data: refData, error: refErr } = await withTimeout(
      coalescedRefreshSession(client, 'prepare_session'),
      AUTH_REFRESH_SESSION_TIMEOUT_MS,
      () => {
        logRefreshTimeout('prepare_session', AUTH_REFRESH_SESSION_TIMEOUT_MS);
        return new AuthPrepError(
          'refresh_timeout',
          'Sign-in refresh is taking too long. Check your connection and try again, or sign in again.',
        );
      },
    );

    session = refData.session ?? null;
    syncSessionMirrorFromSession(session);
    if (refErr) {
      syncSessionMirrorFromSession(null);
      if (isInvalidRefreshTokenError(refErr)) {
        throw new AuthPrepError(
          'invalid_refresh',
          'Your session is no longer valid. Please sign in again.',
        );
      }
      throw new Error(refErr.message || 'Could not refresh your sign-in.');
    }
    if (!session?.access_token || !session.user?.id) {
      syncSessionMirrorFromSession(null);
      throw new AuthPrepError(
        'invalid_refresh',
        'Your session is no longer valid. Please sign in again.',
      );
    }
  }

  if (__DEV__) {
    const snap = await readAuthSessionSnapshot(client);
    logImportAuthEvent('prepare_session_done', {
      userIdPresent: snap.userId ? 'yes' : 'no',
      hasAccessToken: snap.hasAccessToken,
      hasRefreshToken: snap.hasRefreshToken,
      expiresAt: snap.expiresAt ?? null,
    });
  }
}

/** Dev-only: log when the import screen gains focus (session vs UI “signed in”). */
export function logImportScreenAuthFocus(client: SupabaseClient): void {
  logAuthSessionSnapshot(client, 'import-screen:focus');
}
