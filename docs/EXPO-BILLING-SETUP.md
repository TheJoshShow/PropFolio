# Expo Billing Setup (RevenueCat / Native Subscriptions)

This doc covers configuration for native in-app subscriptions in the PropFolio Expo app. No UI or billing logic is implemented here—only config and placeholders.

---

## 1. Prebuild Required (No Config Plugin)

- **react-native-purchases** (RevenueCat) includes native code and **does not provide an Expo config plugin**.
- **Expo Go cannot run real in-app purchases.** You must use a **development build**:
  - Run `npx expo prebuild` to generate `ios/` and `android/`.
  - Then `npx expo run:ios` or `npx expo run:android` (or build via EAS).
- The app is configured so that **web** and **Expo Go** continue to run without crashing when RevenueCat is unavailable; purchase/restore are no-op or show a message on web.

**Expo config:** `app.json` includes `expo.extra.billingRequiresPrebuild: true` as a reminder that native billing requires a prebuild.

---

## 2. Package Dependencies

- **react-native-purchases** (^9.12.0) is already in `expo-app/package.json`. No additional billing packages were added.
- Compatible with current Expo SDK 55 and React Native 0.83. No unrelated packages were removed.

---

## 3. Environment Variables

Set these in `expo-app/.env` (do not commit real keys). See `expo-app/.env.example` for placeholders.

| Variable | Where to get it | Required for |
|----------|------------------|--------------|
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat Dashboard → Project → API Keys → Public app-specific (iOS) | iOS subscriptions |

- Keys are read at runtime via `expo-app/src/config/billing.ts` (`getRevenueCatApiKey()`, `isBillingConfigured()`).
- No keys are hardcoded in the repo.

---

## 4. Central Billing Config

**File:** `expo-app/src/config/billing.ts`

- **Env var names:** `ENV_REVENUECAT_API_KEY_IOS`.
- **Helpers:** `getRevenueCatApiKey()`, `isBillingConfigured()`.
- **Entitlement:** `ENTITLEMENT_PRO = 'pro'` — must match RevenueCat Dashboard → Entitlements.
- **Offering:** `OFFERING_IDENTIFIER_DEFAULT = 'default'` — must match RevenueCat Dashboard → Offerings (replace if you use another identifier).
- **Product IDs:** `PRODUCT_IDS.monthly`, `PRODUCT_IDS.annual` — placeholders (empty); insert from App Store Connect / Play Console when products exist; used for reference/validation only; RevenueCat returns packages at runtime via `getOfferings()`.
- **Feature flags:** `BILLING_FEATURE_FLAGS` (paywallEnabled, restoreEnabled, manageSubscriptionEnabled).

Comments in `billing.ts` mark where to insert dashboard values.

---

## 5. Manual Values You Must Supply

| What | Where | Notes |
|------|--------|--------|
| RevenueCat iOS API key | `.env`: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | From RevenueCat Dashboard → API Keys (iOS). |
| Entitlement identifier | RevenueCat Dashboard → Entitlements | Create entitlement; use `pro` to match `ENTITLEMENT_PRO` in `billing.ts`, or change `ENTITLEMENT_PRO` to match dashboard. |
| Offering identifier | RevenueCat Dashboard → Offerings | Create offering (e.g. "default"); if different, set `OFFERING_IDENTIFIER_DEFAULT` in `billing.ts`. |
| Product IDs (iOS) | App Store Connect → In-App Purchases | Create subscription products; add in RevenueCat → Products and attach to offering. Optionally set `PRODUCT_IDS.monthly` / `PRODUCT_IDS.annual` in `billing.ts`. |
| Product IDs (Android) | Google Play Console → Monetize → Subscriptions | Same as iOS; add in RevenueCat and attach to offering. |
| App Store / Play credentials | App Store Connect, Play Console, RevenueCat | Never committed; configure in RevenueCat Dashboard (App Store Connect API key, Play Service credentials, etc.) per RevenueCat docs. |

---

## 6. Manual Configuration Steps (Outside Codebase)

1. **RevenueCat:** Create project; add iOS app; create entitlement (e.g. `pro`); create offering and packages; add product IDs from App Store Connect.
2. **App Store Connect:** Create in-app subscription products; sign agreements; link app to RevenueCat if using App Store Server Notifications.
3. **RevenueCat API key:** Copy the public iOS app-specific API key into `.env` as above.
4. **Expo:** Run `npx expo prebuild` then `npx expo run:ios` for device/simulator builds that can use IAP.
5. **Supabase (existing):** Ensure `subscription_status` and RevenueCat webhook are configured so server and client stay in sync.

---

## 7. QA Checklist (Config-Only Changes)

- [ ] **Typecheck:** From `expo-app/`, run `npm run typecheck` (or `npx tsc --noEmit`). No errors.
- [ ] **Config import:** App builds and starts (e.g. `npx expo start`). No runtime error from importing `src/config/billing.ts`.
- [ ] **Web:** Run for web; no crash when RevenueCat is not configured (billing helpers return empty/false on web).
- [ ] **Env:** With RevenueCat keys **unset** in `.env`, native app still launches; `isBillingConfigured()` is false; no hardcoded keys in repo.
- [ ] **Env:** After setting `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` in `.env`, `getRevenueCatApiKey()` returns that value on iOS and empty on non-iOS.
- [ ] **revenueCat.ts:** Subscription flow (configure, getOfferings, hasProAccess) still uses `PRO_ENTITLEMENT_ID` and API key from billing config; no duplicate constants.
- [ ] **Prebuild (optional):** Run `npx expo prebuild` in `expo-app/`; `ios/` and `android/` generate without errors; `app.json` is valid including `expo.extra.billingRequiresPrebuild`.

---

## 8. Files Created, Changed, or Deleted (This Prep Work)

| Action | File | Why |
|--------|------|-----|
| **Created** | `expo-app/src/config/billing.ts` | Central config for env var names, entitlement/offering/product IDs, feature flags; comments mark where to insert dashboard values; no secrets. |
| **Created** | `docs/EXPO-BILLING-SETUP.md` | Documents prebuild requirement, env vars, billing config, manual values, manual steps, and QA checklist. |
| **Changed** | `expo-app/src/services/revenueCat.ts` | Imports `getRevenueCatApiKey` and `ENTITLEMENT_PRO` from `config/billing`; removes duplicate env/entitlement definitions. |
| **Changed** | `expo-app/.env.example` | Clarifies RevenueCat env vars and points to `src/config/billing.ts` for product/offering/entitlement IDs. |
| **Changed** | `expo-app/app.json` | Adds `expo.extra.billingRequiresPrebuild: true` to document that native billing requires a development build. |
| **Unchanged** | `expo-app/package.json` | No package changes; `react-native-purchases` was already present; no packages removed. |
