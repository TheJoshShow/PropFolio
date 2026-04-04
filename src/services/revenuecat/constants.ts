import { env } from '@/config';

import {
  CREDIT_PACK_PRODUCT_ORDER,
  CREDITS_PER_STORE_PRODUCT,
  RC_ENTITLEMENT_PRO,
  STORE_PRODUCT_IDS,
} from './productIds';

export {
  CREDIT_PACK_PRODUCT_ORDER,
  CREDITS_PER_STORE_PRODUCT,
  RC_ENTITLEMENT_PRO,
  STORE_PRODUCT_IDS,
};

/**
 * RevenueCat Offering identifiers — create Offerings with these IDs (or override via env).
 */
export function getRcSubscriptionOfferingId(): string {
  return env.rcSubscriptionOfferingId;
}

export function getRcCreditsOfferingId(): string {
  return env.rcCreditsOfferingId;
}
