/**
 * Legal and support URLs. Values come from `getRuntimeConfig()` (EXPO_PUBLIC_*); defaults for public pages.
 * Prefer `getPrivacyPolicyUrl()` / `getTermsUrl()` at call sites so URLs stay in sync with config.
 */

import { getRuntimeConfig } from './runtimeConfig';

/**
 * Default public pages — deployed marketing / legal site (Vercel).
 * Override with EXPO_PUBLIC_* if the hosted domain or paths change.
 */
export const DEFAULT_PRIVACY_POLICY_URL = 'https://prop-folio.vercel.app/privacy';
export const DEFAULT_TERMS_OF_SERVICE_URL = 'https://prop-folio.vercel.app/terms';
export const DEFAULT_SUPPORT_URL = 'https://prop-folio.vercel.app/support';

export function getPrivacyPolicyUrl(): string {
  const v = getRuntimeConfig().privacyPolicyUrl;
  return v || DEFAULT_PRIVACY_POLICY_URL;
}

/** Terms of Use / Terms of Service (same document). Used in Settings, Paywall, and Sign-up. */
export function getTermsUrl(): string {
  const v = getRuntimeConfig().termsUrl;
  return v || DEFAULT_TERMS_OF_SERVICE_URL;
}

/** Billing / subscription help (FAQ or support). Empty = no link; show inline help text only. */
export function getBillingHelpUrl(): string {
  return getRuntimeConfig().billingHelpUrl;
}

/**
 * Contact / support (App Store requirement). Used in Settings and should match App Store Connect Support URL.
 * Use a support page URL or mailto (e.g. mailto:support@propfolio.app).
 */
export function getSupportUrl(): string {
  const v = getRuntimeConfig().supportUrl;
  return v || DEFAULT_SUPPORT_URL;
}
