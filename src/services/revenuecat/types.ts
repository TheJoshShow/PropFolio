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

/** Why the paywall catalog looks the way it does (for UI + __DEV__ messaging). */
export type PaywallCatalogLoadPhase =
  | 'ok'
  | 'expo_go_unsupported'
  | 'unsupported_platform'
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'sdk_init_failed'
  | 'offerings_fetch_failed'
  /** `getOfferings` succeeded but RevenueCat returned no offerings to inspect. */
  | 'rc_offerings_empty'
  | 'subscription_offering_missing'
  | 'subscription_packages_empty'
  /** Packages exist on the membership offering but none match the expected monthly App Store product id. */
  | 'subscription_product_mismatch';

export type PaywallCatalog = {
  sdkConfigured: boolean;
  /** @deprecated Prefer `loadPhase` + `loadMessage` for new UI. */
  sdkMessage: string | null;
  loadPhase: PaywallCatalogLoadPhase;
  /** User-safe explanation for the current catalog state. */
  loadMessage: string | null;
  /** Extra detail only in development builds. */
  devDetail?: string | null;
  revenueCatCurrentOfferingId: string | null;
  revenueCatAllOfferingIds: string[];
  subscriptionOfferingId: string;
  /** True when an offering object existed for the configured subscription offering id. */
  subscriptionOfferingFound: boolean;
  subscriptionPackages: PaywallPackageOption[];
  creditsOfferingId: string;
  creditsOfferingFound: boolean;
  creditPackages: PaywallPackageOption[];
};
