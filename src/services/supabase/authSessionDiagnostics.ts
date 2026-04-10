import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthSessionSnapshot = {
  userId: string | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  expiresAt: number | null;
  getSessionError: string | null;
};

/**
 * Dev-only: safe session shape for debugging (never logs tokens).
 */
export async function readAuthSessionSnapshot(client: SupabaseClient): Promise<AuthSessionSnapshot> {
  const { data, error } = await client.auth.getSession();
  const session = data.session;
  return {
    userId: session?.user?.id ?? null,
    hasAccessToken: Boolean(session?.access_token),
    hasRefreshToken: Boolean(session?.refresh_token),
    expiresAt: typeof session?.expires_at === 'number' ? session.expires_at : null,
    getSessionError: error?.message ?? null,
  };
}

/**
 * Dev-only console logging for auth/session investigations (import screen, bootstrap).
 */
export function logAuthSessionSnapshot(client: SupabaseClient, context: string): void {
  if (!__DEV__) {
    return;
  }
  void readAuthSessionSnapshot(client)
    .then((snap) => {
      console.log(`[PropFolio auth] ${context}`, snap);
    })
    .catch((e: unknown) => {
      console.warn(`[PropFolio auth] ${context} snapshot failed`, e);
    });
}
