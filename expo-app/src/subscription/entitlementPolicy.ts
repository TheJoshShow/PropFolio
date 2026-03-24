/**
 * Single place for subscription entitlement policy used by gating UI.
 * `hasProAccess` / SDK details stay in SubscriptionContext + revenueCat; this module only
 * documents and combines flags for screens that must not mis-gate during RevenueCat bootstrap.
 */

/**
 * True while we have a signed-in user but no entitlement signal yet (no customerInfo and no cache).
 * Callers should treat this like "unknown" — avoid showing Pro-only paywalls or premium upsells until false.
 */
export function isEntitlementBootstrapPending(input: {
  sessionUserId: string | undefined;
  subscriptionLoading: boolean;
  customerInfoPresent: boolean;
  cachePresent: boolean;
}): boolean {
  if (!input.sessionUserId) return false;
  if (!input.subscriptionLoading) return false;
  return !input.customerInfoPresent && !input.cachePresent;
}
