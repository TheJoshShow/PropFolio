# PropFolio App Store Subscription Setup Checklist

**Purpose:** Steps to configure Apple In-App Purchase and RevenueCat for production. Use with App Store Connect and RevenueCat Dashboard.  
**Last updated:** 2025-03-12.

---

## 1. App Store Connect

- [ ] **Agreements and banking**  
  - Paid Apps agreement in effect; banking and tax forms complete.

- [ ] **App**  
  - Create app (or use existing); Bundle ID matches `expo-app/app.json` (e.g. `com.propfolio.app`).

- [ ] **In-App Purchases**  
  - Create subscription group (e.g. "PropFolio Pro").
  - Add **auto-renewable subscriptions** in that group:
    - **Monthly:** e.g. product ID `com.propfolio.premium.monthly`. Set price, duration 1 month.
    - **Annual:** e.g. product ID `com.propfolio.premium.annual`. Set price, duration 1 year.
  - Optional: Add **introductory offer** (free trial or intro price) per product if desired.
  - Submit for review with the app version that uses them.

- [ ] **Product IDs**  
  - Ensure product IDs match exactly what you attach in RevenueCat (and optionally in `billing.ts` PRODUCT_IDS for reference). Live prices come from the store via RevenueCat.

---

## 2. RevenueCat Dashboard

- [ ] **Project**  
  - Create project (or use existing); add **Apple App Store** app, bundle ID same as App Store Connect.

- [ ] **API Keys**  
  - Copy **Public app-specific API key** for iOS. Set in app as `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` (do not commit; use .env or EAS secrets).

- [ ] **Entitlements**  
  - Create entitlement identifier (e.g. `pro_access`). Must match `ENTITLEMENT_PRO_ACCESS` in `billing.ts`. Attach to the subscription products (monthly + annual) so either product grants this entitlement.

- [ ] **Offerings**  
  - Create offering (e.g. identifier `default`). Add packages:
    - Monthly package → attach App Store product `com.propfolio.premium.monthly` (or your monthly product ID).
    - Annual package → attach App Store product `com.propfolio.premium.annual` (or your annual product ID).
  - Set as **current** offering if you use a single default.

- [ ] **Products**  
  - In RevenueCat, products are created when you attach App Store product IDs to packages. Ensure product IDs in App Store Connect match; RevenueCat will fetch prices from Apple.

- [ ] **Optional: Server notifications (webhook)**  
  - If you want server-side verification, configure webhook URL in RevenueCat to your backend (e.g. Supabase Edge Function `revenuecat-webhook`). Update `subscription_status` from webhook; app still syncs on load/purchase/restore.

---

## 3. App (expo-app) configuration

- [ ] **Environment**  
  - `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` set for production builds (EAS or Xcode scheme). Do not commit value.

- [ ] **billing.ts**  
  - `ENTITLEMENT_PRO_ACCESS` matches RevenueCat entitlement identifier.
  - `OFFERING_IDENTIFIER_DEFAULT` matches RevenueCat offering (e.g. `default`).
  - `PRODUCT_IDS` in billing.ts are for reference only; live data comes from getOfferings().

- [ ] **No Android key in production**  
  - If app is iOS-only for purchases, leave Android key unset; getRevenueCatApiKey() returns '' for non-iOS.

---

## 4. Backend (Supabase) – if used

- [ ] **subscription_status table**  
  - Columns: user_id, entitlement_active (boolean), updated_at. App upserts via syncSubscriptionStatus.

- [ ] **record_property_import RPC / trigger**  
  - Trigger on property_imports enforces free-tier count; RPC reads subscription_status.entitlement_active and returns blocked_upgrade_required when over limit and not entitled.

- [ ] **Optional: revenuecat-webhook**  
  - Edge Function receives RevenueCat webhooks; updates subscription_status for the user. Ensures server state matches even if app is not opened.

---

## 5. Testing

- [ ] **Sandbox**  
  - Create Sandbox tester in App Store Connect. Sign in on device with Sandbox account; use app to purchase. Restore and Manage subscription in Settings.

- [ ] **Offerings load**  
  - Open paywall; plans and prices appear (from Sandbox).

- [ ] **Purchase**  
  - Complete purchase; hasProAccess becomes true; syncSubscriptionStatus runs; canImport stays true; record_property_import returns allowed_paid.

- [ ] **Restore**  
  - Restore purchases; same state as after purchase.

- [ ] **Offline**  
  - Turn off network; launch app; cached Pro state shows; no revoke. Turn on network; refresh; state updates.

- [ ] **Edge cases**  
  - Cancel purchase (purchase_cancelled). Ask to Buy if available (pending message). Offerings fail (fallback + Retry). See purchase_edge_cases_checklist.md.

---

## 6. App Store review

- [ ] **Restore purchases**  
  - Visible and working from Paywall and Settings (required by Apple).

- [ ] **Manage subscription**  
  - Opens App Store subscriptions or RevenueCat management URL; fallback copy explains Settings → Subscriptions.

- [ ] **Subscription terms**  
  - Paywall footer states charge to Apple ID, auto-renewal, and manage in device settings. No misleading claims.

- [ ] **Privacy / support**  
  - Privacy Policy and Support URL set; in-app links match.

Use this checklist together with ios_subscription_architecture.md and purchase_edge_cases_checklist.md for a production-ready iOS subscription setup.
