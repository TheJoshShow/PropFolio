/**
 * Central billing / subscription config for RevenueCat and in-app purchases.
 * No secrets here — only env var names, placeholder identifiers, and feature flags.
 * Dashboard values (product IDs, offering ID) must be inserted manually where indicated.
 *
 * Production purchases: iOS only. Android key is reserved for future use; getRevenueCatApiKey
 * returns empty string on non-iOS so purchase/restore no-op or return "not available on this platform".
 */

import { Platform } from 'react-native';

// -----------------------------------------------------------------------------
// Environment variable names (values go in .env; never commit real keys)
// -----------------------------------------------------------------------------

/** Env key for RevenueCat iOS API key. Insert value from RevenueCat Dashboard → Project → API Keys → Public app-specific API key (iOS). */
export const ENV_REVENUECAT_API_KEY_IOS = 'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS';

/** Env key for RevenueCat Android API key (reserved; not used for production purchases on iOS-only app). */
export const ENV_REVENUECAT_API_KEY_ANDROID = 'EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID';

/** Whether RevenueCat API key is set for iOS. Does not validate key format. Production IAP is iOS-only. */
export function isBillingConfigured(): boolean {
  return Platform.OS === 'ios' && Boolean((process.env[ENV_REVENUECAT_API_KEY_IOS] ?? '').trim());
}

/** Get RevenueCat API key for current platform. iOS only for production purchases; returns empty string on Android/web. */
export function getRevenueCatApiKey(): string {
  if (Platform.OS === 'ios') {
    return (process.env[ENV_REVENUECAT_API_KEY_IOS] ?? '').trim();
  }
  return '';
}

// -----------------------------------------------------------------------------
// Entitlement identifier (RevenueCat Dashboard)
// -----------------------------------------------------------------------------
// MANUAL: Create an entitlement in RevenueCat Dashboard → Project → Entitlements.
//         Use the same identifier string below so the app and dashboard match.

/** Entitlement that grants Pro access (unlimited imports). Must match RevenueCat Dashboard → Entitlements. */
export const ENTITLEMENT_PRO_ACCESS = 'pro_access';

/** @deprecated Use ENTITLEMENT_PRO_ACCESS. Kept for compatibility until RevenueCat dashboard uses pro_access. */
export const ENTITLEMENT_PRO = ENTITLEMENT_PRO_ACCESS;

// -----------------------------------------------------------------------------
// Offering identifier(s) (RevenueCat Dashboard)
// -----------------------------------------------------------------------------
// MANUAL: Create an offering in RevenueCat Dashboard → Project → Offerings.
//         Default offering is often "default". Add more identifiers if you add more offerings.

/** Primary offering identifier. Must match RevenueCat Dashboard → Offerings. */
export const OFFERING_IDENTIFIER_DEFAULT = 'default';

/** All offering identifiers to consider (e.g. for A/B tests). Current app uses default only. */
export const OFFERING_IDENTIFIERS = [OFFERING_IDENTIFIER_DEFAULT] as const;

// -----------------------------------------------------------------------------
// Product ID placeholders (App Store Connect & Google Play Console)
// -----------------------------------------------------------------------------
// MANUAL: Create in-app products in App Store Connect (iOS) and Google Play Console (Android).
//         Add the same products in RevenueCat Dashboard → Products and attach to your offering.
//         Replace placeholders below with your real product IDs for reference/validation only;
//         live prices come from RevenueCat getOfferings() at runtime.

/** Placeholder product IDs. Replace with real IDs from App Store Connect / Play Console. */
export const PRODUCT_IDS = {
  /** Monthly subscription product id (App Store Connect + RevenueCat product). */
  monthly: 'com.propfolio.premium.monthly',
  /** Annual subscription product id (App Store Connect + RevenueCat product). */
  annual: 'com.propfolio.premium.annual',
} as const;

/** RevenueCat package type identifiers ($rc_monthly, $rc_annual, etc.). Match RevenueCat offering packages. */
export const PACKAGE_IDENTIFIERS = {
  monthly: '$rc_monthly',
  annual: '$rc_annual',
} as const;

export type PlanType = keyof typeof PRODUCT_IDS;

// -----------------------------------------------------------------------------
// Feature flags (app-controlled; no dashboard required)
// -----------------------------------------------------------------------------

export const BILLING_FEATURE_FLAGS = {
  /** Show paywall when user hits free import limit. */
  paywallEnabled: true,
  /** Allow restore purchases in UI. */
  restoreEnabled: true,
  /** Allow "Manage subscription" to open platform flow. */
  manageSubscriptionEnabled: true,
} as const;
