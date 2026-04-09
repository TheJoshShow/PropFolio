import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Purchases from 'react-native-purchases';

import { CREDIT_PACK_PRODUCT_ORDER, STORE_PRODUCT_IDS } from './productIds';

const MONTHLY_STORE_ID = STORE_PRODUCT_IDS.subscriptionMonthly;
const CREDIT_STORE_IDS = new Set(CREDIT_PACK_PRODUCT_ORDER);

function storeProductId(pkg: PurchasesPackage): string {
  return pkg.product.identifier;
}

function offeringHasExpectedMonthly(offering: PurchasesOffering): boolean {
  const pkgs = offering.availablePackages ?? [];
  return pkgs.some(
    (p) =>
      storeProductId(p) === MONTHLY_STORE_ID ||
      String(p.packageType) === String(Purchases.PACKAGE_TYPE.MONTHLY),
  );
}

function offeringHasCreditPack(offering: PurchasesOffering): boolean {
  const pkgs = offering.availablePackages ?? [];
  return pkgs.some((p) => CREDIT_STORE_IDS.has(storeProductId(p)));
}

export type SubscriptionOfferingPickReason =
  | 'configured_subscription_offering_id'
  | 'current_matches_subscription_id'
  | 'scanned_monthly_store_product'
  | 'not_found';

export type CreditsOfferingPickReason =
  | 'configured_credits_offering_id'
  | 'current_matches_credits_id'
  | 'scanned_credit_store_product'
  | 'not_found';

/**
 * Resolves the subscription/membership offering without blindly using `offerings.current`
 * (which may point at the credits offering or another product).
 */
export function pickSubscriptionOffering(
  offerings: { all: Record<string, PurchasesOffering>; current: PurchasesOffering | null },
  configuredSubscriptionOfferingId: string,
): { offering: PurchasesOffering | null; reason: SubscriptionOfferingPickReason } {
  const { all, current } = offerings;
  const byId = all[configuredSubscriptionOfferingId];
  if (byId) {
    return { offering: byId, reason: 'configured_subscription_offering_id' };
  }
  if (current?.identifier === configuredSubscriptionOfferingId) {
    return { offering: current, reason: 'current_matches_subscription_id' };
  }
  const sortedKeys = Object.keys(all).sort();
  for (const key of sortedKeys) {
    const o = all[key];
    if (offeringHasExpectedMonthly(o)) {
      return { offering: o, reason: 'scanned_monthly_store_product' };
    }
  }
  return { offering: null, reason: 'not_found' };
}

/**
 * Resolves the credits packs offering the same way — id first, then scan by known consumable SKUs.
 */
export function pickCreditsOffering(
  offerings: { all: Record<string, PurchasesOffering>; current: PurchasesOffering | null },
  configuredCreditsOfferingId: string,
): { offering: PurchasesOffering | null; reason: CreditsOfferingPickReason } {
  const { all, current } = offerings;
  const byId = all[configuredCreditsOfferingId];
  if (byId) {
    return { offering: byId, reason: 'configured_credits_offering_id' };
  }
  if (current?.identifier === configuredCreditsOfferingId) {
    return { offering: current, reason: 'current_matches_credits_id' };
  }
  const sortedKeys = Object.keys(all).sort();
  for (const key of sortedKeys) {
    const o = all[key];
    if (offeringHasCreditPack(o)) {
      return { offering: o, reason: 'scanned_credit_store_product' };
    }
  }
  return { offering: null, reason: 'not_found' };
}
