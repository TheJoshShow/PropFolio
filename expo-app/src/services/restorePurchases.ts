/**
 * Centralized restore-purchases outcome mapping.
 * Use getRestoreOutcome() after calling SubscriptionContext.restore() to get
 * user-facing status and copy for success, no purchases, failed, and offline.
 */

import { hasProAccess } from './revenueCat';
import type { RestoreResult } from './revenueCat';

export type RestoreOutcomeStatus = 'success' | 'no_purchases' | 'failed' | 'offline';

export interface RestoreOutcome {
  status: RestoreOutcomeStatus;
  title: string;
  message: string;
}

/** Copy for restore outcome messaging. Override per screen if needed. */
export const RESTORE_OUTCOME_COPY = {
  success: {
    title: 'Purchases restored',
    message: 'Your subscription is restored. You now have Pro access.',
  },
  no_purchases: {
    title: 'No purchases found',
    message: 'No previous purchases were found for this account. If you subscribed on another device, make sure you’re signed in with the same account.',
  },
  failed: {
    title: 'Restore failed',
    message: 'Something went wrong. Please try again.',
  },
  offline: {
    title: 'Unable to restore',
    message: 'You appear to be offline. Check your connection and try again.',
  },
} as const;

const OFFLINE_INDICATORS = ['network', 'offline', 'connection', 'internet', 'unable to connect'];

function looksOffline(error: string): boolean {
  const lower = error.toLowerCase();
  return OFFLINE_INDICATORS.some((word) => lower.includes(word));
}

/**
 * Maps a RestoreResult from RevenueCat/SubscriptionContext to a user-facing outcome.
 * Use after restore(): getRestoreOutcome(result) then show outcome.title / outcome.message.
 * Success = restore succeeded and user has pro_access; no_purchases = succeeded but no active subscription.
 */
export function getRestoreOutcome(
  result: RestoreResult,
  copy: Partial<typeof RESTORE_OUTCOME_COPY> = {}
): RestoreOutcome {
  const c = { ...RESTORE_OUTCOME_COPY, ...copy };

  if (result.success && result.customerInfo) {
    if (hasProAccess(result.customerInfo)) {
      return { status: 'success', title: c.success.title, message: c.success.message };
    }
    return { status: 'no_purchases', title: c.no_purchases.title, message: c.no_purchases.message };
  }

  const error = (result as { error?: string }).error ?? '';
  if (looksOffline(error)) {
    return { status: 'offline', title: c.offline.title, message: c.offline.message };
  }
  return {
    status: 'failed',
    title: c.failed.title,
    message: error.trim() || c.failed.message,
  };
}
