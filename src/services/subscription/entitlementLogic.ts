import { RC_ENTITLEMENT_PRO } from '@/services/revenuecat/productIds';
import type { CustomerInfoSummary } from '@/services/revenuecat/types';

/**
 * RevenueCat / StoreKit view of membership: active `propfolio_pro` only.
 * For **app navigation** access, use `computeAppAccess` (server + store); for named helpers see
 * `membershipCreditRules.hasPropfolioProEntitlement` / `hasActiveMembership(hasAppAccess)`.
 * Mis-attached consumables must not appear here as Pro.
 */
export function hasPremiumAccess(summary: CustomerInfoSummary): boolean {
  return summary.activeEntitlements.includes(RC_ENTITLEMENT_PRO);
}

export function subscriptionTierLabel(summary: CustomerInfoSummary): string {
  if (hasPremiumAccess(summary)) {
    return 'PropFolio member';
  }
  if (summary.status === 'billing_issue') {
    return 'Billing issue';
  }
  if (summary.status === 'not_subscribed') {
    return 'Not subscribed';
  }
  if (summary.status === 'unknown') {
    return 'Could not verify with App Store';
  }
  return 'Not subscribed';
}

export function subscriptionStatusDetail(summary: CustomerInfoSummary): string {
  switch (summary.status) {
    case 'active':
      if (summary.subscriptionPeriodType === 'TRIAL') {
        return 'Free first month active — full access. Then $1.99/month through Apple unless you cancel.';
      }
      if (summary.subscriptionPeriodType === 'INTRO') {
        return 'Intro pricing active — full access. Then $1.99/month through Apple unless you cancel.';
      }
      return 'Membership active — $1.99/month after your free first month (per Apple).';
    case 'grace_period':
      return 'Grace period — complete payment in the App Store to keep access.';
    case 'billing_issue':
      return 'Update your payment method in the App Store to restore access.';
    case 'not_subscribed':
      return 'Subscribe for membership ($1.99/mo after a free first month). Credits are separate.';
    case 'unknown':
      return (
        summary.lastStoreError?.trim() ??
        'Could not reach the App Store. Try Restore purchases or check your connection.'
      );
    default:
      return '';
  }
}
