/**
 * Auth redirect URL for OAuth and magic link.
 * Must match URLs configured in Supabase Dashboard > Auth > URL configuration.
 */

import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

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
  return Linking.createURL(AUTH_CALLBACK_PATH);
}

/**
 * Parse OAuth/magic-link callback URL and return access_token and refresh_token.
 * Supabase redirects with hash fragment: #access_token=...&refresh_token=...
 */
export function getSessionParamsFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  try {
    const parsed = new URL(url);
    // Supabase typically returns tokens in the URL hash (#access_token=...&refresh_token=...),
    // but some providers/environments can return them in the query string.
    const hash = parsed.hash.replace(/^#/, '');
    const fromHash = (() => {
      if (!hash) return null;
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      if (!access_token) return null;
      return { access_token, refresh_token: params.get('refresh_token') ?? '' };
    })();

    if (fromHash) return fromHash;

    const access_token = parsed.searchParams.get('access_token');
    if (!access_token) return null;
    const refresh_token = parsed.searchParams.get('refresh_token') ?? '';
    return { access_token, refresh_token };
  } catch {
    return null;
  }
}

/**
 * Whether the URL is our auth callback (so we can ignore other deep links).
 */
export function isAuthCallbackUrl(url: string): boolean {
  return url.includes('access_token=') || url.includes('#access_token=');
}
