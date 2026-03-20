# PropFolio Purchase Edge Cases Checklist

**Purpose:** Billing edge cases and how the app handles them (production-grade behavior).  
**Last updated:** 2025-03-12.

---

## 1. Purchase flow

| Edge case | Handling | Location |
|-----------|----------|----------|
| **User cancels Apple sheet** | Result: success: false, cancelled: true. We do not set error. trackEvent('purchase_cancelled'). Optional callback (e.g. analytics). No revoke. | revenueCat.ts purchasePackage; usePaywallState handlePurchase |
| **Ask to Buy / pending approval** | Result: success: false, pending: true. Show message: "Purchase is pending approval. You will get Pro access once approved." Do not revoke; do not treat as error. | revenueCat.ts (DEFERRED/pending); usePaywallState setPendingMessage |
| **Network error during purchase** | RevenueCat/Store returns error. Result: success: false, error: string. trackEvent('purchase_failed'). setError in context; UI shows retry. | revenueCat.ts catch; usePaywallState |
| **Purchase success but customerInfo missing** | Rare. We return success: false, error: "Purchase completed but no customer info returned." User can restore or retry. | revenueCat.ts purchasePackage |
| **Entitlement delayed after purchase** | customerInfo returned but hasProAccess false (e.g. server delay). We show "Activating…", call refresh in loop; after 10s timeout show "Your subscription is activating. You can close this screen—Pro access will appear shortly." On next refresh when hasProAccess we call onPurchaseSuccess. | usePaywallState handlePurchase + entitlementVerifying effect |
| **Duplicate purchase (already subscribed)** | RevenueCat may return success with same entitlement. We update customerInfo and cache; no duplicate charge. | SubscriptionContext purchase |
| **Purchase in progress (double tap)** | purchaseInProgressRef guards; second tap ignored. | usePaywallState handlePurchase |

---

## 2. Restore flow

| Edge case | Handling | Location |
|-----------|----------|----------|
| **Restore success, user has Pro** | customerInfo has pro_access active. Update state + cache + sync. Alert "Purchases restored". trackEvent('restore_succeeded'). | usePaywallState handleRestore; restorePurchases.ts getRestoreOutcome |
| **Restore success, no active subscription** | customerInfo returned but hasProAccess false. Outcome: no_purchases. Message: "No previous purchases were found for this account…" trackEvent('restore_failed'). | getRestoreOutcome; usePaywallState |
| **Restore failed (network/API)** | Result success: false, error. Outcome: failed or offline (if error message suggests offline). Alert with outcome.message. trackEvent('restore_failed'). | revenueCat.ts restorePurchases; getRestoreOutcome looksOffline |
| **User offline** | getCustomerInfo/restorePurchases may fail. We show "You appear to be offline. Check your connection and try again." (outcome offline). | RESTORE_OUTCOME_COPY.offline; looksOffline |

---

## 3. Offerings / product fetch

| Edge case | Handling | Location |
|-----------|----------|----------|
| **Offerings fail to load (network, RC down)** | getOfferings returns null. SubscriptionContext sets offerings null; does not clear customerInfo. usePaywallState shows fallback: "Plans are temporarily unavailable" + Retry. | SubscriptionContext load; offeringsMapper getFallbackOfferingsResult |
| **Offerings empty (no packages)** | mapOfferingsToPlans returns fallback 'empty'. Same fallback UI. | offeringsMapper |
| **Malformed package (missing price, etc.)** | isPackageValidForPurchase filters out; only valid packages shown. If none valid, fallback. | offeringsMapper mapOfferingsToPlans |
| **Store unavailable (e.g. unsupported region)** | RevenueCat may return empty or fail. We show fallback message; user can retry. | Same as offerings fail |

---

## 4. Entitlement and cache

| Edge case | Handling | Location |
|-----------|----------|----------|
| **App launch offline** | Load cache first; show cached hasProAccess. Then load() runs; getCustomerInfo fails → we do not overwrite customerInfo with null; hasProAccess stays from cache. | SubscriptionContext useEffect; hasProAccess = customerInfo ? … : cachedSnapshot?.hasProAccess |
| **Refresh fails (e.g. network)** | We do not set customerInfo to null. setError so UI can show "Couldn't load subscription" + Retry; entitlement unchanged. | SubscriptionContext refresh catch |
| **Expired subscription** | When customerInfo finally loads with isActive false, we show Free and gate. Cache updated so next launch shows Free. | getSubscriptionStatusDisplay; buildCacheSnapshotFromCustomerInfo |
| **Sign-out** | clearCachedSubscription(userId); logOutRevenueCat(); set customerInfo/offerings null. | SubscriptionContext useEffect on !session |

---

## 5. Server sync

| Edge case | Handling | Location |
|-----------|----------|----------|
| **syncSubscriptionStatus fails** | Logged (logErrorSafe); we do not block purchase or restore. User still has Pro locally; server may catch up on next sync or webhook. | importLimits.ts syncSubscriptionStatus |
| **record_property_import returns blocked** | User at limit and server says not entitled. We roll back property insert and return blocked_upgrade_required; UI shows paywall. If user just purchased, sync may not have run yet; they can retry after refresh. | importLimits.ts recordPropertyImportEnforced |

---

## 6. Paywall and UI

| Edge case | Handling | Location |
|-----------|----------|----------|
| **User already has Pro opens paywall** | Paywall screen shows "You have Pro" + Manage subscription + Done. No plan cards. | paywall.tsx if (state.hasProAccess) |
| **Plans load after paywall viewed** | offeringsResult moves from fallback to success; plansForDisplay updates; user sees plans. | usePaywallState offeringsResult memo |
| **Retry after offerings fail** | User taps Try again → onRefresh() → refresh() → getOfferings + getCustomerInfo again. | PaywallContent tryAgainLabel; usePaywallState onRefresh |

---

## 7. Compliance and copy

| Edge case | Handling | Location |
|-----------|----------|----------|
| **Pending (Ask to Buy)** | Message is neutral: "Purchase is pending approval. You will get Pro access once approved." No guarantee of approval. | paywallCopy / usePaywallState setPendingMessage |
| **Footer** | Apple ID, renewal, cancel in device settings. No misleading "guaranteed" or investment claims. | paywallCopy.footer |
| **Restore no purchases** | Message explains same Apple ID; no blame. | RESTORE_OUTCOME_COPY.no_purchases |

Use this checklist for QA and to ensure all edge cases remain handled after code changes.
