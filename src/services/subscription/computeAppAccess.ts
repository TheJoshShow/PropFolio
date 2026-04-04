import type { CustomerInfoSummary } from '@/services/revenuecat/types';

import { hasPremiumAccess } from './entitlementLogic';
import type { UserSubscriptionStatusRow } from './serverSubscriptionTypes';

/**
 * UI / analytics state for subscription. `loading` is used before the first access hydration completes.
 */
export type AppAccessDisplayState =
  | 'loading'
  | 'unknown'
  | 'active_trial'
  | 'active_paid'
  | 'grace_period'
  | 'billing_issue'
  | 'expired';

export type AppAccessComputed = {
  hasAppAccess: boolean;
  displayState: AppAccessDisplayState;
};

function serverTrialLooksActive(row: UserSubscriptionStatusRow | null): boolean {
  if (!row?.trial_end_at) {
    return false;
  }
  const end = new Date(row.trial_end_at);
  return !Number.isNaN(end.getTime()) && end > new Date() && Boolean(row.trial_start_at);
}

/**
 * Production access rule:
 * - Prefer `user_subscription_status.entitlement_active` from Supabase (webhook mirror).
 * - If there is no server row yet (e.g. purchase before first webhook), allow when the store
 *   (RevenueCat) shows an active Pro entitlement so the user is not locked out briefly.
 * - Import credits never unlock the app without an active subscription (handled separately).
 */
export function computeAppAccess(params: {
  accessHydrated: boolean;
  serverRow: UserSubscriptionStatusRow | null;
  storeSummary: CustomerInfoSummary;
  serverFetchFailed: boolean;
}): AppAccessComputed {
  if (!params.accessHydrated) {
    return { hasAppAccess: false, displayState: 'loading' };
  }

  const serverActive = params.serverRow?.entitlement_active === true;
  const hasServerRow = params.serverRow != null;
  const storeActive = hasPremiumAccess(params.storeSummary);

  const hasAppAccess = serverActive || (!hasServerRow && storeActive);

  if (hasAppAccess) {
    if (params.storeSummary.status === 'grace_period') {
      return { hasAppAccess: true, displayState: 'grace_period' };
    }
    if (params.storeSummary.subscriptionPeriodType === 'TRIAL') {
      return { hasAppAccess: true, displayState: 'active_trial' };
    }
    if (serverTrialLooksActive(params.serverRow)) {
      return { hasAppAccess: true, displayState: 'active_trial' };
    }
    return { hasAppAccess: true, displayState: 'active_paid' };
  }

  if (
    params.serverRow &&
    params.serverRow.billing_issue_detected &&
    !params.serverRow.entitlement_active
  ) {
    return { hasAppAccess: false, displayState: 'billing_issue' };
  }

  if (params.serverFetchFailed && params.storeSummary.status === 'unknown') {
    return { hasAppAccess: false, displayState: 'unknown' };
  }

  if (params.storeSummary.status === 'unknown') {
    return { hasAppAccess: false, displayState: 'unknown' };
  }

  if (hasServerRow && !serverActive) {
    return { hasAppAccess: false, displayState: 'expired' };
  }

  return { hasAppAccess: false, displayState: 'expired' };
}
