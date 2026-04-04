import type { SupabaseClient } from '@supabase/supabase-js';

import type { ProfileRow } from './types';

/**
 * Reads the app profile row (RLS: user can only read own row).
 * Returns null if the row is missing or the request fails (e.g. during email-pending before RLS allows).
 */
export async function fetchProfileByUserId(
  client: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    console.warn('[PropFolio] profiles fetch:', error.message);
    return null;
  }
  return data as ProfileRow | null;
}
