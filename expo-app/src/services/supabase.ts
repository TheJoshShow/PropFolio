/**
 * Supabase client. Returns null when env vars are missing so app stays runnable.
 * Env validation: `validateAuthEnv()` from `../config`.
 *
 * SECURITY: Only the anon (public) key is used here. Never use the service role
 * key in the client; it bypasses RLS and must only exist in Edge Functions.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { validateAuthEnv } from '../config/env';
import { getRuntimeConfig } from '../config/runtimeConfig';
import { logErrorSafe } from './diagnostics';

let _client: SupabaseClient | null = null;
let _cachedCredentialsKey: string | null = null;
/** Set when createClient throws despite env validation passing (for diagnostics / user messaging). */
let _lastCreateClientError: string | null = null;

/** Reject obviously invalid env before createClient (which can throw on bad URLs). */
function canInitSupabase(urlRaw: string, anonKeyRaw: string): boolean {
  const url = urlRaw.trim();
  const anonKey = anonKeyRaw.trim();
  if (!url || !anonKey) return false;
  try {
    const u = new URL(url);
    if (!u.hostname) return false;
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function getStorage() {
  // iOS-only: use AsyncStorage. Web branch kept for type safety if Platform is ever web.
  if (typeof Platform !== 'undefined' && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return AsyncStorage;
}

/**
 * When validateAuthEnv() is valid but getSupabase() still returns null, explains why (user-safe string).
 */
export function explainAccountServicesInitUserMessage(): string | null {
  if (!validateAuthEnv().isValid) return null;
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = getRuntimeConfig();
  if (!canInitSupabase(url, anonKey)) {
    return 'This build has an invalid Supabase URL or API key format. For TestFlight or the App Store, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables and rebuild.';
  }
  const c = getSupabase();
  if (c) return null;
  if (typeof __DEV__ !== 'undefined' && __DEV__ && _lastCreateClientError) {
    console.warn('[PropFolio] Supabase createClient failed:', _lastCreateClientError);
  }
  return 'Account services could not start. Update the app or contact support.';
}

export function getSupabase(): SupabaseClient | null {
  if (!validateAuthEnv().isValid) {
    _client = null;
    _cachedCredentialsKey = null;
    _lastCreateClientError = null;
    return null;
  }
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = getRuntimeConfig();
  if (!canInitSupabase(url, anonKey)) {
    _client = null;
    _cachedCredentialsKey = null;
    _lastCreateClientError = null;
    return null;
  }
  if (typeof Platform !== 'undefined' && Platform.OS === 'web' && typeof window === 'undefined') return null;
  const credKey = `${url.trim()}\0${anonKey.trim()}`;
  if (_client && _cachedCredentialsKey === credKey) {
    return _client;
  }
  try {
    _cachedCredentialsKey = credKey;
    _lastCreateClientError = null;
    _client = createClient(url.trim(), anonKey.trim(), {
      auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: true,
        /** PKCE: email confirmation / recovery redirects return `?code=` — must call `exchangeCodeForSession`. */
        flowType: 'pkce',
        detectSessionInUrl: typeof Platform !== 'undefined' && Platform.OS === 'web',
      },
    });
    return _client;
  } catch (e) {
    logErrorSafe('getSupabase createClient failed (invalid env or SDK error)', e);
    _lastCreateClientError = e instanceof Error ? e.message : String(e);
    _client = null;
    _cachedCredentialsKey = null;
    return null;
  }
}

/**
 * Cached client snapshot for legacy imports.
 * - **Native (iOS/Android):** same as `getSupabase()` — do not gate on `window` (RN may not define it).
 * - **Web:** only after `window` exists (avoids SSR creating a client without storage).
 */
export const supabase: SupabaseClient | null =
  Platform.OS === 'web'
    ? typeof window !== 'undefined'
      ? getSupabase()
      : null
    : getSupabase();
