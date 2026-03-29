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

/**
 * Template / tutorial values that should never ship. Checks hostname primarily to avoid
 * false positives (e.g. unrelated "xxx" substrings in query strings).
 */
function looksLikePlaceholderSupabaseUrl(url: string): boolean {
  const raw = url.trim();
  if (!raw) return true;
  const lower = raw.toLowerCase();
  // Doc / .env.example patterns (whole-string hints)
  if (
    lower.includes('your_supabase') ||
    lower.includes('paste_your') ||
    lower.includes('example.supabase.co')
  ) {
    return true;
  }
  let host = '';
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return true;
  }
  if (!host) return true;
  if (host.includes('your-project') || host.includes('placeholder')) return true;
  return false;
}

/**
 * Supabase anon (public) keys are JWT-shaped (eyJ…). Reject obvious templates; avoid rejecting
 * real keys with a brittle minimum length on non-JWT secrets.
 */
function looksLikePlaceholderAnonKey(key: string): boolean {
  const k = key.trim();
  if (!k) return true;
  const lower = k.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('your_anon') || lower === 'your-anon-key') {
    return true;
  }
  if (k.startsWith('eyJ')) {
    // Real project JWTs are typically 180+ chars; allow some margin for unusual signing
    return k.length < 120;
  }
  // Nonstandard format: only flag if obviously too short to be a real key
  return k.length < 40;
}

function isUrlWellFormedHttp(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (!u.hostname) return false;
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
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

  if (cfg.supabaseUrl && !isUrlWellFormedHttp(cfg.supabaseUrl)) {
    invalidReasons.push('EXPO_PUBLIC_SUPABASE_URL must be a valid http(s) URL with a hostname');
  } else if (cfg.supabaseUrl && looksLikePlaceholderSupabaseUrl(cfg.supabaseUrl)) {
    invalidReasons.push('EXPO_PUBLIC_SUPABASE_URL still looks like a template (replace with your project URL from Supabase → Settings → API)');
  }

  if (cfg.supabaseAnonKey && looksLikePlaceholderAnonKey(cfg.supabaseAnonKey)) {
    invalidReasons.push(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing, too short, or still looks like a placeholder (use the anon public key from Supabase → Settings → API)'
    );
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

function userMessageForInvalidReasons(r: AuthEnvResult): string {
  const first = r.invalidReasons[0] ?? '';
  const low = first.toLowerCase();
  if (low.includes('localhost')) {
    return 'This app build is pointed at a development server. Use a production build with your real Supabase URL or contact support.';
  }
  if (low.includes('template') || low.includes('placeholder')) {
    return 'This build is still using template Supabase settings. Add your real project URL and anon key in EAS environment variables (Expo dashboard), then create a new build.';
  }
  if (low.includes('anon') || low.includes('too short')) {
    return 'The Supabase API key in this build is missing or incomplete. Set EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS for preview/production and rebuild.';
  }
  if (low.includes('url')) {
    return 'The Supabase URL in this build is invalid. Set EXPO_PUBLIC_SUPABASE_URL to https://YOUR_PROJECT_REF.supabase.co in EAS and rebuild.';
  }
  return 'Account services are not configured correctly in this build. Update the app or contact support.';
}

/**
 * Short user-facing explanation when Supabase env is missing or invalid (production-safe wording).
 */
export function getAuthConfigurationUserMessage(): string | null {
  const r = validateAuthEnv();
  if (r.isValid) return null;
  if (r.missing.length > 0) {
    return 'Account creation isn’t available in this build (missing server configuration). Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS, then rebuild.';
  }
  return userMessageForInvalidReasons(r);
}
