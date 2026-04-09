/**
 * Client-side RevenueCat API key checks. The mobile SDK must use platform *public* SDK keys only
 * (iOS: appl_…, Android: goog_…). Secret keys (sk_…) trigger RC error 7243 and must never ship in the app.
 */

export type RevenueCatKeyValidationFailureCode =
  | 'missing'
  | 'secret_key'
  | 'wrong_platform'
  | 'invalid_prefix'
  | 'suspicious_format';

export type RevenueCatKeyValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: RevenueCatKeyValidationFailureCode;
      /** Safe to show in UI */
      userMessage: string;
    };

/** Prefix for RevenueCat Apple App Store public SDK key. */
export const REVENUECAT_IOS_PUBLIC_PREFIX = 'appl_';

/** Prefix for RevenueCat Google Play public SDK key. */
export const REVENUECAT_ANDROID_PUBLIC_PREFIX = 'goog_';

const SECRET_PREFIXES = ['sk_', 'rcsk_'] as const;

/** Thrown when the SDK cannot start due to environment or invalid public key (dev-friendly `name`). */
export class RevenueCatConfigurationError extends Error {
  override readonly name = 'RevenueCatConfigurationError';

  constructor(
    message: string,
    public readonly reasonCode:
      | RevenueCatKeyValidationFailureCode
      | 'expo_go'
      | 'non_native_platform'
      | 'configure_failed',
  ) {
    super(message);
  }
}

/** Shown when a secret key is configured client-side or RC returns 7243. */
export const REVENUECAT_SECRET_KEY_USER_MESSAGE =
  'This build is using a RevenueCat secret API key in the app. Use only the public Apple SDK key from RevenueCat → Project → API keys (starts with appl_). Remove any sk_ key from EXPO_PUBLIC_REVENUECAT_API_KEY_IOS and rebuild.';

/** Safe log line: prefix + length only (never log full key). */
export function summarizeRevenueCatKey(key: string | null | undefined): string {
  const k = key?.trim() ?? '';
  if (!k) {
    return '(empty)';
  }
  const head = k.slice(0, 5);
  return `${head}… (len=${k.length})`;
}

function looksLikeSecretKey(k: string): boolean {
  const lower = k.toLowerCase();
  return SECRET_PREFIXES.some((p) => lower.startsWith(p));
}

/**
 * Validate the key string for the target store. Call before `Purchases.configure`.
 */
export function validateRevenueCatPublicKey(
  platform: 'ios' | 'android',
  key: string | null | undefined,
): RevenueCatKeyValidationResult {
  const k = key?.trim() ?? '';
  if (!k) {
    const userMessage =
      platform === 'ios'
        ? 'Billing is not configured: missing RevenueCat iOS public key. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS to the Apple public SDK key (starts with appl_) in EAS env or .env, then rebuild.'
        : 'Billing is not configured: missing RevenueCat Android public key. Set EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID to the Google Play public SDK key (starts with goog_) in EAS env or .env, then rebuild.';
    return {
      ok: false,
      code: 'missing',
      userMessage,
    };
  }

  if (looksLikeSecretKey(k)) {
    return {
      ok: false,
      code: 'secret_key',
      userMessage: REVENUECAT_SECRET_KEY_USER_MESSAGE,
    };
  }

  if (platform === 'ios') {
    if (k.startsWith(REVENUECAT_ANDROID_PUBLIC_PREFIX)) {
      return {
        ok: false,
        code: 'wrong_platform',
        userMessage:
          'The RevenueCat key looks like an Android (Google Play) public key. iOS requires the Apple public SDK key (starts with appl_).',
      };
    }
    if (!k.startsWith(REVENUECAT_IOS_PUBLIC_PREFIX)) {
      return {
        ok: false,
        code: 'invalid_prefix',
        userMessage:
          'Invalid RevenueCat iOS key: expected the public Apple SDK key from RevenueCat (starts with appl_). Check EXPO_PUBLIC_REVENUECAT_API_KEY_IOS (or expo.extra.revenueCatApiKeyIos) and rebuild.',
      };
    }
  } else {
    if (k.startsWith(REVENUECAT_IOS_PUBLIC_PREFIX)) {
      return {
        ok: false,
        code: 'wrong_platform',
        userMessage:
          'The RevenueCat key looks like an iOS (Apple) public key. Android builds need the Google Play public SDK key (starts with goog_).',
      };
    }
    if (!k.startsWith(REVENUECAT_ANDROID_PUBLIC_PREFIX)) {
      return {
        ok: false,
        code: 'invalid_prefix',
        userMessage:
          'Invalid RevenueCat Android key: expected the public Google Play SDK key (starts with goog_).',
      };
    }
  }

  if (k.length < 20) {
    return {
      ok: false,
      code: 'suspicious_format',
      userMessage: 'The RevenueCat API key looks truncated or malformed. Copy the full public SDK key from RevenueCat and rebuild.',
    };
  }

  return { ok: true };
}

/**
 * Normalize SDK / network errors for display (map known RC codes; avoid echoing sensitive details).
 */
export function userFacingRevenueCatError(raw: string | undefined | null): string {
  const msg = raw?.trim() ?? '';
  if (!msg) {
    return 'The App Store billing service did not respond. Check your connection and try again.';
  }
  const lower = msg.toLowerCase();
  if (lower.includes('7243') || lower.includes('secret api key')) {
    return REVENUECAT_SECRET_KEY_USER_MESSAGE;
  }
  if (lower.includes('secret') && lower.includes('key') && lower.includes('not')) {
    return REVENUECAT_SECRET_KEY_USER_MESSAGE;
  }
  return msg;
}
