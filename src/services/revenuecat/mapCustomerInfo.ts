import type { CustomerInfo } from 'react-native-purchases';

import { RC_ENTITLEMENT_PRO } from './productIds';
import type { CustomerInfoSummary, SubscriptionStatus } from './types';

function activeEntitlementKeys(info: CustomerInfo): string[] {
  return Object.keys(info.entitlements.active);
}

/**
 * Maps RevenueCat CustomerInfo into a small app-owned summary for gates and UI.
 */
export function mapCustomerInfo(info: CustomerInfo): CustomerInfoSummary {
  const active = info.entitlements.active;
  const keys = activeEntitlementKeys(info);
  const pro = active[RC_ENTITLEMENT_PRO];

  if (pro?.isActive) {
    const subInfo = info.subscriptionsByProductIdentifier[pro.productIdentifier];
    if (subInfo?.gracePeriodExpiresDate) {
      const graceEnd = new Date(subInfo.gracePeriodExpiresDate);
      if (!Number.isNaN(graceEnd.getTime()) && graceEnd > new Date()) {
        return {
          status: 'grace_period',
          activeEntitlements: keys,
          managementURL: info.managementURL,
          premiumProductIdentifier: pro.productIdentifier,
        };
      }
    }
    if (pro.billingIssueDetectedAt || subInfo?.billingIssuesDetectedAt) {
      return {
        status: 'billing_issue',
        activeEntitlements: keys,
        managementURL: info.managementURL,
        premiumProductIdentifier: pro.productIdentifier,
      };
    }
    return {
      status: 'active',
      activeEntitlements: keys,
      managementURL: info.managementURL,
      premiumProductIdentifier: pro.productIdentifier,
      /** Intro / trial is reflected in StoreKit; RC exposes period on subscription. */
      subscriptionPeriodType: subInfo?.periodType ?? null,
    };
  }

  if (keys.length > 0) {
    return {
      status: 'active',
      activeEntitlements: keys,
      managementURL: info.managementURL,
    };
  }

  return {
    status: 'not_subscribed',
    activeEntitlements: [],
    managementURL: info.managementURL,
  };
}

export function mapUnknownCustomerInfo(message?: string): CustomerInfoSummary {
  return {
    status: 'unknown',
    activeEntitlements: [],
    managementURL: null,
    lastStoreError: message,
  };
}

export function mapNotConfiguredSummary(): CustomerInfoSummary {
  return {
    status: 'unknown',
    activeEntitlements: [],
    managementURL: null,
    lastStoreError: 'App Store billing is not available on this platform or the SDK is not configured.',
  };
}
