/**
 * RevenueCat → Supabase: subscription mirror, credits, audit trail.
 *
 * Auth: `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` (set in RevenueCat dashboard).
 * Mobile SDK must use Supabase `auth.users.id` as RevenueCat app user id.
 *
 * Idempotency:
 * - Audit: unique `idempotency_key` = `rc_webhook:v1:<event.id>` on `app_purchase_events`.
 * - Monthly credit: `grant_monthly_included_credit` uses `monthly_included:rc_event:<event.id>`.
 * - Consumable credit: `grant_purchased_credits` uses `consumable_grant:rc_event:<event.id>`.
 * Retries re-run side effects safely; duplicate audit insert is skipped after first success.
 */
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';
import { getServiceSupabase } from '../_shared/supabaseAdmin.ts';
import { isUuid } from '../_shared/validate.ts';

import { SUBSCRIPTION_PRODUCT_ID } from './constants.ts';
import {
  grantConsumableCreditsIfNeeded,
  grantMonthlyIncludedIfNeeded,
} from './grants.ts';
import { resolveSupabaseUserId } from './resolveUser.ts';
import {
  buildUserSubscriptionRow,
  isSubscriptionDrivingEvent,
  type UserSubscriptionRow,
} from './subscriptionMapper.ts';
import type { RcWebhookBody, RcWebhookEvent } from './types.ts';

function verifyAuth(req: Request): boolean {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
  if (!secret) {
    return false;
  }
  const auth = req.headers.get('Authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

function msToIso(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms)) {
    return null;
  }
  return new Date(ms).toISOString();
}

/** Legacy `subscription_status.status` for any code still reading the old table. */
function mapLegacyStatus(ev: RcWebhookEvent): string {
  const t = (ev.type ?? '').toUpperCase();
  if (t === 'EXPIRATION') {
    return 'not_subscribed';
  }
  if (t === 'CANCELLATION') {
    const exp = ev.expiration_at_ms;
    if (typeof exp === 'number' && exp > Date.now()) {
      return 'active';
    }
    return 'not_subscribed';
  }
  if (t === 'BILLING_ISSUE') {
    return 'billing_issue';
  }
  if (
    t === 'INITIAL_PURCHASE' ||
    t === 'RENEWAL' ||
    t === 'UNCANCELLATION' ||
    t === 'TEMPORARY_ENTITLEMENT_GRANT' ||
    t === 'SUBSCRIPTION_EXTENDED' ||
    t === 'REFUND_REVERSED'
  ) {
    return 'active';
  }
  if (t === 'NON_RENEWING_PURCHASE') {
    return 'active';
  }
  if (t === 'TRANSFER' || t === 'PRODUCT_CHANGE') {
    return 'active';
  }
  if (t === 'TEST') {
    return 'unknown';
  }
  return 'unknown';
}

async function ensurePurchaseEventRow(
  admin: ReturnType<typeof getServiceSupabase>,
  args: {
    idempotencyKey: string;
    userId: string;
    ev: RcWebhookEvent;
    rawBody: Record<string, unknown>;
  },
): Promise<{ purchaseEventId: string; auditInsertSkipped: boolean }> {
  const { data: existing } = await admin
    .from('app_purchase_events')
    .select('id')
    .eq('idempotency_key', args.idempotencyKey)
    .maybeSingle();

  if (existing?.id) {
    return { purchaseEventId: existing.id as string, auditInsertSkipped: true };
  }

  const { data: inserted, error } = await admin
    .from('app_purchase_events')
    .insert({
      user_id: args.userId,
      event_type: args.ev.type ?? 'UNKNOWN',
      product_id: args.ev.product_id ?? null,
      transaction_id: args.ev.transaction_id ?? null,
      original_transaction_id: args.ev.original_transaction_id ?? null,
      app_user_id: args.ev.app_user_id ?? args.ev.original_app_user_id ?? null,
      idempotency_key: args.idempotencyKey,
      raw_payload: args.rawBody,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: again } = await admin
        .from('app_purchase_events')
        .select('id')
        .eq('idempotency_key', args.idempotencyKey)
        .single();
      if (again?.id) {
        return { purchaseEventId: again.id as string, auditInsertSkipped: true };
      }
    }
    throw new Error(error.message);
  }

  return { purchaseEventId: inserted!.id as string, auditInsertSkipped: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  if (!verifyAuth(req)) {
    logStructured(
      { scope: 'webhook', provider: 'revenuecat', step: 'auth', status: 'fail', message: 'invalid_webhook_auth' },
      'warn',
    );
    return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook authorization' } }, 401);
  }

  let body: RcWebhookBody;
  try {
    body = (await req.json()) as RcWebhookBody;
  } catch {
    return jsonResponse({ ok: false, error: { code: 'BAD_JSON', message: 'Invalid JSON' } }, 400);
  }

  const ev = body.event;
  if (!ev || typeof ev !== 'object') {
    return jsonResponse({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Missing event' } }, 400);
  }

  if (!ev.id || typeof ev.id !== 'string') {
    return jsonResponse(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Missing event id (required for idempotency)' } },
      400,
    );
  }

  const userId = resolveSupabaseUserId(ev);
  if (!userId) {
    logStructured(
      {
        scope: 'webhook',
        provider: 'revenuecat',
        step: 'resolve_user',
        status: 'skip',
        message: 'no_uuid_app_user',
        extra: { eventId: ev.id, type: ev.type },
      },
      'warn',
    );
    return jsonResponse({ ok: true, accepted: false, reason: 'no_resolvable_supabase_user_id' });
  }

  if (!isUuid(userId)) {
    return jsonResponse({ ok: true, accepted: false, reason: 'invalid_user_id' });
  }

  const idempotencyKey = `rc_webhook:v1:${ev.id}`;
  const rawBody = body as unknown as Record<string, unknown>;
  const nowIso = new Date().toISOString();

  try {
    const admin = getServiceSupabase();

    const { purchaseEventId, auditInsertSkipped } = await ensurePurchaseEventRow(admin, {
      idempotencyKey,
      userId,
      ev,
      rawBody,
    });

    const monthlyResult = await grantMonthlyIncludedIfNeeded(admin, userId, ev);
    if (!monthlyResult.ok) {
      logStructured(
        {
          scope: 'webhook',
          provider: 'revenuecat',
          step: 'grant_monthly',
          status: 'fail',
          message: monthlyResult.detail,
          extra: { eventId: ev.id, userId: userId.slice(0, 8) },
        },
        'error',
      );
      return jsonResponse({ ok: false, error: { code: 'GRANT_MONTHLY_FAILED', message: monthlyResult.detail } }, 500);
    }

    const consumableResult = await grantConsumableCreditsIfNeeded(admin, userId, ev, purchaseEventId);
    if (!consumableResult.ok) {
      logStructured(
        {
          scope: 'webhook',
          provider: 'revenuecat',
          step: 'grant_consumable',
          status: 'fail',
          message: consumableResult.detail,
          extra: { eventId: ev.id, userId: userId.slice(0, 8) },
        },
        'error',
      );
      return jsonResponse(
        { ok: false, error: { code: 'GRANT_CONSUMABLE_FAILED', message: consumableResult.detail } },
        500,
      );
    }

    let subRow: UserSubscriptionRow | null = null;
    if (isSubscriptionDrivingEvent(ev)) {
      const { data: prev } = await admin
        .from('user_subscription_status')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      subRow = buildUserSubscriptionRow(userId, ev, prev as UserSubscriptionRow | null, nowIso);

      const { error: subErr } = await admin.from('user_subscription_status').upsert(subRow, { onConflict: 'user_id' });
      if (subErr) {
        logStructured(
          {
            scope: 'webhook',
            provider: 'revenuecat',
            step: 'user_subscription_status',
            status: 'fail',
            message: subErr.message,
            extra: { eventId: ev.id, userId: userId.slice(0, 8) },
          },
          'error',
        );
        return jsonResponse({ ok: false, error: { code: 'DB_ERROR', message: 'Subscription upsert failed' } }, 500);
      }
    } else {
      const { data: touched, error: touchErr } = await admin
        .from('user_subscription_status')
        .update({
          last_webhook_event_at: nowIso,
          updated_at: nowIso,
        })
        .eq('user_id', userId)
        .select('user_id');

      if (touchErr) {
        logStructured(
          {
            scope: 'webhook',
            provider: 'revenuecat',
            step: 'user_subscription_touch',
            status: 'warn',
            message: touchErr.message,
            extra: { eventId: ev.id, userId: userId.slice(0, 8) },
          },
          'warn',
        );
      } else if (!touched?.length) {
        const { error: insErr } = await admin.from('user_subscription_status').insert({
          user_id: userId,
          entitlement_source: 'revenuecat',
          last_webhook_event_at: nowIso,
        });
        if (insErr) {
          logStructured(
            {
              scope: 'webhook',
              provider: 'revenuecat',
              step: 'user_subscription_seed',
              status: 'warn',
              message: insErr.message,
              extra: { eventId: ev.id, userId: userId.slice(0, 8) },
            },
            'warn',
          );
        }
      }
    }

    const legacyStatus = mapLegacyStatus(ev);
    const { error: legErr } = await admin.from('subscription_status').upsert(
      {
        user_id: userId,
        revenuecat_app_user_id: (ev.original_app_user_id ?? ev.app_user_id ?? userId) as string,
        status: legacyStatus,
        entitlements: (Array.isArray(ev.entitlement_ids) ? ev.entitlement_ids : []) as unknown as string[],
        expires_at: msToIso(ev.expiration_at_ms),
        last_event: ev as unknown as Record<string, unknown>,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    );

    if (legErr) {
      logStructured(
        {
          scope: 'webhook',
          provider: 'revenuecat',
          step: 'subscription_status_legacy',
          status: 'warn',
          message: legErr.message,
          extra: { eventId: ev.id },
        },
        'warn',
      );
    }

    logStructured({
      scope: 'webhook',
      provider: 'revenuecat',
      step: 'complete',
      status: 'ok',
      message: ev.type ?? 'UNKNOWN',
      extra: {
        eventId: ev.id,
        userPrefix: userId.slice(0, 8),
        auditInsertSkipped,
        monthly: monthlyResult.detail,
        consumable: consumableResult.detail,
        subscriptionProduct: ev.product_id === SUBSCRIPTION_PRODUCT_ID,
        entitlementActive: subRow?.entitlement_active,
      },
    });

    return jsonResponse({
      ok: true,
      accepted: true,
      duplicate_audit: auditInsertSkipped,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'SERVER_MISCONFIGURED') {
      return jsonResponse({ ok: false, error: { code: 'SERVER_MISCONFIGURED', message: 'Missing service role' } }, 500);
    }
    logStructured(
      {
        scope: 'webhook',
        provider: 'revenuecat',
        step: 'fatal',
        status: 'fail',
        message: msg,
        extra: { eventId: ev.id },
      },
      'error',
    );
    return jsonResponse({ ok: false, error: { code: 'INTERNAL', message: 'Webhook error' } }, 500);
  }
});
