/**
 * Maps subscription/customer info to a UI-safe display model.
 * No raw RevenueCat objects are exposed; only plain strings and booleans for the UI.
 *
 * Edge-case behavior (centralized here so all screens stay consistent):
 * - Canceled but active until end of period: RevenueCat keeps isActive true until expirationDate;
 *   we show "Pro" and "Renews {date}" until then, then switch to "Free" and "Expired {date}".
 * - Expired: isActive becomes false; we show Free, Inactive, "Expired {date}". User is gated.
 * - Billing issue / grace / store uncertainty: we do not infer from client; we only show what
 *   RevenueCat returns. If we have no fresh data we use cached snapshot (see SubscriptionContext).
 * - Restored from another device: after restore, customerInfo is updated; we reflect it here.
 * - Delayed refresh: we never revoke based on loading state; we keep previous or cached display.
 */

import { PRO_ENTITLEMENT_ID } from './revenueCat';
import type { RevenueCatCustomerInfo } from './revenueCat';
import type { CachedSubscriptionSnapshot } from './subscriptionCache';

export interface SubscriptionStatusDisplay {
  /** e.g. "Free" or "Pro" */
  planName: string;
  /** True if user has active Pro entitlement */
  isPro: boolean;
  /** Same as isPro; "entitlement active" in UI */
  entitlementActive: boolean;
  /** Human-readable renewal or expiration when available; null otherwise */
  renewalOrExpirationLabel: string | null;
}

function formatExpirationForDisplay(isoDate: string | null | undefined): string | null {
  if (!isoDate || typeof isoDate !== 'string') return null;
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return null;
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return formatter.format(date);
  } catch {
    return null;
  }
}

/**
 * Build a UI-safe subscription status from customer info.
 * Use this in context or screens; do not pass RevenueCatCustomerInfo to UI components.
 * Premium is not removed until we have definitive inactive state (isActive false from server).
 */
export function getSubscriptionStatusDisplay(
  customerInfo: RevenueCatCustomerInfo | null
): SubscriptionStatusDisplay {
  if (!customerInfo?.entitlements?.active) {
    return {
      planName: 'Free',
      isPro: false,
      entitlementActive: false,
      renewalOrExpirationLabel: null,
    };
  }

  const pro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
  const isPro = !!pro?.isActive;
  const expirationDate = pro?.expirationDate;
  const formatted = formatExpirationForDisplay(expirationDate);
  const renewalOrExpirationLabel = formatted
    ? (isPro ? `Renews ${formatted}` : `Expired ${formatted}`)
    : null;

  return {
    planName: isPro ? 'Pro' : 'Free',
    isPro,
    entitlementActive: isPro,
    renewalOrExpirationLabel,
  };
}

/**
 * Build display status from a cached snapshot (e.g. offline or after failed refresh).
 * Used so we don't revoke Pro based on uncertain state.
 */
export function getSubscriptionStatusDisplayFromCache(
  cache: CachedSubscriptionSnapshot | null
): SubscriptionStatusDisplay {
  if (!cache) {
    return {
      planName: 'Free',
      isPro: false,
      entitlementActive: false,
      renewalOrExpirationLabel: null,
    };
  }
  const formatted = formatExpirationForDisplay(cache.expirationDate);
  const renewalOrExpirationLabel = formatted
    ? (cache.hasProAccess ? `Renews ${formatted}` : `Expired ${formatted}`)
    : null;
  return {
    planName: cache.planName,
    isPro: cache.hasProAccess,
    entitlementActive: cache.hasProAccess,
    renewalOrExpirationLabel,
  };
}

/**
 * Build a cache snapshot from customer info for persistence (offline / error fallback).
 */
export function buildCacheSnapshotFromCustomerInfo(
  customerInfo: RevenueCatCustomerInfo | null
): CachedSubscriptionSnapshot | null {
  if (!customerInfo?.entitlements?.active) {
    return { hasProAccess: false, expirationDate: null, planName: 'Free' };
  }
  const pro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
  const isPro = !!pro?.isActive;
  const expirationDate =
    typeof pro?.expirationDate === 'string' ? pro.expirationDate : null;
  return {
    hasProAccess: isPro,
    expirationDate,
    planName: isPro ? 'Pro' : 'Free',
  };
}
