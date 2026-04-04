# Billing & credits UI — implementation plan and copy deck

## Implementation plan

### Architecture

- **Single copy source:** `src/features/billing/billingCopy.ts` (`BILLING_COPY`) holds concise strings; reference SKUs ($1.99/mo, pack ladder) are editorial — checkout always uses **live App Store / RevenueCat** `priceString` and product metadata.
- **Wallet truth:** `SubscriptionContext` loads `get_user_credit_state` via `fetchCreditWalletSnapshot` (balance, wallet counters, subscription mirror) and derives **monthly included credit for current period** by matching `user_credit_ledger` (`monthly_credit_grant`) to `subscription.current_period_start`.
- **Screens:**
  - **Paywall** (`app/(main)/paywall.tsx`): membership positioning, compact wallet card, “How billing works,” subscribe CTA, **Buy credit packs** → modal, restore, legal links.
  - **Credit top-up** (`app/(main)/credit-top-up.tsx`): four SKUs with store titles/prices when available; reference price line for transparency; restore; pull-to-refresh.
  - **Account summary:** `CreditWalletSummaryCard` on paywall (compact, no wallet CTA) and Subscription settings (full card + **Buy credits**).
  - **Import:** `ImportCreditNotice` — loading, confirm line with current → after balance, or empty state with top-up + plans.

### Files created

| File | Role |
|------|------|
| `src/features/billing/billingCopy.ts` | Copy constants + reference SKU ladder |
| `src/features/billing/billingFormat.ts` | Trial / renewal date line from server JSON |
| `src/features/billing/CreditWalletSummaryCard.tsx` | Wallet + subscription + included-credit status |
| `src/features/billing/ImportCreditNotice.tsx` | Import pre-flight / zero-credit UI |
| `src/features/billing/index.ts` | Barrel exports |
| `app/(main)/credit-top-up.tsx` | Top-up modal screen |
| `docs/BILLING_UI_AND_COPY.md` | This document |

### Files updated

| File | Change |
|------|--------|
| `src/services/credits/creditWalletService.ts` | `fetchCreditWalletSnapshot`, `fetchMonthlyIncludedGrantStatus`, wallet type fields |
| `src/services/credits/index.ts` | Export new helpers/types |
| `src/features/subscription/SubscriptionContext.tsx` | `creditWalletState`, `monthlyIncludedGrantStatus`, `openCreditTopUp`, snapshot on refresh/purchase/restore |
| `app/(main)/paywall.tsx` | Redesigned layout, legal row, top-up CTA |
| `app/(main)/_layout.tsx` | `credit-top-up` modal route |
| `app/(main)/settings/subscription.tsx` | `CreditWalletSummaryCard`, billing model card, CTAs |
| `app/(main)/settings/index.tsx` | “Buy import credits” row when subscribed |
| `src/features/import/ImportPropertyScreen.tsx` | `ImportCreditNotice`, disable import when 0 credits |

---

## Copy deck (by surface)

### Paywall — hero

| Element | Copy |
|--------|------|
| Title | PropFolio membership |
| Subtitle | Subscription unlocks the full app. Import credits are separate—enforced on our servers after Apple confirms purchases. |

### Paywall — “How billing works” card

| Element | Copy |
|--------|------|
| Subscription | **Subscription:** First month free, then $1.99/month. When eligible, Apple’s introductory offer covers your first month. After that, you are billed monthly at the price shown in the App Store. |
| Credits | **Credits:** 3 credits when your account is created (2 welcome + 1 for your first billing cycle). 1 included credit each month while your subscription is active. |
| Top-up intro | Buy more anytime while subscribed. Prices below reflect our standard SKUs; Apple shows the exact price at purchase. |
| Pack ladder (reference) | Top-ups: 1 @ $1.99 · 5 @ $8.99 · 10 @ $14.99 · 20 @ $19.99 — charged at live App Store prices. |
| Price hint (subscription row) | Then billed monthly — see exact price in the App Store. |

### Paywall — import credits section

| Element | Copy |
|--------|------|
| Section title | Import credits |
| Body | Subscription unlocks the app; each import still consumes 1 credit from your server wallet. Buy packs when you need more — only while subscribed. |
| CTA | Buy credit packs |

### Paywall — value bullets

- Full confidence scoring & scenario modeling  
- 3 credits when your account is created (2 welcome + 1 for your first billing cycle).  
- 1 included credit each month while your subscription is active.  
- Deterministic numbers — never “AI guess” metrics  

### Paywall — footer

| Element | Copy |
|--------|------|
| Legal micro | Subscriptions auto-renew until cancelled in Settings. See Privacy Policy and Terms of Service. |
| Links | Privacy Policy · Terms of Service (open in-app browser) |
| Restore | Restore purchases |
| Store unknown | Store status unknown — pull to refresh or tap Restore after checking network and API keys. |

### Credit top-up screen

| Element | Copy |
|--------|------|
| Title | Top up credits |
| Subtitle | Buy more anytime while subscribed. Prices below reflect our standard SKUs; Apple shows the exact price at purchase. |
| Balance card label | Your balance |
| Balance value | `{n} available` or `…` while loading |
| Section | Choose a pack |
| Reference line | Reference pricing (US): 1 @ $1.99 · 5 @ $8.99 · 10 @ $14.99 · 20 @ $19.99. Apple may show tax or regional pricing at checkout. |
| Missing product | Connect this product in RevenueCat to purchase. |
| Buy | Buy |
| Restore | Restore purchases |

### Credit wallet card (settings / full)

| Element | Copy |
|--------|------|
| Title | Credit wallet |
| Balance label | Available credits |
| Section | Subscription access |
| Included (subscribed, granted) | Included credit this cycle: received |
| Included (subscribed, pending) | Included credit this cycle: pending (usually after renewal processes) |
| Included (subscribed, unknown) | Included credit this cycle: — |
| Not subscribed / inactive mirror | Included monthly credit applies while your subscription is active. |
| Lifetime (if &gt; 0) | Lifetime imports used: `{n}` |
| CTA (non-compact) | Buy credits |

### Settings — billing model card

| Element | Copy |
|--------|------|
| Title | Billing model |
| Body | $1.99/month after any eligible free month from Apple. Three credits at signup; one included credit each billing cycle while subscribed. Top-ups: 1 / 5 / 10 / 20 credits at the prices shown in the App Store. |
| Muted | Credits are enforced on the server. Subscription access and credits are separate — inactive subscription means no app access even if credits remain. |

### Import — sufficient credits

| Element | Copy |
|--------|------|
| Line 1 | This import uses 1 credit. |
| Line 2 | You have `{current}` now — `{after}` will remain after a successful import. |

### Import — loading

| Copy |
|------|
| Updating credit balance… |

### Import — zero credits

| Element | Copy |
|--------|------|
| Title | No credits left |
| Body | Your subscription stays active, but each import still needs a credit. Buy a top-up pack to keep importing. |
| Primary CTA | Buy credits |
| Secondary | View plans |

---

## States to support

- **Credits loading:** `…` on balances; import shows “Updating credit balance…”  
- **Network / RPC failure:** wallet snapshot partial; monthly included may show `—`; user can pull to refresh (paywall / top-up) or Refresh status (settings)  
- **Restore:** same as existing `restorePurchases` + server resync  
- **SDK not configured:** existing `sdkMessage` card on paywall and top-up  

No fabricated balances: only server `current_balance` and explicit loading placeholders.
