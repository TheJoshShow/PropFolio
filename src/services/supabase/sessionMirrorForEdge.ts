import type { Session } from '@supabase/supabase-js';

/**
 * In-memory copy of the access token for Edge Function calls.
 * `AuthProvider` already holds `session` in React state; reading it here avoids an extra
 * `getSession()` → AsyncStorage round-trip that can be slow or stall on some devices.
 */
let mirroredAccessToken: string | null = null;
let mirroredExpiresAt: number | null = null;

export function syncSessionMirrorFromSession(session: Session | null): void {
  if (!session?.access_token || !session.user?.id) {
    mirroredAccessToken = null;
    mirroredExpiresAt = null;
    return;
  }
  mirroredAccessToken = session.access_token;
  mirroredExpiresAt = typeof session.expires_at === 'number' ? session.expires_at : null;
}

/**
 * Returns a bearer-ready token if the mirror is present and not inside the refresh buffer.
 */
export function getMirroredAccessTokenIfFresh(nowSec: number, refreshBufferSec: number): string | null {
  if (!mirroredAccessToken || mirroredExpiresAt == null) {
    return null;
  }
  if (mirroredExpiresAt <= nowSec + refreshBufferSec) {
    return null;
  }
  return mirroredAccessToken;
}
