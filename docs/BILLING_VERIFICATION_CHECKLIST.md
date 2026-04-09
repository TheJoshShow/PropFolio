# PropFolio billing — verification checklist

Use after changing RevenueCat, App Store Connect, or EAS environment variables.

## Product contract (code)

- **Entitlement:** `propfolio_pro` (membership only; not consumable credits)
- **Subscription product ID:** `com.propfolio.subscription.monthly`
- **Credit consumables:** `com.propfolio.credits.{1,5,10,20}`
- **Default offering IDs:** `propfolio_subscription`, `propfolio_credits` (override with `EXPO_PUBLIC_RC_*`)
- **Bundle ID:** `com.propfolio.mobile`

Canonical definitions: `src/services/revenuecat/productIds.ts` (keep webhook `supabase/functions/revenuecat-webhook/constants.ts` in sync).

## Local checks

1. Copy `.env.example` → `.env`; set `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` to the **Apple public SDK** key (`appl_…` only).
2. `npx tsc --noEmit` and `npm test` pass.
3. Run a **development build** or simulator build — **not Expo Go** — for StoreKit.
4. Sign in, open **Settings → Developer → Billing diagnostics** (`__DEV__` only). Confirm primary diagnosis is healthy or matches a known setup issue.
5. Metro / Xcode: search logs for `[PropFolio/billingDiagnostics]` and `[PropFolio/paywallBilling]` (structured JSON, no full keys).

## EAS build steps

1. **Secrets:** In EAS, create/update project secrets for each required `EXPO_PUBLIC_*` variable (at minimum `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`; plus Supabase URL/anon key if not in `app.json` extra).
2. **iOS device build:** Use `preview` or `production` profile (not `development` with `simulator: true`) for real StoreKit / sandbox purchases on device.
3. Build: e.g. `npm run eas:build:ios:preview` or `eas:build:ios` for production.
4. Confirm the built app’s paywall shows subscription prices (not perpetual “loading” / “billing unavailable” from wrong env).

## TestFlight test steps

1. Install the TestFlight build. Use a **Sandbox** Apple ID when prompted for purchase (or production Apple ID for live).
2. **Subscribe:** Complete checkout; app should unlock **before** webhook latency matters (client + server OR logic).
3. **Restore:** Settings or paywall → Restore purchases; entitlement returns if subscription valid.
4. **Credits:** With active membership, open credit top-up; packs load if RevenueCat credits offering is configured. Buying credits must **not** unlock the app without membership.
5. **Server:** Confirm Supabase `user_subscription_status` updates after purchase (RevenueCat webhook + `REVENUECAT_WEBHOOK_SECRET`).

## Expected results on success

- Paywall shows **one** calm billing status (no duplicate technical warnings); dev details only in `__DEV__` expander.
- **Subscribe** enabled when offerings include the expected monthly product; **Restore** enabled when the SDK can run.
- After purchase, **portfolio / main app** is reachable without waiting solely on the webhook.
- Diagnostics: `offeringsFetchStatus` ok, `subscriptionPackageCount` ≥ 1, `storeEntitlementActive` true after purchase.
