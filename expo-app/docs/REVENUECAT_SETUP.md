# RevenueCat Setup (PropFolio)

This app expects one canonical env naming scheme:

- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`

## Required variables

For iOS production/TestFlight:

- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxx`

## Where to set them

- Local dev: `expo-app/.env` (copy from `.env.example`)
- EAS production builds: EAS project env/secrets
  - Ensure `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` exists in EAS
  - `eas.json` forwards the iOS key in production profile

## Verification checklist

1. Open paywall on an iOS device/TestFlight build.
2. Confirm plans load from RevenueCat offerings.
3. In dev builds, check the diagnostics card at the bottom of paywall:
   - `init=true`
   - `billingConfigured=true`
   - `offeringsLoaded=true`
4. Run restore and confirm restore status card returns success/no-purchases (not config error).
5. If offerings are unavailable in production, user sees a clean unavailable message (not a developer env warning).

## Notes

- Billing config is resolved via `getBillingConfig()` in `src/config/billing.ts`.
- RevenueCat initialization is logged through `logStoreStep()` with safe non-secret diagnostics.
