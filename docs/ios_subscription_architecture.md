# PropFolio iOS Subscription Architecture

**Purpose:** Production-grade iOS subscription system using Apple In-App Purchase and RevenueCat. Free tier with limited usage; Premium (Pro) unlocks full analysis and unlimited property imports.  
**Last updated:** 2025-03-12.

---

## 1. Business model

| Tier | Usage | Gating |
|------|--------|--------|
| **Free** | 2 successful property imports; full app features for those 2. | Server-authoritative count via `property_imports`; trigger blocks 3rd import. |
| **Pro (Premium)** | Unlimited property imports; full analysis and scoring. | Entitlement `pro_access` from RevenueCat; server `subscription_status.entitlement_active` synced from client. |

Subscriptions are managed through Apple (StoreKit via RevenueCat). No in-app cancellation; user manages in Settings → Subscriptions.

---

## 2. High-level flow

```
User signs in (Supabase)
    → SubscriptionContext: configure RevenueCat with Supabase user ID
    → Load: getOfferings() + getCustomerInfo()
    → Hydrate from local cache first (offline-safe), then overwrite with fresh data
    → hasProAccess = customerInfo.entitlements.active[pro_access].isActive || cache.hasProAccess
    → Sync subscription_status.entitlement_active to Supabase for server gating

Import attempt
    → useImportLimit: canImport = (freeRemaining > 0) || hasProAccess
    → If !canImport → show paywall (blocked_upgrade_required from record_property_import)

Paywall
    → usePaywallState: plans from mapOfferingsToPlans(offerings)
    → Purchase → purchasePackage(rawPackage) → on success update customerInfo + cache + syncSubscriptionStatus
    → Restore → restorePurchases() → same update path
```

---

## 3. Components

| Component | Responsibility |
|-----------|----------------|
| **revenueCat.ts** | Configure (app user ID = Supabase user id), getOfferings, getCustomerInfo, purchasePackage, restorePurchases, hasProAccess, getManagementUrl. iOS-only; no-op on other platforms. |
| **SubscriptionContext** | Single source of truth for offerings, customerInfo, hasProAccess, subscriptionStatus; load on session, refresh on foreground (throttled); purchase/restore with cache + sync; never revoke Pro on error (keep last state or cache). |
| **subscriptionCache.ts** | AsyncStorage cache of { hasProAccess, expirationDate, planName } keyed by userId. Read on load before network; write after successful getCustomerInfo or purchase/restore. Cleared on sign-out. |
| **subscriptionStatusDisplay.ts** | Map customerInfo or cache → UI-safe { planName, isPro, renewalOrExpirationLabel }. |
| **offeringsMapper.ts** | Map RevenueCat current offering + raw packages → SubscriptionPlan[] (id, type, label, priceString, isRecommended, isBestValue, rawPackage). Fallback when offerings fail or empty. |
| **importLimits.ts** | getImportCount (property_imports count), recordPropertyImportEnforced (create property + RPC), syncSubscriptionStatus (upsert subscription_status). Server enforces limit via trigger. |
| **useImportLimit** | canImport = (freeRemaining > 0) \|\| hasProAccess; refresh on mount and when subscription changes. |
| **usePaywallState** | Plans, loading, error, purchasing/restoring, entitlement verification, pending (Ask to Buy), restore outcome. Single purchase-in-progress guard. |
| **PaywallContent / paywall.tsx** | Paywall UI; paywall_viewed on mount; plan_selected + purchase_started on Subscribe; purchase_succeeded/cancelled/failed via usePaywallState + paywall callbacks. |

---

## 4. Product fetching

- **Source:** RevenueCat `getOfferings()` → current offering + `rawCurrentPackages` (passed to `purchasePackage`).
- **When:** On SubscriptionContext load (session set) and on refresh (pull-to-refresh, foreground throttle).
- **Failure:** Offerings null or empty → fallback result in usePaywallState; UI shows "Plans temporarily unavailable" + Retry. We do not block paywall; user can retry.
- **Prices:** Always from Store (RevenueCat returns product.priceString). No hardcoded prices.

---

## 5. Purchase flow

1. User taps Subscribe on a plan → `handlePurchase(plan)` (paywall or usePaywallState).
2. `trackEvent('paywall_plan_selected')`, `trackEvent('purchase_started')`.
3. `purchase(plan.rawPackage, plan.displayPackage)` (SubscriptionContext).
4. RevenueCat `purchasePackage(rawPackage)` → Apple sheet.
5. **Success:** customerInfo returned → setCustomerInfo + setCachedSubscription + refreshCustomerInfoOnly (silent) + syncSubscriptionStatus. If hasProAccess immediately → `trackEvent('purchase_succeeded')`, callback (e.g. close paywall). If entitlement delayed → show "Activating…", poll refresh until hasProAccess or timeout (then show "Your subscription is activating…" and Close).
6. **Cancelled:** `trackEvent('purchase_cancelled')`, optional callback.
7. **Pending (e.g. Ask to Buy):** Show "Purchase is pending approval…". No revoke.
8. **Error:** `trackEvent('purchase_failed')`, set error in context; show retry.

---

## 6. Entitlement state

- **Source of truth:** RevenueCat customerInfo. We never revoke based on client-only guess.
- **Fallback:** Cached snapshot (last known hasProAccess, expirationDate, planName) when offline or when getCustomerInfo fails.
- **Sync to backend:** After load/purchase/restore, `syncSubscriptionStatus(supabase, userId, hasProAccess)` so server trigger on `property_imports` allows imports for Pro users.

---

## 7. Restore purchases

- **Entry points:** Settings (Restore purchases), Paywall (Restore purchases).
- **Flow:** `restore()` → RevenueCat `restorePurchases()` → customerInfo → same update path as purchase (cache + sync). Outcome mapped via getRestoreOutcome (success / no_purchases / failed / offline).
- **Events:** restore_started, restore_succeeded or restore_failed.

---

## 8. Paywall gating

- **When:** Import screen checks canImport; when user attempts import and server returns `blocked_upgrade_required`, paywall is shown (and pending import can be resumed after upgrade).
- **Already Pro:** Paywall screen shows "You have Pro" + Manage subscription + Done.

---

## 9. Trial / intro offer handling

- **Configuration:** Optional in App Store Connect (introductory offer or free trial on products). RevenueCat passes through StoreKit; if configured, product may include introductory pricing.
- **Current UI:** We display `product.priceString` from RevenueCat; if the product has an intro offer, StoreKit may show it in the purchase sheet. We do not currently surface intro price in our plan cards (can be added by reading package.introductoryOffer or equivalent from RevenueCat when available).
- **Compliance:** If you enable a free trial, ensure Privacy Policy and paywall copy state that payment is charged after the trial unless cancelled.

---

## 10. Subscription status refresh

- **On session:** Load runs when session?.id is set.
- **On foreground:** AppState 'active' triggers refresh, throttled (e.g. 30s) to avoid excessive calls.
- **After purchase/restore:** refreshCustomerInfoOnly() to sync without flashing loading.
- **On error:** We do not set customerInfo to null; we keep previous or cached state so Pro is not revoked on network failure.

---

## 11. Offline-safe entitlement behavior

- **On launch:** Read cache (getCachedSubscription(userId)) first; set cachedSnapshot so UI shows last-known Pro/Free.
- **Then load:** getOfferings + getCustomerInfo. On success, update customerInfo and cache. On failure, leave customerInfo and cache as-is (no revoke).
- **hasProAccess:** customerInfo ? checkProAccess(customerInfo) : cachedSnapshot?.hasProAccess ?? false.

---

## 12. Server verification (backend exists)

- **subscription_status:** Table keyed by user_id; column entitlement_active. Updated by app via syncSubscriptionStatus when we have definitive hasProAccess.
- **record_property_import RPC:** Reads subscription_status.entitlement_active; allows import when true or when under free limit. Trigger on property_imports enforces count for free users.
- **Optional webhook:** RevenueCat can send server notifications to your backend; you can update subscription_status from webhook for consistency. App still syncs on load/purchase/restore so client and server stay aligned.

---

## 13. Non-iOS / removed flows

- **Production purchases:** iOS only. getRevenueCatApiKey() returns '' for non-iOS; purchase and restore return "not available on this platform" and no-op.
- **Android:** Config keys exist for future use; current app is iOS-first. Paywall copy can be iOS-specific (Apple ID only).
- **Web:** No IAP; paywall shows "In-app subscriptions are available in the PropFolio app."

This architecture supports production-grade subscription behavior with graceful handling of billing edge cases and local entitlement caching with server verification.
