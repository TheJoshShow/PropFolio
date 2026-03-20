/**
 * Environment variable validation for PropFolio.
 * Validates auth-related vars when using Supabase; logs warnings in dev when missing.
 * We only ever validate URL + anon key (client-safe). Service role must never be in client env.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface AuthEnvResult {
  isValid: boolean;
  missing: string[];
}

/**
 * Validate that Supabase auth env vars are present and non-empty.
 * Use when you need real auth (e.g. before calling Supabase auth APIs).
 * Production/TestFlight builds require these; when invalid, auth and backend features are unavailable.
 */
export function validateAuthEnv(): AuthEnvResult {
  const missing: string[] = [];
  if (!SUPABASE_URL || SUPABASE_URL.trim() === '') {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.trim() === '') {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  const isValid = missing.length === 0;
  if (!isValid && typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      '[PropFolio] Auth env missing:',
      missing.join(', '),
      '— set both in .env (or EAS env) for production auth.'
    );
  }
  return { isValid, missing };
}

/**
 * Whether the current env has both Supabase URL and anon key set.
 */
export function isAuthEnvConfigured(): boolean {
  return validateAuthEnv().isValid;
}
