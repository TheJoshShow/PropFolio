/**
 * Environment variable validation for PropFolio.
 * Validates auth-related vars when using Supabase; logs warnings in dev when missing.
 * Client uses only EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (anon public key).
 * Service role must never appear in the app.
 */

import { getRuntimeConfig } from './runtimeConfig';

export interface AuthEnvResult {
  isValid: boolean;
  missing: string[];
  /** Non-empty reasons why values look unusable (placeholders, localhost in production, etc.). */
  invalidReasons: string[];
}

/**
 * Safe, non-secret Supabase env snapshot for __DEV__ UI and support.
 * Values come only from `getRuntimeConfig()` / `validateAuthEnv()` (EXPO_PUBLIC_*).
 */
export interface SupabaseAuthEnvPublicDiagnostics {
  expoPublicSupabaseUrlPresent: boolean;
  expoPublicSupabaseAnonKeyPresent: boolean;
  /** Parses as http: or https: with a non-empty hostname. */
  supabaseUrlSyntaxValid: boolean;
  /** URL leg of `validateAuthEnv` (missing/invalid reasons mentioning EXPO_PUBLIC_SUPABASE_URL). */
  supabaseUrlPassesAppValidation: boolean;
  /** Anon key leg of `validateAuthEnv` (EXPO_PUBLIC_SUPABASE_ANON_KEY). */
  supabaseAnonKeyPassesAppValidation: boolean;
  /** Template / example / unsubstituted `${…}` pattern for URL. */
  supabaseUrlAppearsPlaceholderOrUnsubstituted: boolean;
  /** Template or unsubstituted pattern for anon key. */
  supabaseAnonKeyAppearsPlaceholderOrUnsubstituted: boolean;
  /** Full `validateAuthEnv().isValid`. */
  validationOk: boolean;
  missing: string[];
  invalidReasons: string[];
  /** One line per item; safe to show in dev builds (no secrets). */
  developerSummaryLines: string[];
}

function supabaseUrlPassesAppValidation(r: AuthEnvResult): boolean {
  if (r.missing.includes('EXPO_PUBLIC_SUPABASE_URL')) return false;
  return !r.invalidReasons.some((msg) => msg.includes('EXPO_PUBLIC_SUPABASE_URL'));
}

function supabaseAnonKeyPassesAppValidation(r: AuthEnvResult): boolean {
  if (r.missing.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY')) return false;
  return !r.invalidReasons.some((msg) => msg.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
}

function getHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl.trim()).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/** EAS/Expo failed to substitute a secret — value still contains ${EXPO_PUBLIC_…}. */
function looksLikeUnexpandedSubstitution(value: string): boolean {
  const v = value.trim();
  if (/\$\{\s*EXPO_PUBLIC_[A-Z0-9_]+\s*\}/i.test(v)) return true;
  return v.includes('${') && v.toUpperCase().includes('EXPO_PUBLIC');
}

/**
 * Template / tutorial values that should never ship. Checks hostname and full string.
 */
function looksLikePlaceholderSupabaseUrl(url: string): boolean {
  const raw = url.trim();
  if (!raw) return true;
  const lower = raw.toLowerCase();
  if (
    lower.includes('your_supabase') ||
    lower.includes('paste_your') ||
    lower.includes('example.supabase.co') ||
    lower.includes('your_project_ref') ||
    lower.includes('your-project-ref')
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
 * Supabase anon (public) keys are JWT-shaped (eyJ…). Reject obvious templates.
 */
function looksLikePlaceholderAnonKey(key: string): boolean {
  const k = key.trim();
  if (!k) return true;
  const lower = k.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('your_anon') || lower === 'your-anon-key') {
    return true;
  }
  if (k.startsWith('eyJ')) {
    return k.length < 120;
  }
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

function isProductionJsBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && !__DEV__;
}

/**
 * Release builds: https only, hostname must end with .supabase.co (hosted Supabase).
 * Dev: allow http(s) + localhost OR *.supabase.co for local CLI and cloud.
 */
function validateSupabaseUrlHostPolicy(url: string): { ok: boolean; reason: string | null } {
  const trimmed = url.trim();
  let host = '';
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return { ok: false, reason: null };
  }
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');

  if (isProductionJsBuild()) {
    if (isLocal) {
      return {
        ok: false,
        reason: 'EXPO_PUBLIC_SUPABASE_URL must not use localhost in a release build; use https://YOUR_REF.supabase.co from Supabase → Settings → API',
      };
    }
    try {
      const u = new URL(trimmed);
      if (u.protocol !== 'https:') {
        return {
          ok: false,
          reason: 'EXPO_PUBLIC_SUPABASE_URL must use https in release builds (Supabase Dashboard project URL)',
        };
      }
    } catch {
      return { ok: false, reason: null };
    }
    if (!host.endsWith('.supabase.co')) {
      return {
        ok: false,
        reason:
          'EXPO_PUBLIC_SUPABASE_URL must be your Supabase project URL ending in .supabase.co (Settings → API → Project URL)',
      };
    }
    return { ok: true, reason: null };
  }

  // __DEV__
  if (isLocal) return { ok: true, reason: null };
  if (host.endsWith('.supabase.co')) return { ok: true, reason: null };
  return {
    ok: false,
    reason:
      'EXPO_PUBLIC_SUPABASE_URL in development must be either *.supabase.co or localhost (Supabase local)',
  };
}

/**
 * Validate that Supabase auth env vars are present and usable.
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

  if (cfg.supabaseUrl) {
    if (looksLikeUnexpandedSubstitution(cfg.supabaseUrl)) {
      invalidReasons.push(
        'EXPO_PUBLIC_SUPABASE_URL was not replaced at build time — set it in Expo (EAS) Environment variables for this profile and rebuild (avoid leaving literal ${...} in the value)'
      );
    } else if (!isUrlWellFormedHttp(cfg.supabaseUrl)) {
      invalidReasons.push('EXPO_PUBLIC_SUPABASE_URL must be a valid http(s) URL with a hostname');
    } else if (looksLikePlaceholderSupabaseUrl(cfg.supabaseUrl)) {
      invalidReasons.push(
        'EXPO_PUBLIC_SUPABASE_URL still looks like a template — use the real Project URL from Supabase → Settings → API'
      );
    } else {
      const hostPolicy = validateSupabaseUrlHostPolicy(cfg.supabaseUrl);
      if (!hostPolicy.ok && hostPolicy.reason) {
        invalidReasons.push(hostPolicy.reason);
      }
    }
  }

  if (cfg.supabaseAnonKey) {
    if (looksLikeUnexpandedSubstitution(cfg.supabaseAnonKey)) {
      invalidReasons.push(
        'EXPO_PUBLIC_SUPABASE_ANON_KEY was not replaced at build time — set it in Expo EAS Environment variables and rebuild'
      );
    } else if (looksLikePlaceholderAnonKey(cfg.supabaseAnonKey)) {
      invalidReasons.push(
        'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing, too short, or still looks like a placeholder — use the anon public key from Supabase → Settings → API'
      );
    }
  }

  const host = cfg.supabaseUrl ? getHostname(cfg.supabaseUrl) : '';
  if (isProductionJsBuild() && host && (host === 'localhost' || host === '127.0.0.1' || host === '::1')) {
    if (!invalidReasons.some((r) => r.toLowerCase().includes('localhost'))) {
      invalidReasons.push('EXPO_PUBLIC_SUPABASE_URL must not point to localhost in production builds');
    }
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
 * Read-only snapshot for auth screens (development detail panel). Never includes secret values.
 */
export function getSupabaseAuthEnvPublicDiagnostics(): SupabaseAuthEnvPublicDiagnostics {
  const cfg = getRuntimeConfig();
  const r = validateAuthEnv();
  const urlRaw = cfg.supabaseUrl ?? '';
  const keyRaw = cfg.supabaseAnonKey ?? '';
  const urlPresent = Boolean(urlRaw.trim());
  const keyPresent = Boolean(keyRaw.trim());
  const syntaxValid = urlPresent ? isUrlWellFormedHttp(urlRaw) : false;
  const urlSuspect =
    urlRaw.trim().length > 0 &&
    (looksLikeUnexpandedSubstitution(urlRaw) || looksLikePlaceholderSupabaseUrl(urlRaw));
  const keySuspect =
    keyRaw.trim().length > 0 &&
    (looksLikeUnexpandedSubstitution(keyRaw) || looksLikePlaceholderAnonKey(keyRaw));
  const urlPasses = supabaseUrlPassesAppValidation(r);
  const keyPasses = supabaseAnonKeyPassesAppValidation(r);
  const anonLen = keyRaw.trim().length;
  const developerSummaryLines: string[] = [
    `EXPO_PUBLIC_SUPABASE_URL: ${urlPresent ? 'present' : 'missing'}`,
    `EXPO_PUBLIC_SUPABASE_ANON_KEY: ${keyPresent ? `present (${anonLen} characters)` : 'missing'}`,
    `URL syntax (http/https + hostname): ${syntaxValid ? 'valid' : 'invalid'}`,
    `URL passes app validation rules: ${urlPasses ? 'yes' : 'no'}`,
    `Anon key passes app validation rules: ${keyPasses ? 'yes' : 'no'}`,
    `URL looks like placeholder or unsubstituted EAS value: ${urlSuspect ? 'yes' : 'no'}`,
    `Anon key looks like placeholder or unsubstituted EAS value: ${keySuspect ? 'yes' : 'no'}`,
    `Full validateAuthEnv: ${r.isValid ? 'pass' : 'fail'}`,
  ];
  return {
    expoPublicSupabaseUrlPresent: urlPresent,
    expoPublicSupabaseAnonKeyPresent: keyPresent,
    supabaseUrlSyntaxValid: syntaxValid,
    supabaseUrlPassesAppValidation: urlPasses,
    supabaseAnonKeyPassesAppValidation: keyPasses,
    supabaseUrlAppearsPlaceholderOrUnsubstituted: urlSuspect,
    supabaseAnonKeyAppearsPlaceholderOrUnsubstituted: keySuspect,
    validationOk: r.isValid,
    missing: r.missing,
    invalidReasons: r.invalidReasons,
    developerSummaryLines,
  };
}

/**
 * __DEV__ only: log whether Supabase URL/key are present and whether validation passed. No secrets.
 */
export function logSupabaseAuthEnvDiagnostics(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const cfg = getRuntimeConfig();
  const r = validateAuthEnv();
  const urlPresent = Boolean(cfg.supabaseUrl?.trim());
  const anonPresent = Boolean(cfg.supabaseAnonKey?.trim());
  const urlValidForRules = supabaseUrlPassesAppValidation(r);
  const host = cfg.supabaseUrl ? getHostname(cfg.supabaseUrl) : '';
  const hostPreview =
    host.length > 0
      ? host.length > 48
        ? `${host.slice(0, 24)}…${host.slice(-12)}`
        : host
      : '(none)';
  const anonLen = cfg.supabaseAnonKey?.length ?? 0;
  console.log(`Supabase URL present: ${urlPresent ? 'yes' : 'no'}`);
  console.log(`Supabase anon key present: ${anonPresent ? 'yes' : 'no'}`);
  console.log(`Supabase URL valid: ${urlValidForRules ? 'yes' : 'no'}`);
  console.log('[PropFolio][Supabase env]', {
    urlPresent,
    anonKeyPresent: anonPresent,
    anonKeyCharLength: anonLen,
    validationOk: r.isValid,
    hostnamePreview: hostPreview,
  });
  if (!r.isValid) {
    console.warn('[PropFolio][Supabase env] validation details (dev only):', {
      missing: r.missing,
      invalidReasons: r.invalidReasons,
    });
  }
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
  if (low.includes('not replaced at build time') || low.includes('literal')) {
    return 'This build is missing Supabase settings from EAS. In expo.dev → your project → Environment variables, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for the Production environment, then create a new build.';
  }
  if (low.includes('localhost') && low.includes('release')) {
    return 'This release build is pointed at a local server. Set EXPO_PUBLIC_SUPABASE_URL to your https://…supabase.co URL in EAS and rebuild.';
  }
  if (low.includes('.supabase.co') || low.includes('project url')) {
    return 'The Supabase URL in this build is wrong. In EAS, set EXPO_PUBLIC_SUPABASE_URL to the exact https URL from Supabase → Settings → API (it ends with .supabase.co), then rebuild.';
  }
  if (low.includes('https') && low.includes('release')) {
    return 'Supabase must use https in release builds. Fix EXPO_PUBLIC_SUPABASE_URL in EAS and rebuild.';
  }
  if (low.includes('localhost')) {
    return 'This app build is pointed at a development server. Use a production build with your real Supabase URL or contact support.';
  }
  if (low.includes('template') || low.includes('placeholder')) {
    return 'This build is still using template Supabase settings. Add your real project URL and anon key in EAS environment variables, then create a new build.';
  }
  if (low.includes('anon') || low.includes('too short')) {
    return 'The Supabase API key in this build is missing or incomplete. Set EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS for preview/production and rebuild.';
  }
  if (low.includes('development must')) {
    return 'Supabase URL is invalid for development. Use https://YOUR_REF.supabase.co or a local Supabase URL (localhost).';
  }
  if (low.includes('url')) {
    return 'The Supabase URL in this build is invalid. Set EXPO_PUBLIC_SUPABASE_URL in EAS to your Supabase Project URL, then rebuild.';
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
