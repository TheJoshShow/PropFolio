/**
 * Store + RevenueCat identifiers (no env imports — safe for Vitest and pure logic).
 */

/** RevenueCat entitlement — attach your subscription product to this in the dashboard. */
export const RC_ENTITLEMENT_PRO = 'propfolio_pro';

/**
 * App Store Connect product IDs the app expects (create in ASC and map in RevenueCat).
 */
export const STORE_PRODUCT_IDS = {
  subscriptionMonthly: 'com.propfolio.subscription.monthly',
  credits1: 'com.propfolio.credits.1',
  credits5: 'com.propfolio.credits.5',
  credits10: 'com.propfolio.credits.10',
  credits20: 'com.propfolio.credits.20',
} as const;

export const CREDIT_PACK_PRODUCT_ORDER: string[] = [
  STORE_PRODUCT_IDS.credits1,
  STORE_PRODUCT_IDS.credits5,
  STORE_PRODUCT_IDS.credits10,
  STORE_PRODUCT_IDS.credits20,
];

export const CREDITS_PER_STORE_PRODUCT: Record<string, number> = {
  [STORE_PRODUCT_IDS.credits1]: 1,
  [STORE_PRODUCT_IDS.credits5]: 5,
  [STORE_PRODUCT_IDS.credits10]: 10,
  [STORE_PRODUCT_IDS.credits20]: 20,
};
