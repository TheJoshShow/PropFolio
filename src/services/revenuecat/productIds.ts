/**
 * Single source of truth: App Store product IDs, RevenueCat entitlement id, default offering ids.
 *
 * Naming convention (dashboards should match this file, not the other way around):
 * - App Store / StoreKit product IDs: `com.propfolio.<role>.<sku>` (reverse-DNS under the app family).
 * - RevenueCat **Offering** identifiers (custom): `propfolio_<purpose>` (e.g. `propfolio_subscription`).
 * - RevenueCat **Entitlement** identifier: `propfolio_pro` (exact string; unlocks membership in app code).
 * - RevenueCat **Package** identifiers: not hardcoded — use RC defaults (`$rc_monthly`, custom, etc.); the app keys off **store product id**.
 *
 * Mirror subscription + consumable maps in `supabase/functions/revenuecat-webhook/constants.ts` for webhooks.
 *
 * In-app purchases do not run in Expo Go — use an iOS development build or TestFlight.
 *
 * -----------------------------------------------------------------------------
 * Dashboard ↔ code mapping (verify in App Store Connect + RevenueCat)
 * -----------------------------------------------------------------------------
 *
 * | App role              | App Store Connect product id           | RevenueCat usage |
 * |-----------------------|----------------------------------------|-------------------|
 * | Membership (monthly)  | com.propfolio.subscription.monthly     | Attach to a package on the subscription offering; link to entitlement `propfolio_pro`. |
 * | Credits pack (1)      | com.propfolio.credits.1                | Consumable on credits offering. |
 * | Credits pack (5)      | com.propfolio.credits.5                | Consumable on credits offering. |
 * | Credits pack (10)     | com.propfolio.credits.10               | Consumable on credits offering. |
 * | Credits pack (20)     | com.propfolio.credits.20               | Consumable on credits offering. |
 *
 * RevenueCat **Offering** identifiers expected by default (override via env):
 * - `propfolio_subscription` — should include the monthly membership package(s).
 * - `propfolio_credits` — should include the four consumable credit SKUs (any subset still loads; missing SKUs show disabled in UI).
 *
 * RevenueCat **package** identifiers (e.g. `$rc_monthly`) are not hardcoded; the app matches
 * purchases by **Store product id** (`product.identifier`) and entitlement id `propfolio_pro`.
 */

/** RevenueCat entitlement — attach the *monthly subscription* product only (not consumable credits). */
export const RC_ENTITLEMENT_PRO = 'propfolio_pro';

/** Default RevenueCat Offering identifier for membership (override with EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID). */
export const RC_DEFAULT_SUBSCRIPTION_OFFERING_ID = 'propfolio_subscription';

/** Default RevenueCat Offering identifier for credit packs (override with EXPO_PUBLIC_RC_CREDITS_OFFERING_ID). */
export const RC_DEFAULT_CREDITS_OFFERING_ID = 'propfolio_credits';

/**
 * App Store Connect product IDs the app expects (create in ASC, then attach to RevenueCat offerings).
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

/**
 * When RevenueCat / App Store returns a product id that does not exactly match `CREDITS_PER_STORE_PRODUCT`,
 * infer pack size from common patterns (e.g. `…credits.5`, `…credits_10`).
 */
export function inferCreditPackSizeFromProductId(storeProductId: string): number | null {
  const t = storeProductId.trim();
  if (CREDITS_PER_STORE_PRODUCT[t] != null) {
    return CREDITS_PER_STORE_PRODUCT[t];
  }
  const m = t.match(/credits[._-](\d+)(?:\D|$)/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n === 1 || n === 5 || n === 10 || n === 20) {
      return n;
    }
  }
  return null;
}

/** All store product IDs (membership + credits) for docs / diagnostics. */
export const ALL_STORE_PRODUCT_IDS: string[] = [
  STORE_PRODUCT_IDS.subscriptionMonthly,
  ...CREDIT_PACK_PRODUCT_ORDER,
];
