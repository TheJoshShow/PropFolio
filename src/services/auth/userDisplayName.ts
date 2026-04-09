import type { User } from '@supabase/supabase-js';

import type { ProfileRow } from './types';

function trimNonEmpty(v: unknown): string | null {
  if (typeof v !== 'string') {
    return null;
  }
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * Human-facing name for Settings / profile UI. Does not use the email local-part as a stand-in for a name.
 */
export function resolveUserFullNameForDisplay(profile: ProfileRow | null, user: User | null): string {
  const fromProfile = trimNonEmpty(profile?.full_name);
  if (fromProfile) {
    return fromProfile;
  }

  const meta = user?.user_metadata ?? {};
  const fromMeta =
    trimNonEmpty(meta.full_name) ||
    trimNonEmpty(meta.name) ||
    trimNonEmpty(meta.display_name);
  if (fromMeta) {
    return fromMeta;
  }

  return 'Account';
}
