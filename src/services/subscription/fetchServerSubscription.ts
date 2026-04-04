import type { SupabaseClient } from '@supabase/supabase-js';

import type { UserSubscriptionStatusRow } from './serverSubscriptionTypes';

const SELECT_COLUMNS =
  'user_id, entitlement_active, entitlement_source, billing_issue_detected, product_id, trial_start_at, trial_end_at, current_period_end, expires_at, will_renew, updated_at';

export async function fetchUserSubscriptionStatus(
  client: SupabaseClient,
): Promise<{ row: UserSubscriptionStatusRow | null; error: Error | null }> {
  const { data, error } = await client.from('user_subscription_status').select(SELECT_COLUMNS).maybeSingle();

  if (error) {
    return { row: null, error: new Error(error.message) };
  }

  return { row: data as UserSubscriptionStatusRow | null, error: null };
}
