import { RC_ENTITLEMENT_PRO, SUBSCRIPTION_PRODUCT_ID } from './constants.ts';
import type { RcWebhookEvent } from './types.ts';

export type UserSubscriptionRow = {
  user_id: string;
  entitlement_active: boolean;
  entitlement_source: string;
  product_id: string | null;
  original_purchase_date: string | null;
  latest_purchase_date: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start_at: string | null;
  trial_end_at: string | null;
  will_renew: boolean | null;
  billing_issue_detected: boolean;
  expires_at: string | null;
  last_webhook_event_at: string;
};

function msToIso(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms)) {
    return null;
  }
  return new Date(ms).toISOString();
}

function hasProEntitlement(ev: RcWebhookEvent): boolean {
  const ids = ev.entitlement_ids;
  if (!Array.isArray(ids)) {
    return false;
  }
  return ids.includes(RC_ENTITLEMENT_PRO);
}

function isSubscriptionProduct(productId: string | null | undefined): boolean {
  if (!productId) {
    return false;
  }
  return productId === SUBSCRIPTION_PRODUCT_ID;
}

/** Event types that drive full subscription mirror fields (not consumable-only). */
export function isSubscriptionDrivingEvent(ev: RcWebhookEvent): boolean {
  const t = (ev.type ?? '').toUpperCase();
  const set = new Set([
    'INITIAL_PURCHASE',
    'RENEWAL',
    'CANCELLATION',
    'UNCANCELLATION',
    'EXPIRATION',
    'BILLING_ISSUE',
    'PRODUCT_CHANGE',
    'SUBSCRIPTION_EXTENDED',
    'SUBSCRIPTION_PAUSED',
    'TEMPORARY_ENTITLEMENT_GRANT',
    'TRANSFER',
    'TEST',
    'REFUND_REVERSED',
  ]);
  if (set.has(t)) {
    return true;
  }
  if (t === 'NON_RENEWING_PURCHASE') {
    return isSubscriptionProduct(ev.product_id);
  }
  return false;
}

/**
 * Compute `user_subscription_status` row from webhook event + optional previous row (fills gaps when RC omits fields).
 */
export function buildUserSubscriptionRow(
  userId: string,
  ev: RcWebhookEvent,
  prev: Partial<UserSubscriptionRow> | null,
  nowIso: string,
): UserSubscriptionRow {
  const now = Date.now();
  const t = (ev.type ?? '').toUpperCase();
  const periodType = ev.period_type ?? null;
  const expMs = typeof ev.expiration_at_ms === 'number' ? ev.expiration_at_ms : null;
  const purchasedMs = typeof ev.purchased_at_ms === 'number' ? ev.purchased_at_ms : null;

  const stillInPeriod = expMs != null && expMs > now;

  let entitlementActive = false;
  if (t === 'EXPIRATION') {
    entitlementActive = false;
  } else if (t === 'BILLING_ISSUE') {
    const grace = typeof ev.grace_period_expiration_at_ms === 'number'
      ? ev.grace_period_expiration_at_ms
      : null;
    if (grace != null && grace > now) {
      entitlementActive = hasProEntitlement(ev) || prev?.entitlement_active === true;
    } else if (stillInPeriod) {
      entitlementActive = hasProEntitlement(ev) || prev?.entitlement_active === true;
    }
  } else if (t === 'TEMPORARY_ENTITLEMENT_GRANT') {
    entitlementActive = stillInPeriod && (hasProEntitlement(ev) || prev?.entitlement_active === true);
  } else if (stillInPeriod) {
    // RevenueCat sometimes omits `entitlement_ids` on retries; keep prior access until expiration.
    entitlementActive = hasProEntitlement(ev) || prev?.entitlement_active === true;
  } else if (t === 'TEST') {
    entitlementActive = prev?.entitlement_active ?? false;
  }

  /** Free trial only (`TRIAL`). Intro pricing (`INTRO`) is tracked via store subscription, not these columns. */
  let trialStart: string | null = null;
  let trialEnd: string | null = null;
  if (periodType === 'TRIAL' && purchasedMs != null && expMs != null) {
    trialStart = msToIso(purchasedMs);
    trialEnd = msToIso(expMs);
  } else {
    trialStart = null;
    trialEnd = null;
  }

  let willRenew: boolean | null = prev?.will_renew ?? null;
  if (t === 'CANCELLATION') {
    willRenew = false;
  } else if (t === 'EXPIRATION') {
    willRenew = false;
  } else if (t === 'UNCANCELLATION' || t === 'INITIAL_PURCHASE' || t === 'RENEWAL') {
    willRenew = true;
  } else if (t === 'BILLING_ISSUE') {
    willRenew = prev?.will_renew ?? null;
  }

  let billingIssue = prev?.billing_issue_detected ?? false;
  if (t === 'BILLING_ISSUE') {
    billingIssue = true;
  } else if (t === 'RENEWAL' || t === 'INITIAL_PURCHASE' || t === 'UNCANCELLATION') {
    billingIssue = false;
  } else if (t === 'EXPIRATION' && ev.expiration_reason === 'BILLING_ERROR') {
    billingIssue = true;
  }

  const productId =
    typeof ev.new_product_id === 'string' && ev.new_product_id.length > 0 && t === 'PRODUCT_CHANGE'
      ? ev.new_product_id
      : typeof ev.product_id === 'string'
      ? ev.product_id
      : prev?.product_id ?? null;

  const originalPurchase =
    msToIso(purchasedMs) ?? prev?.original_purchase_date ?? null;
  const latestPurchase = msToIso(purchasedMs) ?? prev?.latest_purchase_date ?? null;

  return {
    user_id: userId,
    entitlement_active: entitlementActive,
    entitlement_source: 'revenuecat',
    product_id: productId,
    original_purchase_date: t === 'INITIAL_PURCHASE' || t === 'TRANSFER'
      ? originalPurchase
      : prev?.original_purchase_date ?? originalPurchase,
    latest_purchase_date: latestPurchase,
    current_period_start: msToIso(purchasedMs) ?? prev?.current_period_start ?? null,
    current_period_end: msToIso(expMs) ?? prev?.current_period_end ?? null,
    trial_start_at: trialStart,
    trial_end_at: trialEnd,
    will_renew: willRenew,
    billing_issue_detected: billingIssue,
    expires_at: msToIso(expMs) ?? prev?.expires_at ?? null,
    last_webhook_event_at: nowIso,
  };
}

export { hasProEntitlement, isSubscriptionProduct };
