/**
 * Environment variable validation for PropFolio.
 * Validates auth-related vars when using Supabase; logs warnings in dev when missing.
 * We only ever validate URL + anon key (client-safe). Service role must never be in client env.
 */

import { getRuntimeConfig } from './runtimeConfig';

export interface AuthEnvResult {
  isValid: boolean;
  missing: string[];
  /** Non-empty reasons why values look unusable (placeholders, localhost in production, etc.). */
  invalidReasons: string[];
}

function getHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl.trim()).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/** Reject template placeholders so `isAuthConfigured` matches a real Supabase project. */
function looksLikePlaceholderSupabaseUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  if (u.includes('your_supabase') || u.includes('your-project') || u.includes('placeholder')) return true;
  if (u.includes('paste_your') || u.includes('xxx')) return true;
  return false;
}

function looksLikePlaceholderAnonKey(key: string): boolean {
  const k = key.trim();
  if (k.length < 80) return true;
  const lower = k.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('your_anon')) return true;
  return false;
}

/**
 * Validate that Supabase auth env vars are present and non-empty.
 * Use when you need real auth (e.g. before calling Supabase auth APIs).
 * Production/TestFlight builds require these; when invalid, auth and backend features are unavailable.
 */
export function validateAuthEnv(): AuthEnvResult {
  const cfg = getRuntimeConfig();
  const missing: string[] = [];
  const invalidReasons: string[] = [];
  if (!cfg.supabaseUrl) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!cfg.supabaseAnonKey) {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (cfg.supabaseUrl && looksLikePlaceholderSupabaseUrl(cfg.supabaseUrl)) {
    invalidReasons.push('EXPO_PUBLIC_SUPABASE_URL looks like a placeholder');
  }
  if (cfg.supabaseAnonKey && looksLikePlaceholderAnonKey(cfg.supabaseAnonKey)) {
    invalidReasons.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is missing or too short to be a real anon key');
  }

  const host = cfg.supabaseUrl ? getHostname(cfg.supabaseUrl) : '';
  const isProdBuild = typeof __DEV__ !== 'undefined' && !__DEV__;
  if (isProdBuild && host && (host === 'localhost' || host === '127.0.0.1' || host === '::1')) {
    invalidReasons.push('EXPO_PUBLIC_SUPABASE_URL must not point to localhost in production builds');
  }

  const isValid = missing.length === 0 && invalidReasons.length === 0;
  if (!isValid && typeof __DEV__ !== 'undefined' && __DEV__) {
    if (missing.length > 0) {
      console.warn(
        '[PropFolio] Auth env missing:',
        missing.join(', '),
        '— set both in .env (or EAS env) for production auth.'
      );
    }
    if (invalidReasons.length > 0) {
      console.warn('[PropFolio] Auth env invalid:', invalidReasons.join('; '));
    }
  }
  return { isValid, missing, invalidReasons };
}

/**
 * Whether the current env has both Supabase URL and anon key set.
 */
export function isAuthEnvConfigured(): boolean {
  return validateAuthEnv().isValid;
}
