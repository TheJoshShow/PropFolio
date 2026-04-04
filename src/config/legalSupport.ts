/**
 * Legal & support endpoints — defaults are placeholders; override via `EXPO_PUBLIC_*` before release.
 */

export const LEGAL_PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? 'https://example.com/propfolio/privacy';

export const LEGAL_TERMS_OF_SERVICE_URL =
  process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL ?? 'https://example.com/propfolio/terms';

export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@example.com';

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('PropFolio support')}`;
