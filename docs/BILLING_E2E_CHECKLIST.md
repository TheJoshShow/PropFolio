# PropFolio billing & credits — implementation checklist (E2E)

This document is the **handoff** for subscription + credit wallet behavior: product rules, code map, environment, and manual store setup. Use with `docs/QA_SUBSCRIPTION_CREDITS_TEST_PLAN.md` for execution scenarios.

## A. Product rules (approved)

| Rule | Implementation |
|------|----------------|
| Monthly subscription **$1.99/mo** | Paywall / billing copy (`billingCopy.ts`); ASC/RevenueCat product pricing (manual). |
| **First month free** (intro) | App Store Connect intro offer + RevenueCat; webhook mirrors periods/trial fields. |
| **Signup: 3 credits** (2 bonus + 1 cycle-one monthly) | `grant_signup_credits` in migration `005`; `handle_new_user` trigger + `ensure_signup_credits_self` (`007`). |
| **1 credit per import** | `consume_import_credit` RPC; `import-property` Edge Function after successful property save. |
| Top-ups: **1 / 5 / 10 / 20** credits at **$1.99 / $8.99 / $14.99 / $19.99** | `CONSUMABLE_CREDITS` in `revenuecat-webhook/constants.ts` + client product IDs; copy in `billingCopy.ts`. |
| **App access** requires active membership after trial | `computeAppAccess` + main layout gate; **import** additionally enforced in DB when `user_subscription_status` exists (`008`). |
| **Server-backed** wallet & entitlement | Supabase tables + RPCs; RevenueCat webhook → `user_subscription_status` + grants. |

## B. Code map (primary files)

| Area | Path |
|------|------|
| Migrations | `supabase/migrations/005_subscription_credit_system.sql`, `007_ensure_signup_credits_self_rpc.sql`, `008_consume_import_subscription_gate.sql` |
| Webhook | `supabase/functions/revenuecat-webhook/` (`index.ts`, `grants.ts`, `constants.ts`, `subscriptionMapper.ts`) |
| Import + credits | `supabase/functions/import-property/index.ts`, `credits.ts` |
| Client wallet RPC | `src/services/credits/creditWalletService.ts` |
| Access / subscription UI | `src/features/subscription/*`, `src/services/subscription/*` |
| Billing UI & copy | `src/features/billing/*`, `app/(main)/paywall.tsx`, `credit-top-up.tsx` |
| Import UX | `src/features/import/ImportPropertyScreen.tsx`, `src/services/property-import/types.ts` |
| RevenueCat config (client) | `src/config/env.ts`, app config / EAS extras |

## C. Environment variables

### Expo / EAS (client-safe)

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` (and Android if shipped)
- `EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID` (default `propfolio_subscription`)
- `EXPO_PUBLIC_RC_CREDITS_OFFERING_ID` (default `propfolio_credits`)

### Supabase Edge Function **secrets** (Dashboard or `supabase secrets set`)

- `SUPABASE_SERVICE_ROLE_KEY` — `revenuecat-webhook` (and any admin paths)
- `REVENUECAT_WEBHOOK_SECRET` — must match RevenueCat webhook `Authorization: Bearer …`
- `RENTCAST_API_KEY` — `import-property`
- `GOOGLE_MAPS_API_KEY` — Places / geocoding functions
- Optional: `OPENAI_API_KEY`, `OPENAI_SUMMARY_MODEL` — summaries

See `.env.example` for comments.

## D. RevenueCat & App Store Connect (manual)

1. **App Store Connect**  
   - Auto-renewable subscription: product id aligned with `SUBSCRIPTION_PRODUCT_ID` (e.g. `com.propfolio.subscription.monthly`).  
   - **Introductory offer**: free first month.  
   - **Consumable** IAPs: `com.propfolio.credits.1`, `.5`, `.10`, `.20` (must match `constants.ts` + app product registry).

2. **RevenueCat**  
   - Entitlement id: **`propfolio_pro`** (`RC_ENTITLEMENT_PRO`).  
   - Attach monthly product to that entitlement.  
   - Offerings: ids matching `EXPO_PUBLIC_RC_*` env keys.  
   - **Webhook**: URL → deployed `revenuecat-webhook`; **Bearer** = `REVENUECAT_WEBHOOK_SECRET`.  
   - **App user ID** = Supabase `auth.users.id` (UUID).

3. **Supabase**  
   - Apply migrations through `008` on production.  
   - Deploy `import-property`, `revenuecat-webhook`, and related functions.

## E. Tests & QA

- Automated: `src/services/subscription/computeAppAccess.test.ts`, `entitlementLogic.test.ts` — run `npx vitest run`.  
- Manual / release: `docs/QA_SUBSCRIPTION_CREDITS_TEST_PLAN.md`.  
- Release gate: `docs/RELEASE_READINESS.md`.

## F. Known gaps / blockers (need your input)

1. **Real store products** — final bundle id, exact SKU strings, and pricing in ASC must match code constants before production.  
2. **Webhook latency** — If `user_subscription_status` has **no row**, import is allowed when credits exist (trial may only exist in RevenueCat briefly). Tightening this would require server-side RevenueCat REST verification on each import (not implemented).  
3. **Legacy `usage_limits`** — Still created for new users (`handle_new_user`) for backward compatibility; **import enforcement** is credit wallet + membership, not `increment_property_import_usage`.

---

## Deliverables summary (for release notes)

**A. Summary** — End-to-end billing uses Supabase wallet + ledger, RevenueCat webhook for subscription mirror and renewal/consumable grants, client access gating, and import consumption with membership check when subscription row exists (`008`).

**B. Files touched in the membership gate pass** — `008_consume_import_subscription_gate.sql`, `import-property/index.ts`, `import-property/credits.ts`, `types.ts` (property-import), `ImportPropertyScreen.tsx`, `creditWalletService.ts` (type comment), `QA_SUBSCRIPTION_CREDITS_TEST_PLAN.md`, `RELEASE_READINESS.md`, this doc.

**C. New files** — `supabase/migrations/008_consume_import_subscription_gate.sql`, `docs/BILLING_E2E_CHECKLIST.md`.

**D. Env vars** — See section C above.

**E. Manual ASC / RC** — See section D.

**F. Blockers** — See section F.
