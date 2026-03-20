/**
 * Centralized analytics for auth, usage, and subscription funnel.
 * All event names and tracking go through this module so UI stays decoupled.
 *
 * - Events are sent to usage_events (Supabase) when user is authenticated.
 * - In __DEV__, a safe one-line log is emitted (event name + sanitized metadata only; no PII).
 * - Never log secrets, user id, email, or tokens.
 */

import { getSupabase } from './supabase';

/** Canonical funnel event names. Add new ones here to keep instrumentation consistent. */
export type AnalyticsEventType =
  | 'signup_started'
  | 'signup_completed'
  | 'login_completed'
  | 'import_started'
  | 'import_succeeded'
  | 'import_blocked_free_limit'
  | 'paywall_viewed'
  | 'paywall_plan_selected'
  | 'purchase_started'
  | 'purchase_succeeded'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'restore_started'
  | 'restore_succeeded'
  | 'restore_failed'
  | 'manage_subscription_tapped'
  | 'portfolio_list_viewed'
  | 'property_detail_viewed'
  | 'score_explanation_opened'
  | 'confidence_explanation_opened'
  | 'low_confidence_warning_shown'
  | 'premium_lock_viewed';

export interface TrackEventOptions {
  resourceType?: string;
  /** Only non-PII keys (e.g. source, planId, outcome). Never pass email, id, or tokens. */
  metadata?: Record<string, unknown>;
}

/** Keys allowed in dev logs; never log PII (email, id, token). */
const SAFE_METADATA_KEYS = new Set([
  'source',
  'planId',
  'packageIdentifier',
  'outcome',
  'resumed',
  'blocked',
  'planType',
  'section',
  'listCount',
  'confidenceBand',
]);

function sanitizeForLog(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (SAFE_METADATA_KEYS.has(k) && v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Log a funnel event. No-op if Supabase or session is missing.
 * In __DEV__, logs event name and sanitized metadata only (no PII).
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  options: TrackEventOptions = {}
): Promise<void> {
  if (__DEV__) {
    const safe = sanitizeForLog(options.metadata);
    const metaStr = Object.keys(safe).length ? ` ${JSON.stringify(safe)}` : '';
    console.log(`[Analytics] ${eventType}${metaStr}`);
  }

  const supabase = getSupabase();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return;

  try {
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: eventType,
      resource_type: options.resourceType ?? null,
      metadata: options.metadata ?? null,
    });
  } catch (e) {
    if (__DEV__) console.warn('[Analytics] trackEvent failed:', eventType, e);
  }
}
