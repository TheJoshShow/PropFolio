import type { CustomerInfoSummary } from '@/services/revenuecat/types';

import { hasPremiumAccess } from './entitlementLogic';
import type { UserSubscriptionStatusRow } from './serverSubscriptionTypes';

/**
 * UI / analytics state for subscription. `loading` is used before the first access hydration completes.
 */
export type AppAccessDisplayState =
  | 'loading'
  | 'unknown'
  /** RevenueCat / StoreKit cannot run (Expo Go, wrong API key, missing appl_ key, etc.). */
  | 'rc_misconfigured'
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
 * Production access rule (membership unlocks the app — **not** import credits):
 * - Access when **either** Supabase `user_subscription_status.entitlement_active` **or** RevenueCat shows
 *   active `propfolio_pro`, so a new purchase unlocks the app before the webhook writes the server row.
 * - Exception: server `billing_issue_detected` + inactive entitlement locks the app first.
 * - Wallet / `current_balance` is intentionally ignored here; see `membershipCreditRules.ts` and `useImportGate`.
 */
export function computeAppAccess(params: {
  accessHydrated: boolean;
  serverRow: UserSubscriptionStatusRow | null;
  storeSummary: CustomerInfoSummary;
  serverFetchFailed: boolean;
  /** From `getRevenueCatEnvironmentBlockReason()` — SDK cannot be used in this binary/environment. */
  revenueCatEnvironmentBlock: string | null;
}): AppAccessComputed {
  if (!params.accessHydrated) {
    return { hasAppAccess: false, displayState: 'loading' };
  }

  /** Server-reported billing problem: lock the app even if the store SDK still shows an entitlement briefly. */
  if (
    params.serverRow &&
    params.serverRow.billing_issue_detected &&
    !params.serverRow.entitlement_active
  ) {
    return { hasAppAccess: false, displayState: 'billing_issue' };
  }

  const serverActive = params.serverRow?.entitlement_active === true;
  const hasServerRow = params.serverRow != null;
  const storeActive = hasPremiumAccess(params.storeSummary);

  /**
   * Membership access: server mirror OR RevenueCat `propfolio_pro` (whichever is true).
   * Lets new purchases unlock the app before the first webhook updates `user_subscription_status`.
   */
  const hasAppAccess = serverActive || storeActive;

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

  if (params.revenueCatEnvironmentBlock) {
    return { hasAppAccess: false, displayState: 'rc_misconfigured' };
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
