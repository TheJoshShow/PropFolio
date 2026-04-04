import { RC_ENTITLEMENT_PRO } from '@/services/revenuecat/productIds';
import type { CustomerInfoSummary } from '@/services/revenuecat/types';

/**
 * RevenueCat-shaped summary → premium access for store-side checks.
 */
export function hasPremiumAccess(summary: CustomerInfoSummary): boolean {
  if (summary.activeEntitlements.includes(RC_ENTITLEMENT_PRO)) {
    return true;
  }
  if (summary.status === 'grace_period') {
    return true;
  }
  if (summary.status === 'active' && summary.activeEntitlements.length > 0) {
    return true;
  }
  return false;
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
    return 'Status unavailable';
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
      return summary.lastStoreError?.trim()
        ? `Could not reach the App Store: ${summary.lastStoreError}`
        : 'Could not reach the App Store. Try Restore purchases.';
    default:
      return '';
  }
}
