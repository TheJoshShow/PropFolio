/**
 * Legal and support URLs. Override via env for production.
 * App Store: Privacy Policy URL and Support URL are required; use these for in-app and Connect.
 *
 * Exported constants (PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL) are the resolved URLs used at runtime.
 */

const ENV_PRIVACY_POLICY_URL = (process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? '').trim();
const ENV_TERMS_URL = (process.env.EXPO_PUBLIC_TERMS_URL ?? '').trim();
const ENV_BILLING_HELP_URL = (process.env.EXPO_PUBLIC_BILLING_HELP_URL ?? '').trim();
const ENV_SUPPORT_URL = (process.env.EXPO_PUBLIC_SUPPORT_URL ?? '').trim();

/**
 * Default public pages — live site (www.propfolio.com).
 * Override with EXPO_PUBLIC_* if the hosted domain or paths change.
 */
export const DEFAULT_PRIVACY_POLICY_URL = 'https://www.propfolio.com/privacy';
export const DEFAULT_TERMS_OF_SERVICE_URL = 'https://www.propfolio.com/terms';
export const DEFAULT_SUPPORT_URL = 'https://www.propfolio.com/support';

/**
 * Resolved Privacy Policy URL (`EXPO_PUBLIC_PRIVACY_POLICY_URL` or default).
 * Use this or `getPrivacyPolicyUrl()` — they return the same value.
 */
export const PRIVACY_POLICY_URL = ENV_PRIVACY_POLICY_URL || DEFAULT_PRIVACY_POLICY_URL;

/**
 * Resolved Terms of Service URL (`EXPO_PUBLIC_TERMS_URL` or default).
 */
export const TERMS_OF_SERVICE_URL = ENV_TERMS_URL || DEFAULT_TERMS_OF_SERVICE_URL;

export function getPrivacyPolicyUrl(): string {
  return PRIVACY_POLICY_URL;
}

/** Terms of Use / Terms of Service (same document). Used in Settings, Paywall, and Sign-up. */
export function getTermsUrl(): string {
  return TERMS_OF_SERVICE_URL;
}

/** Billing / subscription help (FAQ or support). Empty = no link; show inline help text only. */
export function getBillingHelpUrl(): string {
  return ENV_BILLING_HELP_URL;
}

/**
 * Contact / support (App Store requirement). Used in Settings and should match App Store Connect Support URL.
 * Use a support page URL or mailto (e.g. mailto:support@propfolio.app).
 */
export function getSupportUrl(): string {
  return ENV_SUPPORT_URL || DEFAULT_SUPPORT_URL;
}
