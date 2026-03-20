# revenuecat-webhook

Supabase Edge Function that receives RevenueCat webhook events and syncs subscription status into `public.subscription_status`.

## Required secrets

Set these in the Supabase Dashboard (Edge Functions → Secrets) or via CLI:

| Secret | Description |
|--------|-------------|
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | Optional. Value you configure in RevenueCat Dashboard → Project → Webhooks → Authorization header. If set, the function verifies `Authorization: Bearer <value>` and returns 401 when it does not match. If unset, no verification is performed (not recommended for production). |
| `SUPABASE_URL` | Automatically provided by Supabase at runtime. Do not override. |
| `SUPABASE_SERVICE_ROLE_KEY` | Automatically provided by Supabase at runtime. Do not override. |

## RevenueCat setup

1. In RevenueCat Dashboard → Project → Webhooks, add a webhook URL:
   - Production: `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
   - Or your custom domain if configured for Edge Functions.
2. Set the **Authorization** header to a secret value (e.g. a long random string). Set the same value as `REVENUECAT_WEBHOOK_AUTHORIZATION` in Supabase secrets.
3. Select the events you want to send (or leave default). The function handles: `TEST`, `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNCANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`, `PRODUCT_CHANGE`, `TRANSFER`, `SUBSCRIPTION_EXTENDED`, `TEMPORARY_ENTITLEMENT_GRANT`.

## Behavior

- **Verification:** If `REVENUECAT_WEBHOOK_AUTHORIZATION` is set, the request must include `Authorization: Bearer <secret>`.
- **Event handling:** Parses JSON body; ignores unknown event types with 200 and `skipped: true`. For subscription events, resolves `app_user_id` (or `transferred_to[0]` for `TRANSFER`), validates UUID, then upserts `subscription_status` with:
  - `user_id` = app_user_id
  - `entitlement_active` = true only when the event is for the `pro` entitlement and the subscription is still active (not expired)
  - `product_id`, `store`, `expires_at` from payload; `last_synced_at` = now
- **Responses:** 200 with `{ ok, event_type, user_id, entitlement_active }` on success; 400 for bad body/missing user id; 401 for auth failure; 500 for DB/server errors (no internal details in body).

## Local testing

1. **Install Supabase CLI** and log in: `supabase login`.
2. **Link the project** (if not already): `supabase link --project-ref <your-ref>`.
3. **Set the webhook secret** locally for serve:
   ```bash
   supabase secrets set REVENUECAT_WEBHOOK_AUTHORIZATION=your-secret-here
   ```
   Or for local only, create `supabase/.env.local` (do not commit) with:
   ```
   REVENUECAT_WEBHOOK_AUTHORIZATION=your-secret-here
   ```
4. **Serve the function locally:**
   ```bash
   supabase functions serve revenuecat-webhook
   ```
   Default URL: `http://localhost:54321/functions/v1/revenuecat-webhook`.
5. **Send a test POST** (e.g. RevenueCat test event or curl):
   ```bash
   curl -X POST http://localhost:54321/functions/v1/revenuecat-webhook \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-secret-here" \
     -d '{"type":"TEST","app_user_id":"<valid-uuid>","product_id":"com.propfolio.premium.monthly","store":"APP_STORE","expiration_at_ms":9999999999999,"entitlement_ids":["pro_access"]}'
   ```
   Use a real `profiles.id` (UUID) from your DB for `app_user_id` so the upsert succeeds.
6. **Verify:** Query `subscription_status` in the DB for that user_id; you should see the row with `entitlement_active = true`, `product_id`, `store`, `expires_at`, `last_synced_at` set.

## Deploy

```bash
supabase functions deploy revenuecat-webhook
```

Then set `REVENUECAT_WEBHOOK_AUTHORIZATION` in the Dashboard (Edge Functions → Secrets) and configure the webhook URL in RevenueCat.
