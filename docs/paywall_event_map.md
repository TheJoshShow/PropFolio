# PropFolio Paywall Event Map

**Purpose:** Canonical mapping of subscription/paywall events to analytics. All events are defined in `analytics.ts` and fired from paywall flow or SubscriptionContext.  
**Last updated:** 2025-03-12.

---

## 1. Event list and when they fire

| Event | When | Where fired | Metadata (allowed) |
|-------|------|-------------|---------------------|
| **paywall_viewed** | Paywall screen mounts (user sees paywall). | paywall.tsx `useEffect` on mount. | — |
| **paywall_plan_selected** | User taps a plan (Subscribe button) before the purchase sheet. | paywall.tsx `handlePurchase` before calling `state.handlePurchase(plan)`. | planId |
| **purchase_started** | Right after plan selected; purchase flow has started. | paywall.tsx `handlePurchase` with metadata.packageIdentifier = plan.id. | packageIdentifier |
| **purchase_succeeded** | Purchase completed and entitlement verified (hasProAccess true). | paywall.tsx `onPurchaseSuccess` callback (from usePaywallState). | — |
| **purchase_cancelled** | User cancelled the Apple purchase sheet. | usePaywallState `handlePurchase` when result.cancelled. | planId, planType |
| **purchase_failed** | Purchase failed (error from RevenueCat/Store). | usePaywallState `handlePurchase` when result has error. | outcome (first 100 chars), planType |
| **restore_started** | User tapped Restore purchases; restore flow started. | usePaywallState `handleRestore` at start. | — |
| **restore_succeeded** | Restore completed and user has Pro (hasProAccess true). | usePaywallState `handleRestore` when getRestoreOutcome(result).status === 'success'. | — |
| **restore_failed** | Restore completed but no Pro, or API error, or offline. | usePaywallState `handleRestore` when outcome.status !== 'success'. | — |
| **manage_subscription_tapped** | User tapped Manage subscription (Settings or Paywall when already Pro). | Settings handleManageSubscription; paywall when hasProAccess. | — |

---

## 2. Funnel order (typical)

1. paywall_viewed  
2. paywall_plan_selected (if user taps a plan)  
3. purchase_started  
4. One of: purchase_succeeded | purchase_cancelled | purchase_failed  

Or for restore:

1. paywall_viewed (or user in Settings)  
2. restore_started  
3. restore_succeeded or restore_failed (outcome includes no_purchases / failed / offline)

---

## 3. Implementation notes

- **Metadata:** Only non-PII keys (planId, packageIdentifier, outcome). Never user id, email, or tokens (see analytics.ts SAFE_METADATA_KEYS).
- **purchase_failed:** Pass a short outcome code or message substring for debugging; avoid full error strings that might contain sensitive data.
- **restore_failed:** Fired for both "no purchases found" and actual failure; use restore outcome status in backend if you need to distinguish.

All events are sent to Supabase `usage_events` when user is authenticated; in __DEV__ a sanitized one-line log is emitted.
