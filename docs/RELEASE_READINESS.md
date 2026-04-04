# PropFolio — release readiness

Use this before TestFlight / Play internal / production.

## Build & quality gates

- [ ] `npx tsc --noEmit` passes.
- [ ] `npx vitest run` passes.
- [ ] EAS build succeeds for iOS and Android (dev client or store profile as appropriate).
- [ ] Smoke: sign up → verify email (if required) → import property → open detail → adjust assumptions → save → portfolio list refresh.

## Configuration

- [ ] `.env` / EAS secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Supabase: redirect URLs, RLS verified, migrations applied (`001`–`008` in order).
- [ ] Edge functions deployed: `import-property`, `places-*`, optional `generate-property-summary`, `revenuecat-webhook`, etc.
- [ ] Edge secrets: `RENTCAST_API_KEY`, `GOOGLE_MAPS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (webhook), `OPENAI_API_KEY` (if summaries on), `REVENUECAT_WEBHOOK_SECRET`.
- [ ] `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`, `EXPO_PUBLIC_SUPPORT_EMAIL` point to real endpoints.
- [ ] `EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID` / `EXPO_PUBLIC_RC_CREDITS_OFFERING_ID` match RevenueCat offerings.

## RevenueCat & subscriptions

- [ ] Install and configure `react-native-purchases` in native builds; call `Purchases.configure` with platform keys from env.
- [ ] App Store Connect subscription group + products linked to RevenueCat.
- [ ] RevenueCat webhook `Authorization` matches `REVENUECAT_WEBHOOK_SECRET`; `app_user_id` = Supabase `auth.users.id`.
- [ ] Paywall copy and “Restore purchases” tested on device.

## Import limits & entitlements

- [ ] Import credits are **server-authoritative**: `consume_import_credit` + `import-property` Edge Function; no client-only import caps.
- [ ] Expired membership with credits still on wallet: import API returns `SUBSCRIPTION_REQUIRED` (and client shows membership message).
- [ ] Confirm paywall does not appear for Pro users after cold start (subscription refresh completes).

## Security

- [ ] No service-role or provider secrets in client env or repo.
- [ ] Google Maps / Supabase keys restricted by bundle id / app where possible.

## What we still need from you

1. **Production legal URLs** — replace example.com placeholders in env (privacy, terms, support email).
2. **RevenueCat + store** — real products, offerings, and native SDK wiring (currently stubbed for deterministic dev behavior).
3. **Operational monitoring** — Supabase logs / alerts for Edge failures; optional crash reporting (Sentry, etc.).
4. **App icons, screenshots, and ASO** — store listing assets.
5. **QA devices** — physical iPhone + Android on your target OS versions for keyboard, safe area, and scroll verification.
