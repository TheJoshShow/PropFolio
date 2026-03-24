/**
 * Auth redirect URL for OAuth and magic link.
 * Must match URLs configured in Supabase Dashboard > Auth > URL configuration.
 */

import { Platform } from 'react-native';
import { getRuntimeConfig } from '../config';

const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * Redirect URL for the current platform.
 * - Web: current origin (e.g. https://app.example.com or http://localhost:8084)
 * - Native: propfolio://auth/callback (scheme from app.json)
 */
export function getAuthRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Use a deterministic scheme callback for TestFlight/production iOS.
  const scheme = getRuntimeConfig().appScheme;
  return `${scheme}://${AUTH_CALLBACK_PATH}`;
}

/**
 * Parse hash + query like `@supabase/auth-js` `parseParametersFromURL` (search overrides hash).
 */
export function parseAuthCallbackParams(href: string): Record<string, string> {
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

/**
 * Parse OAuth/magic-link callback URL and return access_token and refresh_token (implicit flow).
 * Supabase may redirect with hash fragment: #access_token=...&refresh_token=...
 */
export function getSessionParamsFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  try {
    const params = parseAuthCallbackParams(url);
    const access_token = params.access_token;
    if (!access_token) return null;
    return { access_token, refresh_token: params.refresh_token ?? '' };
  } catch {
    return null;
  }
}

function isOurAuthCallbackPath(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('propfolio:')) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      const path = u.pathname.toLowerCase();
      if (host === 'auth' && path === '/callback') return true;
      if (path === '/auth/callback' || path.endsWith('/auth/callback')) return true;
      const bareSchemeCallback =
        host === '' &&
        (path === '' || path === '/') &&
        (u.hash.length > 1 || u.search.length > 1);
      if (bareSchemeCallback) return true;
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
 * Whether the URL carries OAuth / magic-link / recovery result material we should handle.
 * PKCE returns `code=`; implicit returns `access_token=`; provider errors return `error=`.
 */
export function hasAuthCallbackPayload(url: string): boolean {
  const params = parseAuthCallbackParams(url);
  return Boolean(
    params.code ||
      params.access_token ||
      params.error ||
      params.error_code ||
      params.error_description
  );
}

/**
 * Whether the URL is our auth callback (so we handle it and ignore unrelated deep links).
 * Requires auth path + code/token/error material so arbitrary URLs do not trigger session handling.
 */
export function isAuthCallbackUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;
  if (!hasAuthCallbackPayload(url)) return false;
  return isOurAuthCallbackPath(url);
}

export function getAuthCallbackPath(): string {
  return AUTH_CALLBACK_PATH;
}
