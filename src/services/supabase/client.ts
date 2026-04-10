/**
 * Supabase client (anon key). Session persistence: AsyncStorage.
 * React Native token timers: `AuthProvider` registers AppState → start/stopAutoRefresh (required by Supabase for RN).
 * Setup checklist: docs/AUTH_DEVELOPER_CHECKLIST.md
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '@/config';

let singleton: SupabaseClient | null = null;

/**
 * Single Supabase client for the app. Sessions persist via AsyncStorage and restore on cold start.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  if (!singleton) {
    singleton = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return singleton;
}

export function tryGetSupabaseClient(): SupabaseClient | null {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}
