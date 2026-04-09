import Purchases from 'react-native-purchases';
import { describe, expect, it } from 'vitest';

import { interpretPurchaseError, isTransientPurchasesTransportError } from './purchaseOutcome';
import { REVENUECAT_SECRET_KEY_USER_MESSAGE } from './revenueCatKeyValidation';

describe('interpretPurchaseError', () => {
  it('maps RevenueCat 7243 / secret key errors to the standard user message', () => {
    const r = interpretPurchaseError({
      code: '11',
      message: 'Error 7243: using secret key',
    });
    expect(r.outcome).toBe('error');
    if (r.outcome === 'error') {
      expect(r.message).toBe(REVENUECAT_SECRET_KEY_USER_MESSAGE);
    }
  });

  it('maps network / offline errors to an actionable store connectivity message', () => {
    const r = interpretPurchaseError({
      code: Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR,
      message: 'Error performing request.',
    });
    expect(r.outcome).toBe('error');
    if (r.outcome === 'error') {
      expect(r.message).toContain('Media & Purchases');
      expect(r.message).not.toContain('Network error talking to the App Store');
    }
  });

  it('maps product request timeout to a retry-friendly message', () => {
    const r = interpretPurchaseError({
      code: Purchases.PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR,
      message: 'Timeout',
    });
    expect(r.outcome).toBe('error');
    if (r.outcome === 'error') {
      expect(r.message.toLowerCase()).toContain('too long');
    }
  });
});

describe('isTransientPurchasesTransportError', () => {
  it('is true for network, offline, and product-timeout codes', () => {
    expect(
      isTransientPurchasesTransportError({
        code: Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'x',
      }),
    ).toBe(true);
    expect(
      isTransientPurchasesTransportError({
        code: Purchases.PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR,
        message: 'x',
      }),
    ).toBe(true);
    expect(
      isTransientPurchasesTransportError({
        code: Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
        message: 'x',
      }),
    ).toBe(false);
  });
});
