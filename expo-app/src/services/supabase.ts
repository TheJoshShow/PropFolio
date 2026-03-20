/**
 * Supabase client. Returns null when env vars are missing so app stays runnable.
 * Env validation is available via config/env.ts (validateAuthEnv).
 *
 * SECURITY: Only the anon (public) key is used here. Never use the service role
 * key in the client; it bypasses RLS and must only exist in Edge Functions.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

let _client: SupabaseClient | null = null;

function getStorage() {
  // iOS-only: use AsyncStorage. Web branch kept for type safety if Platform is ever web.
  if (typeof Platform !== 'undefined' && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return AsyncStorage;
}

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (typeof Platform !== 'undefined' && Platform.OS === 'web' && typeof window === 'undefined') return null;
  if (_client) return _client;
  _client = createClient(url, anonKey, {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: typeof Platform !== 'undefined' && Platform.OS === 'web',
    },
  });
  return _client;
}

/** Cached client or null if not configured. Only use after mount on web (not during SSR). */
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;
