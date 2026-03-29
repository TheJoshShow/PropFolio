/**
 * Redirect URLs for Supabase email flows (confirm signup, password reset).
 * Must match URLs configured in Supabase Dashboard > Auth > URL configuration.
 *
 * Native deep links use PKCE (`?code=`) only — not legacy implicit `#access_token` returns.
 */

import { Platform } from 'react-native';
import { getRuntimeConfig } from '../config';

const EMAIL_AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * Where Supabase should send users after they tap a link in email (confirm account or reset password).
 * - Web: current origin (e.g. https://app.example.com or http://localhost:8084)
 * - Native: propfolio://auth/callback (scheme from app.config / app.json)
 */
export function getEmailAuthRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  const scheme = getRuntimeConfig().appScheme;
  return `${scheme}://${EMAIL_AUTH_CALLBACK_PATH}`;
}

/**
 * Parse hash + query for email auth callback URLs (search overrides hash, same as Supabase auth-js).
 */
export function parseEmailAuthCallbackParams(href: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const url = new URL(href);
    if (url.hash && url.hash[0] === '#') {
      try {
        const hashSearchParams = new URLSearchParams(url.hash.substring(1));
        hashSearchParams.forEach((value, key) => {
          result[key] = value;
        });
      } catch {
        // hash is not a query string
      }
    }
    url.searchParams.forEach((value, key) => {
      result[key] = value;
    });
  } catch {
    return {};
  }
  return result;
}

function isOurEmailAuthCallbackPath(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('propfolio:')) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      const path = u.pathname.toLowerCase();
      if (host === 'auth' && path === '/callback') return true;
      if (path === '/auth/callback' || path.endsWith('/auth/callback')) return true;
    } catch {
      return lower.includes('auth/callback');
    }
    return lower.includes('auth/callback');
  }

  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return path === '/auth/callback' || path.endsWith('/auth/callback');
  } catch {
    return lower.includes('auth/callback');
  }
}

/**
 * Whether the URL carries material we handle: PKCE `code` or email-link error query params.
 * Does not treat `#access_token` alone as a signal — that path is not used for MVP email auth.
 */
export function hasEmailAuthCallbackPayload(url: string): boolean {
  const params = parseEmailAuthCallbackParams(url);
  return Boolean(params.code || params.error || params.error_code || params.error_description);
}

/**
 * True when the URL is our configured email callback path and includes a PKCE code or error payload.
 */
export function isEmailAuthCallbackUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;
  if (!hasEmailAuthCallbackPayload(url)) return false;
  return isOurEmailAuthCallbackPath(url);
}

export function getEmailAuthCallbackPath(): string {
  return EMAIL_AUTH_CALLBACK_PATH;
}
