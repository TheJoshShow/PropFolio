import { describe, expect, it } from 'vitest';

import {
  REVENUECAT_SECRET_KEY_USER_MESSAGE,
  summarizeRevenueCatKey,
  userFacingRevenueCatError,
  validateRevenueCatPublicKey,
} from './revenueCatKeyValidation';

describe('validateRevenueCatPublicKey', () => {
  it('accepts appl_ iOS public key shape', () => {
    const r = validateRevenueCatPublicKey('ios', 'appl_' + 'x'.repeat(28));
    expect(r.ok).toBe(true);
  });

  it('rejects RevenueCat-style secret keys on iOS', () => {
    // Use rcsk_ (not sk_* ) so repo secret scanning does not match Stripe-style test literals.
    const r = validateRevenueCatPublicKey('ios', 'rcsk_' + 'x'.repeat(32));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('secret_key');
      expect(r.userMessage).toContain('public');
    }
  });

  it('rejects missing key', () => {
    const r = validateRevenueCatPublicKey('ios', '');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('missing');
    }
  });

  it('rejects goog_ on iOS', () => {
    const r = validateRevenueCatPublicKey('ios', 'goog_' + 'y'.repeat(28));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('wrong_platform');
    }
  });

  it('accepts goog_ on Android', () => {
    const r = validateRevenueCatPublicKey('android', 'goog_' + 'y'.repeat(28));
    expect(r.ok).toBe(true);
  });
});

describe('summarizeRevenueCatKey', () => {
  it('never echoes full key', () => {
    const s = summarizeRevenueCatKey('appl_abcdefgh_secret_suffix');
    expect(s).toContain('appl_');
    expect(s).toContain('len=');
    expect(s).not.toContain('secret_suffix');
  });
});

describe('userFacingRevenueCatError', () => {
  it('maps RevenueCat 7243 to secret-key guidance', () => {
    const msg = userFacingRevenueCatError('Error 7243: Secret API keys should not be used');
    expect(msg).toBe(REVENUECAT_SECRET_KEY_USER_MESSAGE);
  });
});
