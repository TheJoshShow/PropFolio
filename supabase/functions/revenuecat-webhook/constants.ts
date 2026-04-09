/**
 * Keep byte-for-byte aligned with the client: `src/services/revenuecat/productIds.ts`
 * (`RC_ENTITLEMENT_PRO`, `STORE_PRODUCT_IDS`, `CREDITS_PER_STORE_PRODUCT`).
 */
/** Must match RevenueCat dashboard entitlement attached to the monthly product. */
export const RC_ENTITLEMENT_PRO = 'propfolio_pro';

/** Same as client `STORE_PRODUCT_IDS.subscriptionMonthly`. */
export const SUBSCRIPTION_PRODUCT_ID = 'com.propfolio.subscription.monthly';

/** Consumable credit packs → credits granted (same keys as client `CREDITS_PER_STORE_PRODUCT`). */
export const CONSUMABLE_CREDITS: Record<string, number> = {
  'com.propfolio.credits.1': 1,
  'com.propfolio.credits.5': 5,
  'com.propfolio.credits.10': 10,
  'com.propfolio.credits.20': 20,
};
