import { isUuid } from '../_shared/validate.ts';

import type { RcWebhookEvent } from './types.ts';

function firstUuidIn(list: unknown): string | null {
  if (!Array.isArray(list)) {
    return null;
  }
  for (const x of list) {
    if (typeof x === 'string' && isUuid(x)) {
      return x;
    }
  }
  return null;
}

/**
 * Map RevenueCat identifiers to a Supabase auth user id (UUID).
 * TRANSFER events use `transferred_to`; otherwise prefer `app_user_id`, then `original_app_user_id`, then aliases.
 */
export function resolveSupabaseUserId(ev: RcWebhookEvent): string | null {
  const t = (ev.type ?? '').toUpperCase();

  if (t === 'TRANSFER') {
    return firstUuidIn(ev.transferred_to);
  }

  if (typeof ev.app_user_id === 'string' && isUuid(ev.app_user_id)) {
    return ev.app_user_id;
  }
  if (typeof ev.original_app_user_id === 'string' && isUuid(ev.original_app_user_id)) {
    return ev.original_app_user_id;
  }

  return firstUuidIn(ev.aliases);
}
