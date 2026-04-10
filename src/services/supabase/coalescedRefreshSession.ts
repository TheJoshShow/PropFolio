import type { SupabaseClient } from '@supabase/supabase-js';

import {
  logRefreshJoin,
  logRefreshLeaderStart,
  logRefreshSettled,
} from './importAuthTelemetry';

type RefreshResult = Awaited<ReturnType<SupabaseClient['auth']['refreshSession']>>;

/**
 * GoTrue allows only one refresh at a time; overlapping `refreshSession()` calls queue internally
 * and can exceed our outer `withTimeout` even when the network is fine — surfacing
 * "Sign-in refresh is taking too long…" falsely.
 *
 * All app code paths must use this helper instead of calling `client.auth.refreshSession()` directly.
 */
let inFlight: Promise<RefreshResult> | null = null;

export function coalescedRefreshSession(
  client: SupabaseClient,
  source: 'prepare_session' | 'edge_invoke',
): Promise<RefreshResult> {
  if (inFlight) {
    logRefreshJoin(source);
    return inFlight;
  }

  logRefreshLeaderStart(source);
  const t0 = Date.now();

  inFlight = (async (): Promise<RefreshResult> => {
    try {
      const result = await client.auth.refreshSession();
      logRefreshSettled(source, Date.now() - t0, Boolean(result.error));
      return result;
    } catch (e) {
      logRefreshSettled(source, Date.now() - t0, true);
      throw e;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
