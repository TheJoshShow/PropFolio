# PropFolio — Subscription & credits E2E test plan

**Audience:** QA, release engineering, anyone validating billing before ship.  
**System:** iOS app → RevenueCat SDK → App Store → RevenueCat webhook → Supabase (`user_subscription_status`, `user_credit_wallet`, `user_credit_ledger`, `app_purchase_events`).  
**Product rules:** $1.99/mo after free first month · 3 credits at signup (2 bonus + 1 cycle-one) · +1 included credit per billing cycle while subscribed · top-ups 1/5/10/20 · 1 credit per successful import · **membership required** for app access · ledger + RPCs are server truth.

---

## How to read each scenario

| Column | Meaning |
|--------|--------|
| **Test scenario** | What you are proving |
| **Preconditions** | Accounts, builds, sandbox, data |
| **Steps** | What to do in order |
| **Expected result** | App + store behavior |
| **DB (expected changes)** | Tables/rows to check in Supabase (SQL or dashboard) |
| **Logs / events** | RevenueCat, Edge Function, app logs |

**Key tables (Supabase):**

- `auth.users` — signup; trigger seeds profile + signup credits  
- `public.user_subscription_status` — webhook mirror (`entitlement_active`, periods, trial fields)  
- `public.user_credit_wallet` — `current_balance`, counters  
- `public.user_credit_ledger` — append-only; `idempotency_key` unique  
- `public.app_purchase_events` — webhook audit; `idempotency_key` unique  

**Key RPCs (examples):** `get_user_credit_state`, `ensure_signup_credits_self`, `consume_import_credit` (membership gate when `user_subscription_status` exists), `grant_signup_credits` (trigger), `grant_monthly_included_credit` / `grant_purchased_credits` (service/webhook).

---

# 1. Manual test plan (happy paths)

### 1.1 New user signup → 3 credits, no membership yet

| Field | Content |
|--------|--------|
| **Test scenario** | Brand-new email signup receives exactly 3 credits once; app remains gated until membership active. |
| **Preconditions** | Clean Supabase project or new email; iOS sandbox build; RevenueCat + webhook configured. |
| **Steps** | 1) Create account in app. 2) Confirm email if required. 3) Sign in. 4) Observe gate screen vs portfolio based on membership. 5) Open Membership / wallet (from gate path or after subscribe). |
| **Expected result** | Wallet shows **3** available credits (after sync, not “…” forever). If no active membership: **access restricted**; credits visible where UI allows. |
| **DB** | `user_credit_wallet`: row exists; `current_balance` = 3; `signup_bonus_credits_granted` = 2; counters for monthly included reflect +1 for cycle-one. `user_credit_ledger`: rows with idempotency keys like `signup_bonus_grant:{user_id}`, `signup_monthly_included:{user_id}`. |
| **Logs / events** | No duplicate ledger keys on repeat signup attempts (same user). App: `ensure_signup_credits_self` RPC success (or silent warn if misconfigured). |

### 1.2 Start membership (free first month) → app unlocks

| Field | Content |
|--------|--------|
| **Test scenario** | User purchases monthly subscription; first period free per Apple; app gains access. |
| **Preconditions** | User from 1.1 signed in; sandbox subscription product with intro/free month configured in ASC + RevenueCat. |
| **Steps** | 1) From gate or paywall, start membership. 2) Complete sandbox purchase. 3) Wait for webhook (or pull refresh). 4) Open portfolio / import. |
| **Expected result** | Access granted; paywall shows membership active; renewal line reflects trial/intro end from server or store. |
| **DB** | `user_subscription_status`: `entitlement_active` = true; period/trial fields populated after webhook. Wallet balance **unchanged** by subscription alone (still 3 until cycle grants / imports). |
| **Logs / events** | RevenueCat: customer info updated. Webhook: `app_purchase_events` insert; `user_subscription_status` upsert. |

### 1.3 Successful import → balance −1

| Field | Content |
|--------|--------|
| **Test scenario** | One successful import consumes exactly 1 credit server-side. |
| **Preconditions** | Active membership; balance ≥ 1; valid listing or manual import path. |
| **Steps** | 1) Note balance *B*. 2) Complete one import to success. 3) Refresh wallet / reopen screen. |
| **Expected result** | Balance *B − 1*; property opens; no double charge on retry of same flow. |
| **DB** | New `user_credit_ledger` **consume** row; `user_credit_wallet.current_balance` decremented; `lifetime_credits_used` +1. |
| **Logs / events** | Server: `consume_import_credit` success; idempotent replay returns same outcome. |

### 1.4 Monthly included credit after renewal

| Field | Content |
|--------|--------|
| **Test scenario** | After a billing renewal (or sandbox accelerated renewal), user receives +1 included credit for that period. |
| **Preconditions** | Subscribed user; webhook grants monthly on **renewal** (not double-counting cycle-one already from signup). |
| **Steps** | 1) Advance sandbox subscription to renewal (or wait). 2) Confirm webhook fires. 3) Check wallet. |
| **Expected result** | Balance increases by 1 vs pre-renewal; UI “included credit this cycle” shows received when ledger matches `current_period_start`. |
| **DB** | New ledger `monthly_credit_grant` with idempotency unique per period; wallet +1. |
| **Logs / events** | Edge function: renewal event processed once; duplicate POST with same idempotency does not double-grant. |

### 1.5 Top-up consumable (e.g. 5 credits)

| Field | Content |
|--------|--------|
| **Test scenario** | Purchased pack adds credits after Apple confirms and webhook grants. |
| **Preconditions** | Active membership; consumable SKUs 1/5/10/20 in ASC + RevenueCat. |
| **Steps** | 1) Note balance. 2) Buy 5-credit pack. 3) Wait for processing / refresh. |
| **Expected result** | Balance +5; app does not unlock **without** membership (buy credits only while subscribed per product rules). |
| **DB** | `app_purchase_events` for consumable; ledger grant with purchase-linked idempotency; `purchased_credits_granted` counter updated. |
| **Logs / events** | RevenueCat non-renewing / consumable event; webhook grants idempotently. |

---

# 2. Edge case matrix

| # | Edge case | Preconditions | Steps | Expected | DB notes |
|---|-----------|---------------|-------|----------|----------|
| E1 | User signs up twice with same email | Existing user | Attempt duplicate signup | Appropriate auth error; **no** second signup grant | Ledger signup keys still single set per `user_id` |
| E2 | App killed during purchase | Mid sheet | Kill app; reopen; Restore | Store/RevenueCat reconciles; wallet/subscription consistent | No orphan double grant without new transaction |
| E3 | Webhook arrives before app refresh | Slow network | Purchase; don’t refresh | Next `refresh` shows correct state | Server already updated |
| E4 | App refresh before webhook | Fast UI | Purchase; immediate refresh | May show store-active + server lag; then converge | `user_subscription_status` may lag briefly; access rule uses store OR server per app logic |
| E5 | Server says expired, store says active | Forced desync (test env) | Compare access | App follows **policy** (server wins deny when row exists inactive) | Document actual product rule for this build |
| E6 | 0 credits, active membership | Balance 0 | Open import | Import disabled / empty state; **membership still active** | No consume row |
| E7 | Credits > 0, membership expired | Refund/lapse in sandbox | Sign in | Gated; credits still in wallet | `entitlement_active` false; balance unchanged |
| E8 | Grace period | Billing issue sandbox | Observe | Access per RC grace rules | `user_subscription_status` reflects grace if webhook sends it |
| E9 | Family sharing / transfer | If applicable | N/A or skip | Per Apple/RC product setup | Document if unsupported in MVP |

---

# 3. Webhook retry & idempotency tests

| Field | Content |
|--------|--------|
| **Test scenario** | Same webhook (or duplicate `idempotency_key`) does not double-insert grants or double-update subscription incorrectly. |
| **Preconditions** | Access to replay webhook OR proxy that sends duplicate payloads; Supabase logs. |
| **Steps** | 1) Capture one valid `INITIAL_PURCHASE` or `RENEWAL` payload. 2) POST to webhook URL twice with **identical** idempotency/body. 3) Query ledger and wallet. |
| **Expected result** | Second request: HTTP 200 or accepted; **no** second grant row with same `user_credit_ledger.idempotency_key`; wallet balance unchanged on duplicate. |
| **DB** | `app_purchase_events`: unique constraint on `idempotency_key` — second insert fails or is no-op per function logic; ledger stable. |
| **Logs / events** | Edge function logs show duplicate detected / skipped; no error storm. |

| Field | Content |
|--------|--------|
| **Test scenario** | Out-of-order events (e.g. renewal before prior ack) still converge. |
| **Preconditions** | Staging with test events. |
| **Steps** | Send events in wrong order (if RC allows simulation). |
| **Expected result** | Final `user_subscription_status` and balance match expected end state. |
| **DB** | Inspect `last_webhook_event_at`, period dates. |
| **Logs / events** | Mapper warnings if any. |

---

# 4. Restore purchase tests

| Field | Content |
|--------|--------|
| **Test scenario** | Restore syncs entitlements and refreshes server-facing state after reinstall or new device. |
| **Preconditions** | Sandbox user with prior purchase; app data cleared or fresh install. |
| **Steps** | 1) Sign in with same Apple ID / app user mapping. 2) Tap **Restore purchases**. 3) Wait; open portfolio. |
| **Expected result** | Membership restored; wallet matches server (not zeroed incorrectly). |
| **DB** | No duplicate grants solely from restore; `user_subscription_status` matches active entitlement. |
| **Logs / events** | RevenueCat `restorePurchases`; app calls `refresh` + credit snapshot. |

| Field | Content |
|--------|--------|
| **Test scenario** | Restore on account **without** purchases shows clear message. |
| **Preconditions** | New sandbox Apple ID never purchased. |
| **Steps** | Restore. |
| **Expected result** | No crash; message that nothing to restore; still gated if no sub. |
| **DB** | No erroneous grants. |

---

# 5. Sign out / sign in — account mapping

| Field | Content |
|--------|--------|
| **Test scenario** | RevenueCat `appUserId` matches Supabase user; wallet RPC uses same user. |
| **Preconditions** | Two test accounts A and B. |
| **Steps** | 1) Sign in as A; purchase; note RC anonymous vs identified if any. 2) Sign out. 3) Sign in as B. 4) Confirm B does not see A’s wallet. 5) Sign in as A again; wallet intact. |
| **Expected result** | Strict isolation; no cross-user credits. |
| **DB** | All rows keyed by `user_id` = A or B only. |
| **Logs / events** | `syncAppUserId` on auth change; no stale generation applying wrong user (refresh generation guard). |

---

# 6. Subscription expiry tests

| Field | Content |
|--------|--------|
| **Test scenario** | When subscription expires (sandbox lapse or `EXPIRATION` webhook), app gates; credits remain. |
| **Preconditions** | User with membership + credits. |
| **Steps** | 1) Let sandbox sub expire or trigger expiration event. 2) Relaunch app; refresh. |
| **Expected result** | Access restricted screen; copy explains membership vs credits; balance unchanged. |
| **DB** | `entitlement_active` false; wallet row still shows prior balance. |
| **Logs / events** | Webhook `EXPIRATION`; RC customer info `not_subscribed` or inactive. |

---

# 7. Trial / intro conversion tests

| Field | Content |
|--------|--------|
| **Test scenario** | Free first month converts to paid $1.99 without losing access mid-cycle if payment valid. |
| **Preconditions** | Intro configured; sandbox card that succeeds on renewal. |
| **Steps** | 1) Start sub at T0. 2) Advance time / wait for first renewal. 3) Observe access and UI renewal line. |
| **Expected result** | Continuous access; UI shows paid period; +1 monthly credit on renewal per policy. |
| **DB** | `trial_end_at` / period fields update; renewal ledger grant when webhook fires. |
| **Logs / events** | `RENEWAL` event; no duplicate cycle-one grant (signup already covered cycle one). |

| Field | Content |
|--------|--------|
| **Test scenario** | Intro ends; billing fails → grace or lapse per Apple. |
| **Preconditions** | Failing payment instrument in sandbox. |
| **Steps** | Force failed renewal. |
| **Expected result** | Grace or billing-issue UI; then gate if lapsed. |
| **DB** | `billing_issue_detected`, grace timestamps if applicable. |

---

# 7b. Membership required for import (server)

| Field | Content |
|--------|--------|
| **Test scenario** | User has credits but **no** active entitlement and trial ended; import must not consume a credit. |
| **Preconditions** | `user_subscription_status` row with `entitlement_active` = false, `trial_end_at` in the past; wallet balance ≥ 1. |
| **Steps** | Call `import-property` (or complete import in app if gate bypassed). |
| **Expected result** | `SUBSCRIPTION_REQUIRED` from Edge; no property persisted; no new ledger consume row; balance unchanged. |
| **DB** | Wallet balance unchanged; optional: no completed `property_imports` row for that attempt. |
| **Logs / events** | `consume_import_credit` returns `subscription_required` if RPC path hit; preflight may reject before RentCast. |

| Field | Content |
|--------|--------|
| **Test scenario** | No `user_subscription_status` row yet (webhook lag) but user has trial in RevenueCat only. |
| **Preconditions** | New subscriber; mirror row not written yet. |
| **Steps** | Import before webhook lands. |
| **Expected result** | Import allowed if balance ≥ 1 (optimistic server rule); after row exists and shows expired, imports block. |
| **DB** | Document as acceptable lag window; webhook should populate row quickly in production. |

---

# 8. Insufficient credits tests

| Field | Content |
|--------|--------|
| **Test scenario** | Import blocked at 0 credits; clear CTAs to buy packs / membership. |
| **Preconditions** | Active membership; balance 0. |
| **Steps** | 1) Open import. 2) Attempt listing/manual submit. |
| **Expected result** | Buttons disabled or error; empty-state card; no server consume. |
| **DB** | No new consume row; balance 0. |
| **Logs / events** | Client gate; optional server `INSUFFICIENT_CREDITS` if API reached. |

| Field | Content |
|--------|--------|
| **Test scenario** | Balance 1; import fails **after** credit reserved? (if applicable) or fails mid-flight. |
| **Preconditions** | Depends on implementation: consume before vs after import success. |
| **Steps** | Simulate server failure after consume (if any) — **must match product spec**: credit returned or not. |
| **Expected result** | **Documented** behavior: typically consume only on **successful** import. |
| **DB** | Ledger matches spec (no consume row on failed import if that’s the rule). |

---

# 9. Consumable purchase tests

| Field | Content |
|--------|--------|
| **Test scenario** | Each SKU 1, 5, 10, 20 credits grants correct delta. |
| **Preconditions** | Membership active. |
| **Steps** | Buy each SKU once; record balance delta. |
| **Expected result** | +1, +5, +10, +20 respectively. |
| **DB** | Ledger grants; `purchased_credits_granted` increases accordingly. |
| **Logs / events** | Distinct `idempotency_key` per transaction. |

| Field | Content |
|--------|--------|
| **Test scenario** | Consumable **without** membership (if store allows) does not unlock app. |
| **Preconditions** | Expired membership; credits 0 or low. |
| **Steps** | Attempt pack purchase per store rules. |
| **Expected result** | Either purchase disallowed in UI or credits accrue but app **still gated** until membership. |
| **DB** | If purchase allowed by Apple, wallet may increase; `entitlement_active` still false. |

---

# 10. Failed import + credit consumption consistency

| Field | Content |
|--------|--------|
| **Test scenario** | Failed import does **not** reduce balance (if design is consume-on-success only). |
| **Preconditions** | Balance N; force bad URL / server error. |
| **Steps** | 1) Trigger import that fails before success. 2) Check balance. |
| **Expected result** | Balance still N. |
| **DB** | No `import_credit_consumed` ledger for that attempt (or idempotent consume keyed to property/import id — verify schema). |

| Field | Content |
|--------|--------|
| **Test scenario** | Retry same import after transient failure. |
| **Preconditions** | Same listing. |
| **Steps** | Retry until success. |
| **Expected result** | Single credit consumed for one successful property creation; no double property. |
| **DB** | One consume row linked to property/import idempotency per RPC design. |

---

# 11. Offline / network interruption tests

| Field | Content |
|--------|--------|
| **Test scenario** | Airplane mode on cold start: no false “0 credits” forever; recovery on reconnect. |
| **Preconditions** | Signed in; known balance. |
| **Steps** | 1) Enable airplane mode. 2) Open wallet / import. 3) Reconnect; pull refresh. |
| **Expected result** | Loading or unknown state; after reconnect, correct balance; no spurious consume. |
| **DB** | Unchanged while offline. |
| **Logs / events** | RPC errors logged; user sees retry path. |

| Field | Content |
|--------|--------|
| **Test scenario** | Purchase completes on device; network drops before webhook. |
| **Preconditions** | Contrived or wait for webhook retry. |
| **Expected result** | Eventually consistent; RC/Apple retries webhook; DB catches up. |
| **DB** | May lag; eventual `app_purchase_events` + grants. |

---

# 12. Sandbox / TestFlight checklist

- [ ] **Build:** Not Expo Go; RevenueCat API keys for **sandbox**; bundle ID matches ASC.  
- [ ] **Products:** Monthly sub + 4 consumables created; prices match intended tiers; **intro/free month** on sub.  
- [ ] **RevenueCat:** Entitlement `propfolio_pro` attached; offerings wired; **same App User ID** as Supabase `user.id`.  
- [ ] **Webhook:** Secret verified; Supabase **service role** can write `user_subscription_status` + grants.  
- [ ] **Supabase:** Migrations applied (`user_credit_*`, RPCs, RLS select-own).  
- [ ] **TestFlight:** Internal tester installs build; repeat sections 1, 1.2, 1.3, 4, 6, 8 on device.  
- [ ] **Sandbox tester:** Sign out of production Apple ID if needed; use Sandbox Apple Account.  
- [ ] **Screenshots:** Paywall, wallet, gate, import zero-credits for App Review if required.  

---

# 13. Release-blocking bug checklist

Block release if any of these occur in **staging + sandbox** validation:

| # | Bug | Severity |
|---|-----|----------|
| R1 | Duplicate signup credits (balance > 3 without purchases) for new user | Blocker |
| R2 | Credit consumed on failed import | Blocker (unless explicitly specced otherwise) |
| R3 | Full app access **without** active membership when server says inactive | Blocker |
| R4 | User A sees user B’s wallet or subscription row | Blocker |
| R5 | Webhook duplicate delivers double monthly or double consumable grant | Blocker |
| R6 | Restore wipes credits or grants spurious credits | Blocker |
| R7 | Import allowed at balance 0 | Blocker |
| R8 | Balance stuck at “…” after 30s on good network with valid session | High |
| R9 | Paywall shows wrong recurring price vs ASC (not using live `priceString`) | High |
| R10 | Crash on Restore / purchase cancel | High |
| R11 | Legal copy contradicts actual billing (first month, $1.99, credits) | High (compliance) |

---

## Appendix — quick SQL spot-checks (examples)

Adjust table/column names to match your branch.

```sql
-- Wallet + ledger count for a user
select * from public.user_credit_wallet where user_id = '<uuid>';
select entry_reason, credit_delta, idempotency_key, created_at
from public.user_credit_ledger
where user_id = '<uuid>'
order by created_at desc
limit 20;

-- Subscription mirror
select entitlement_active, current_period_start, current_period_end, trial_end_at, billing_issue_detected
from public.user_subscription_status
where user_id = '<uuid>';

-- Recent purchase events
select event_type, product_id, idempotency_key, created_at
from public.app_purchase_events
where user_id = '<uuid>'
order by created_at desc
limit 20;
```

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-03 | Initial E2E plan aligned to PropFolio membership + credit architecture |
