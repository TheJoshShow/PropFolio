export type RevenueCatOfferingId = string;

export type SubscriptionStatus =
  | 'unknown'
  | 'not_subscribed'
  | 'active'
  | 'grace_period'
  | 'billing_issue';

export type CustomerInfoSummary = {
  status: SubscriptionStatus;
  /** Entitlement identifiers currently active in RevenueCat (e.g. `propfolio_pro`). */
  activeEntitlements: string[];
  /** App Store / Play subscription management deep link when available. */
  managementURL?: string | null;
  /** Store product that unlocked `propfolio_pro`, when known. */
  premiumProductIdentifier?: string | null;
  /** From RevenueCat subscription info: TRIAL, INTRO, NORMAL, PREPAID. */
  subscriptionPeriodType?: string | null;
  /** Last SDK / network message when status is unknown. */
  lastStoreError?: string | null;
};

/** One row on the paywall — `refKey` is stable until the next catalog load. */
export type PaywallPackageOption = {
  refKey: string;
  offeringIdentifier: string;
  packageIdentifier: string;
  storeProductId: string;
  title: string;
  description: string;
  priceString: string;
  packageType: string;
  /** When this product is a known credit pack, number of import credits (informational; server grants via webhook). */
  creditsQuantity: number | null;
};

export type PaywallCatalog = {
  sdkConfigured: boolean;
  sdkMessage: string | null;
  subscriptionOfferingId: string;
  subscriptionPackages: PaywallPackageOption[];
  creditsOfferingId: string;
  creditPackages: PaywallPackageOption[];
};
