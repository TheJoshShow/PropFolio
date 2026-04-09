import type { SupabaseClient } from '@supabase/supabase-js';
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';

import { createAbortError, isAbortError } from '@/lib/abortError';
import { getSupabaseClient } from '@/services/supabase';
import {
  getMirroredAccessTokenIfFresh,
  syncSessionMirrorFromSession,
} from '@/services/supabase/sessionMirrorForEdge';

/** Places + lighter edge calls — allow cold starts and slow mobile networks. */
const DEFAULT_TIMEOUT_MS = 55_000;
/** Listing + manual import: listing prep + RentCast (parallel) + DB + credit RPC; under Supabase wall-clock limits. */
export const IMPORT_PROPERTY_TIMEOUT_MS = 95_000;
/** Network refresh — must allow slow cellular / cold Supabase auth. */
const AUTH_REFRESH_SESSION_TIMEOUT_MS = 75_000;
/**
 * Only proactively refresh the JWT when it expires within this many seconds.
 * A large buffer causes frequent refresh calls before `import-property`; on slow networks those can
 * time out and surface as generic “connection” errors before the Edge Function runs.
 */
const TOKEN_REFRESH_BUFFER_SEC = 45;

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

function isLikelyJwtAuthFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('jwt') ||
    m.includes('invalid token') ||
    m.includes('malformed') ||
    (m.includes('not a valid') && m.includes('token')) ||
    m.includes('token expired') ||
    m.includes('expired token') ||
    m.includes('invalid_grant')
  );
}

function mapInfrastructureInvokeMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (
    m.includes('requested function was not found') ||
    m.includes('function not found') ||
    (m.includes('edge function') && m.includes('not found'))
  ) {
    return 'That service is not available right now. Try again in a few minutes or update the app.';
  }
  if (m.includes('request timed out') || (m.includes('timeout') && m.includes('try again'))) {
    return 'This listing took too long to load. Please try again.';
  }
  return raw;
}

function friendlyAuthFailureMessage(raw: string): string {
  if (isLikelyJwtAuthFailure(raw)) {
    return 'Your session expired or is not ready. Please sign in again, then retry the import.';
  }
  return mapInfrastructureInvokeMessage(raw);
}

/**
 * Builds `Authorization: Bearer <user access_token>` for Edge Functions.
 * - Never falls back to the anon key (that surfaces as "Invalid JWT" from the gateway).
 * - Proactively refreshes when the access token is close to expiry.
 */
async function authorizationHeaderForEdgeInvoke(
  client: SupabaseClient,
  forceRefresh: boolean,
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);

  if (forceRefresh) {
    const { data, error } = await withTimeout(
      client.auth.refreshSession(),
      AUTH_REFRESH_SESSION_TIMEOUT_MS,
      'Could not refresh your sign-in in time. Check your connection and try again.',
    );
    const token = data.session?.access_token;
    if (error || !data.session?.user?.id || !token) {
      throw new Error('Your session expired. Please sign in again.');
    }
    syncSessionMirrorFromSession(data.session);
    return `Bearer ${token}`;
  }

  const mirrored = getMirroredAccessTokenIfFresh(nowSec, TOKEN_REFRESH_BUFFER_SEC);
  if (mirrored) {
    return `Bearer ${mirrored}`;
  }

  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error || !session?.user?.id || !session.access_token) {
    throw new Error('Sign in to import properties.');
  }

  syncSessionMirrorFromSession(session);

  const exp = session.expires_at;
  if (typeof exp === 'number' && exp <= nowSec + TOKEN_REFRESH_BUFFER_SEC) {
    return authorizationHeaderForEdgeInvoke(client, true);
  }

  return `Bearer ${session.access_token}`;
}

/**
 * Reads JSON error body from a non-2xx Edge Function response.
 */
export async function extractEdgeFunctionErrorMessage(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) {
    return null;
  }
  const res = error.context;
  if (!(res instanceof Response)) {
    return null;
  }
  try {
    const text = await Promise.race([
      res.clone().text(),
      /** Don’t hang import if the error body never finishes reading. */
      new Promise<string>((resolve) => setTimeout(() => resolve(''), 5_000)),
    ]);
    if (!text?.trim()) {
      return null;
    }
    try {
      const j = JSON.parse(text) as Record<string, unknown>;
      if (typeof j.error === 'string' && j.error.length > 0) {
        return j.error;
      }
      if (typeof j.message === 'string' && j.message.length > 0) {
        return j.message;
      }
    } catch {
      if (text.length > 0 && text.length < 400) {
        return text;
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function extractFunctionsRelayMessage(error: FunctionsRelayError): Promise<string | null> {
  const ctx = error.context;
  if (ctx instanceof Response) {
    try {
      const t = await Promise.race([
        ctx.clone().text(),
        new Promise<string>((resolve) => setTimeout(() => resolve(''), 5_000)),
      ]);
      if (t.trim().length > 0 && t.length < 400) {
        return t.trim();
      }
    } catch {
      return null;
    }
  }
  return null;
}

function extractFetchErrorCauseMessage(error: FunctionsFetchError): string | null {
  const ctx = error.context;
  if (ctx instanceof Error && typeof ctx.message === 'string' && ctx.message.length > 0) {
    return ctx.message;
  }
  if (ctx != null && typeof ctx === 'object' && 'message' in ctx) {
    const m = (ctx as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) {
      return m;
    }
  }
  return null;
}

/**
 * Best-effort message from `functions.invoke` errors (HTTP, relay, or transport).
 */
export async function extractFunctionInvokeFailureDetail(error: unknown): Promise<string | null> {
  if (error instanceof FunctionsHttpError) {
    return extractEdgeFunctionErrorMessage(error);
  }
  if (error instanceof FunctionsFetchError) {
    return extractFetchErrorCauseMessage(error) ?? error.message;
  }
  if (error instanceof FunctionsRelayError) {
    return (await extractFunctionsRelayMessage(error)) ?? error.message;
  }
  return null;
}

/**
 * Invokes a Supabase Edge Function with the **signed-in user's** JWT, timeout, and limited retries.
 * Passes `Authorization` explicitly so the request never uses the anon key as Bearer (avoids "Invalid JWT").
 */
export async function invokeEdgeFunction<TResponse>(
  name: string,
  body: Record<string, unknown>,
  options?: { retries?: number; timeoutMs?: number; signal?: AbortSignal },
): Promise<TResponse> {
  const retries = options?.retries ?? 2;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const signal = options?.signal;
  const client = getSupabaseClient();

  let lastMessage = 'Import failed';
  let forceRefreshNext = false;
  /** One refresh+retry even when `retries === 0` (otherwise JWT recovery never runs). */
  let jwtRecoveryAttempted = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const authorization = await authorizationHeaderForEdgeInvoke(client, forceRefreshNext);
      forceRefreshNext = false;

      /**
       * Use Supabase `timeout` so the underlying fetch is aborted (some RN stacks don’t complete
       * `Promise.race` if `invoke` never settles). Keep an outer race as a fallback.
       */
      const payload = await Promise.race([
        (async () => {
          const { data, error } = await client.functions.invoke<TResponse>(name, {
            body,
            headers: { Authorization: authorization },
            timeout: timeoutMs,
            signal,
          });
          if (error) {
            const detail = await extractFunctionInvokeFailureDetail(error);
            throw new Error(detail || (error as Error).message || 'Edge function error');
          }
          return data;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('This listing took too long to load. Please try again.')),
            timeoutMs + 15_000,
          ),
        ),
      ]);

      if (payload == null) {
        throw new Error('Empty response from server');
      }
      return payload as TResponse;
    } catch (e) {
      if (signal?.aborted || isAbortError(e)) {
        throw createAbortError();
      }

      lastMessage = e instanceof Error ? e.message : 'Import failed';

      const jwtFail = isLikelyJwtAuthFailure(lastMessage);
      if (jwtFail && attempt < retries) {
        forceRefreshNext = true;
        await sleep(250);
        continue;
      }
      if (jwtFail && !jwtRecoveryAttempted) {
        jwtRecoveryAttempted = true;
        forceRefreshNext = true;
        await sleep(250);
        attempt -= 1;
        continue;
      }

      if (attempt < retries) {
        await sleep(350 * (attempt + 1));
      }
    }
  }

  throw new Error(friendlyAuthFailureMessage(lastMessage));
}
