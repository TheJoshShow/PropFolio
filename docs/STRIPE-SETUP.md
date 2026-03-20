# PropFolio — Stripe setup (step-by-step)

Use this when you’re ready to add paid plans. Stripe handles payments and subscriptions; Supabase holds the source of truth for “does this user have Pro?” (e.g. `subscriptions` table).

---

## 1. Create a Stripe account

1. Go to **https://dashboard.stripe.com/register** and sign up (or log in).
2. Complete any verification. Use **Test mode** (toggle in dashboard) while building.

---

## 2. Get your API keys

1. In the Stripe Dashboard, open **Developers** → **API keys**.
2. You’ll see:
   - **Publishable key** (e.g. `pk_test_...`) — safe to use in the app for Stripe’s payment UI.  
     When you add a payment screen, set this in `expo-app/.env` as `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - **Secret key** (e.g. `sk_test_...`) — **never** put this in the client.  
     Store it only in **Supabase Edge Function Secrets** (Dashboard → your project → Edge Functions → Secrets) as `STRIPE_SECRET_KEY`.

---

## 3. Create a product and price (subscription)

1. Dashboard → **Product catalog** → **Add product**.
2. Name it (e.g. “PropFolio Pro”), add a description.
3. Under **Pricing**, add a **Recurring** price (e.g. monthly or yearly). Save.
4. Copy the **Price ID** (e.g. `price_1ABC...`). Your Edge Function will use this when creating a Checkout Session or Subscription.

---

## 4. Supabase: subscriptions table (if not exists)

Your app expects a place to store plan status. In Supabase SQL Editor, for example:

```sql
-- Example schema; adjust to your schema.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan text not null,
  status text not null,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);
```

Only your backend (Edge Function with service role) should insert/update rows; webhooks will do that.

---

## 5. Edge Function: create checkout or subscription

Create a Supabase Edge Function that:

- Accepts the authenticated user’s ID (from Supabase auth) and a **Price ID**.
- Uses the **Stripe SDK** with `STRIPE_SECRET_KEY` to:
  - Either create a **Checkout Session** (redirect or client completion) and return the session `url` or `id`, or
  - Create a **Customer** + **Subscription** and return a **client_secret** for the Payment Element.
- Returns the URL or client_secret to the app so the user can complete payment.

Example (pseudo): `Stripe.checkout.sessions.create({ customer_email, line_items: [{ price: priceId }], mode: 'subscription', success_url, cancel_url })`.  
Store `STRIPE_SECRET_KEY` in Edge Function secrets.

---

## 6. Webhook: keep Supabase in sync

1. In Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:** Your Supabase Edge Function URL that will receive webhooks (e.g. `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`).
3. **Events to send:** At least:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. After creating the endpoint, open it and reveal the **Signing secret** (`whsec_...`). Store it in Supabase Edge Function Secrets as `STRIPE_WEBHOOK_SECRET`.
5. In the Edge Function that handles the webhook:
   - Verify the signature using `STRIPE_WEBHOOK_SECRET` and the raw body.
   - For each event type, update `public.subscriptions` (insert or update row for the user, set `plan`, `status`, `stripe_subscription_id`, etc.).

Then the app can read the user’s plan from Supabase (e.g. “Pro”, “active”) and show paywalled features or a “Manage subscription” link.

---

## 7. Environment variables summary

| Variable | Where | When |
|----------|--------|------|
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `expo-app/.env` | When you add a payment screen in the app |
| `STRIPE_SECRET_KEY` | Supabase Edge Function Secrets only | Always, for server-side Stripe API calls |
| `STRIPE_WEBHOOK_SECRET` | Supabase Edge Function Secrets only | When you add the webhook endpoint |

Never commit real keys. Use test keys (`pk_test_`, `sk_test_`) until you go live; then switch to live keys and live webhooks.

---

## 8. App flow (high level)

1. User taps “Upgrade to Pro” (or similar).
2. App calls your Edge Function “create-checkout” with the chosen price ID.
3. Edge Function creates a Stripe Checkout Session (or Subscription) and returns URL or client_secret.
4. App opens the Checkout URL in a browser or uses Stripe’s React Native SDK with the client_secret to collect payment.
5. After payment, Stripe sends events to your webhook; your Edge Function updates `subscriptions` in Supabase.
6. App reads `subscriptions` (e.g. on Settings or via RLS) and shows “Pro” or “Manage subscription”.

For more detail and links, see **docs/SERVICES-INITIATION-GUIDE.md** §8 (Stripe).
