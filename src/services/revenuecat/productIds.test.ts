import { describe, expect, it } from 'vitest';

import { inferCreditPackSizeFromProductId, STORE_PRODUCT_IDS } from './productIds';

describe('inferCreditPackSizeFromProductId', () => {
  it('returns known ids from CREDITS_PER_STORE_PRODUCT', () => {
    expect(inferCreditPackSizeFromProductId(STORE_PRODUCT_IDS.credits1)).toBe(1);
    expect(inferCreditPackSizeFromProductId(STORE_PRODUCT_IDS.credits5)).toBe(5);
  });

  it('infers from credits.N suffix pattern', () => {
    expect(inferCreditPackSizeFromProductId('com.vendor.credits.20')).toBe(20);
    expect(inferCreditPackSizeFromProductId('x.credits_5')).toBe(5);
  });

  it('returns null for unknown sizes', () => {
    expect(inferCreditPackSizeFromProductId('com.propfolio.credits.99')).toBeNull();
    expect(inferCreditPackSizeFromProductId('random')).toBeNull();
  });
});
