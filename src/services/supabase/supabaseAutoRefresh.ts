import type { SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * React Native / Expo: Supabase does not run browser-style background token refresh timers.
 * Without wiring AppState → start/stopAutoRefresh, sessions often stay stale until a forced
 * `refreshSession()` — which then races other work and can hit our long `withTimeout` paths.
 *
 * @see https://supabase.com/docs/reference/javascript/auth-startautorefresh
 */
export function registerSupabaseAuthAutoRefresh(client: SupabaseClient): () => void {
  const auth = client.auth as unknown as {
    startAutoRefresh?: () => void;
    stopAutoRefresh?: () => void;
  };

  if (typeof auth.startAutoRefresh !== 'function' || typeof auth.stopAutoRefresh !== 'function') {
    if (__DEV__) {
      console.warn(
        '[PropFolio auth] Client missing startAutoRefresh/stopAutoRefresh — upgrade @supabase/supabase-js',
      );
    }
    return () => {};
  }

  const sync = (state: AppStateStatus) => {
    if (state === 'active') {
      auth.startAutoRefresh!();
    } else {
      auth.stopAutoRefresh!();
    }
  };

  sync(AppState.currentState);
  const sub = AppState.addEventListener('change', sync);

  return () => {
    sub.remove();
    auth.stopAutoRefresh!();
  };
}
