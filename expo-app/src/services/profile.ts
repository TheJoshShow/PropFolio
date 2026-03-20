/**
 * Profile service: ensure a profiles row exists for the current user.
 * Called after signup and on session load so portfolios/subscriptions/usage_events FKs succeed.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePhoneNumber } from '../utils/phone';

export interface ProfileMetadata {
  first_name?: string | null;
  last_name?: string | null;
  /**
   * Canonical phone storage format in auth + profiles:
   * - E.164 with leading `+` (e.g. `+15555555555`)
   */
  phone_number?: string | null;
  [key: string]: unknown;
}

/**
 * Build display_name from user metadata (e.g. first_name + last_name).
 */
function displayNameFromMetadata(metadata: ProfileMetadata | null | undefined): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const first = typeof metadata.first_name === 'string' ? metadata.first_name.trim() : '';
  const last = typeof metadata.last_name === 'string' ? metadata.last_name.trim() : '';
  const combined = [first, last].filter(Boolean).join(' ');
  return combined.length > 0 ? combined : null;
}

/**
 * Create or update the profiles row for the given user id.
 * Idempotent: safe to call on every sign-in. Uses upsert so existing rows are updated (e.g. display_name).
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  userId: string,
  metadata?: ProfileMetadata | null
): Promise<{ error: Error | null }> {
  const display_name = displayNameFromMetadata(metadata ?? null);
  const phoneNormalized = normalizePhoneNumber(
    typeof metadata?.phone_number === 'string' ? metadata.phone_number : '',
    'US'
  );

  // Avoid overwriting existing profile fields when metadata omits them.
  const payload: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (display_name != null) payload.display_name = display_name;
  if (phoneNormalized != null) payload.phone_number = phoneNormalized;

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[Profile] ensureProfile failed:', error.message);
    }
    return { error };
  }
  return { error: null };
}

/**
 * Minimal idempotent profile row: only `id` + `updated_at`.
 * Use when full upsert fails (e.g. older DB without optional columns, or partial payload issues).
 */
export async function ensureProfileMinimal(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[Profile] ensureProfileMinimal failed:', error.message);
    }
    return { error };
  }
  return { error: null };
}

/**
 * Try full profile upsert (metadata-aware), then minimal row if the first attempt fails.
 */
export async function ensureProfileWithFallback(
  supabase: SupabaseClient,
  userId: string,
  metadata?: ProfileMetadata | null
): Promise<{ error: Error | null; usedMinimal: boolean }> {
  const full = await ensureProfile(supabase, userId, metadata ?? null);
  if (!full.error) return { error: null, usedMinimal: false };

  // Second attempt: `id` + `updated_at` only (handles older schemas / column drift).
  const min = await ensureProfileMinimal(supabase, userId);
  if (!min.error) return { error: null, usedMinimal: true };
  return { error: min.error, usedMinimal: true };
}
