import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { CONSUMABLE_CREDITS, SUBSCRIPTION_PRODUCT_ID } from './constants.ts';
import { hasProEntitlement, isSubscriptionProduct } from './subscriptionMapper.ts';
import type { RcWebhookEvent } from './types.ts';

/**
 * Included monthly credit: grant on RENEWAL only (covers paid renewals and trial→paid conversion).
 * Skips INITIAL_PURCHASE — cycle-one monthly is handled by signup `grant_signup_credits`, not the webhook.
 */
export function shouldGrantMonthlyIncludedCredit(ev: RcWebhookEvent): boolean {
  const t = (ev.type ?? '').toUpperCase();
  if (t !== 'RENEWAL') {
    return false;
  }
  if (!isSubscriptionProduct(ev.product_id)) {
    return false;
  }
  return hasProEntitlement(ev);
}

export async function grantMonthlyIncludedIfNeeded(
  admin: SupabaseClient,
  userId: string,
  ev: RcWebhookEvent,
): Promise<{ ok: boolean; detail: string }> {
  if (!shouldGrantMonthlyIncludedCredit(ev)) {
    return { ok: true, detail: 'skip_monthly_not_applicable' };
  }

  const purchasedMs = ev.purchased_at_ms;
  const expMs = ev.expiration_at_ms;
  if (typeof purchasedMs !== 'number' || typeof expMs !== 'number') {
    return { ok: true, detail: 'skip_monthly_missing_period_ms' };
  }

  const periodStart = new Date(purchasedMs).toISOString();
  const periodEnd = new Date(expMs).toISOString();
  const idempotencyKey = `monthly_included:rc_event:${ev.id}`;

  const { data, error } = await admin.rpc('grant_monthly_included_credit', {
    p_user_id: userId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { ok: false, detail: error.message };
  }

  const row = data as { ok?: boolean; already_granted?: boolean } | null;
  if (row?.ok === false) {
    return { ok: false, detail: 'grant_monthly_rpc_rejected' };
  }

  return {
    ok: true,
    detail: row?.already_granted ? 'monthly_already_granted' : 'monthly_granted',
  };
}

export function consumableCreditsForProduct(productId: string | null | undefined): number | null {
  if (!productId) {
    return null;
  }
  const q = CONSUMABLE_CREDITS[productId];
  return typeof q === 'number' ? q : null;
}

export function shouldGrantConsumableCredits(ev: RcWebhookEvent): boolean {
  const t = (ev.type ?? '').toUpperCase();
  if (t !== 'NON_RENEWING_PURCHASE') {
    return false;
  }
  return consumableCreditsForProduct(ev.product_id) != null;
}

export async function grantConsumableCreditsIfNeeded(
  admin: SupabaseClient,
  userId: string,
  ev: RcWebhookEvent,
  purchaseEventId: string,
): Promise<{ ok: boolean; detail: string }> {
  if (!shouldGrantConsumableCredits(ev)) {
    return { ok: true, detail: 'skip_consumable_not_applicable' };
  }

  const qty = consumableCreditsForProduct(ev.product_id);
  if (qty == null || qty < 1) {
    return { ok: true, detail: 'skip_consumable_unknown_product' };
  }

  const idempotencyKey = `consumable_grant:rc_event:${ev.id}`;

  const { data, error } = await admin.rpc('grant_purchased_credits', {
    p_user_id: userId,
    p_quantity: qty,
    p_purchase_event_id: purchaseEventId,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { ok: false, detail: error.message };
  }

  const row = data as { ok?: boolean; already_granted?: boolean } | null;
  if (row?.ok === false) {
    return { ok: false, detail: 'grant_consumable_rpc_rejected' };
  }

  return {
    ok: true,
    detail: row?.already_granted ? 'consumable_already_granted' : 'consumable_granted',
  };
}
