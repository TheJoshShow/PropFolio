## PropFolio – Subscription Product & Entitlement Mapping

This file maps App Store / Google Play products to RevenueCat and to in‑app configuration.

### 1. Entitlement

- **Primary entitlement**
  - Identifier (app code): `ENTITLEMENT_PRO_ACCESS` (and legacy alias `ENTITLEMENT_PRO`).
  - Dashboard: RevenueCat → Entitlements → create `pro_access` (or change app constant to match).
  - Grants: Unlimited property imports and Pro access across the app.

### 2. Offerings & packages (RevenueCat)

- **Default offering**
  - Identifier: `default` (matches `OFFERING_IDENTIFIER_DEFAULT`).
  - Packages:
    - Monthly package:
      - RevenueCat package identifier: `$rc_monthly` (matches `PACKAGE_IDENTIFIERS.monthly`).
      - Store product: iOS/Android monthly subscription product (see below).
    - Annual package:
      - RevenueCat package identifier: `$rc_annual` (matches `PACKAGE_IDENTIFIERS.annual`).
      - Store product: iOS/Android annual subscription product.

### 3. Store product IDs (examples)

Configure these in App Store Connect and Google Play Console, then attach them to packages in RevenueCat. The exact strings can differ; keep them in sync with the app constants for clarity.

- **Apple App Store**
  - Monthly: `com.propfolio.premium.monthly`
  - Annual: `com.propfolio.premium.annual`
- **Google Play Console**
  - Monthly: `com.propfolio.premium.monthly`
  - Annual: `com.propfolio.premium.annual`

These values are represented in `PRODUCT_IDS` in `expo-app/src/config/billing.ts` for reference and validation.

### 4. API keys and environment

- RevenueCat public API keys:
  - iOS: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
- The app:
  - Reads keys via `getRevenueCatApiKey()`.
  - Configures `react-native-purchases` with the Supabase user id as the RevenueCat app user ID.
  - Uses `hasProAccess` from RevenueCat customer info as the single source of truth for entitlement, then syncs to Supabase `subscription_status`.

