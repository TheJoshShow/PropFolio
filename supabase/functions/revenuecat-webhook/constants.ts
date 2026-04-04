/** Must match RevenueCat dashboard entitlement attached to the monthly product. */
export const RC_ENTITLEMENT_PRO = 'propfolio_pro';

/** Monthly auto-renewable (App Store Connect). */
export const SUBSCRIPTION_PRODUCT_ID = 'com.propfolio.subscription.monthly';

/** Consumable credit packs → credits granted (must match client `productIds.ts`). */
export const CONSUMABLE_CREDITS: Record<string, number> = {
  'com.propfolio.credits.1': 1,
  'com.propfolio.credits.5': 5,
  'com.propfolio.credits.10': 10,
  'com.propfolio.credits.20': 20,
};
