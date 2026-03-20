/**
 * Supabase Edge Function: RevenueCat webhook handler.
 * Verifies webhook auth, handles subscription events, upserts subscription_status.
 * Requires: REVENUECAT_WEBHOOK_AUTHORIZATION, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Event types we handle for subscription status sync
const SUBSCRIPTION_EVENT_TYPES = new Set([
  "TEST",
  "INITIAL_PURCHASE",
  "RENEWAL",
  "CANCELLATION",
  "UNCANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "PRODUCT_CHANGE",
  "TRANSFER",
  "SUBSCRIPTION_EXTENDED",
  "TEMPORARY_ENTITLEMENT_GRANT",
]);

// Pro entitlement ID (must match app)
// Keep aligned with `expo-app/src/config/billing.ts` → ENTITLEMENT_PRO_ACCESS ("pro_access")
const PRO_ENTITLEMENT_ID = "pro_access";

type WebhookPayload = {
  type?: string;
  app_user_id?: string;
  transferred_to?: string[];
  product_id?: string;
  store?: string;
  expiration_at_ms?: number | null;
  entitlement_ids?: string[] | null;
  event_timestamp_ms?: number;
  [key: string]: unknown;
};

function getUserId(payload: WebhookPayload): string | null {
  const id = payload.app_user_id ?? (Array.isArray(payload.transferred_to) ? payload.transferred_to[0] : null);
  return typeof id === "string" && id.length > 0 ? id : null;
}

function isProEntitlement(payload: WebhookPayload): boolean {
  const ids = payload.entitlement_ids;
  if (Array.isArray(ids)) return ids.includes(PRO_ENTITLEMENT_ID);
  return false;
}

/** True if event indicates active entitlement (user has or will have access until expires_at). */
function isActiveEvent(type: string, payload: WebhookPayload): boolean {
  const nowMs = Date.now();
  const expMs = payload.expiration_at_ms;

  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "SUBSCRIPTION_EXTENDED":
    case "TEMPORARY_ENTITLEMENT_GRANT":
    case "TRANSFER":
      return expMs == null || expMs > nowMs;
    case "BILLING_ISSUE":
      return expMs == null || expMs > nowMs;
    case "CANCELLATION":
      return expMs != null && expMs > nowMs;
    case "EXPIRATION":
      return false;
    case "TEST":
      return expMs == null || expMs > nowMs;
    default:
      return false;
  }
}

function msToIso(ms: number | null | undefined): string | null {
  if (ms == null || typeof ms !== "number") return null;
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("authorization");
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION");
  if (secret && secret.length > 0) {
    const expected = `Bearer ${secret}`;
    if (authHeader !== expected) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const eventType = typeof payload.type === "string" ? payload.type : "";
  if (!SUBSCRIPTION_EVENT_TYPES.has(eventType)) {
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "Event type not handled" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = getUserId(payload);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Missing app_user_id or transferred_to" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return new Response(
      JSON.stringify({ error: "Invalid app_user_id format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const nowIso = new Date().toISOString();
  const entitlementActive = isProEntitlement(payload) && isActiveEvent(eventType, payload);
  const productId = typeof payload.product_id === "string" ? payload.product_id : null;
  const store = typeof payload.store === "string" ? payload.store : null;
  const expiresAt = msToIso(payload.expiration_at_ms);

  const row = {
    user_id: userId,
    entitlement_active: entitlementActive,
    product_id: productId,
    store,
    expires_at: expiresAt,
    last_synced_at: nowIso,
    updated_at: nowIso,
  };

  const { error } = await supabase.from("subscription_status").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: "Database update failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      event_type: eventType,
      user_id: userId,
      entitlement_active: entitlementActive,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
