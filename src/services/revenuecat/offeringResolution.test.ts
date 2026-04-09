import { describe, expect, it } from 'vitest';

import { pickCreditsOffering, pickSubscriptionOffering } from './offeringResolution';

function pkg(
  storeId: string,
  packageType: string = 'CUSTOM',
): { identifier: string; packageType: string; product: { identifier: string } } {
  return {
    identifier: `pkg_${storeId}`,
    packageType,
    product: { identifier: storeId },
  };
}

describe('pickSubscriptionOffering', () => {
  it('uses configured offering id when present', () => {
    const o = {
      identifier: 'propfolio_subscription',
      availablePackages: [pkg('com.propfolio.subscription.monthly', 'MONTHLY')],
    };
    const r = pickSubscriptionOffering(
      { all: { propfolio_subscription: o as never }, current: null },
      'propfolio_subscription',
    );
    expect(r.offering).toBe(o);
    expect(r.reason).toBe('configured_subscription_offering_id');
  });

  it('does not use current when id differs and current is credits-only', () => {
    const credits = {
      identifier: 'propfolio_credits',
      availablePackages: [pkg('com.propfolio.credits.5')],
    };
    const r = pickSubscriptionOffering(
      {
        all: { propfolio_credits: credits as never },
        current: credits as never,
      },
      'propfolio_subscription',
    );
    expect(r.offering).toBeNull();
    expect(r.reason).toBe('not_found');
  });

  it('finds offering by monthly App Store product id when offering id mismatches', () => {
    const wrongId = {
      identifier: 'default',
      availablePackages: [pkg('com.propfolio.subscription.monthly', 'MONTHLY')],
    };
    const r = pickSubscriptionOffering(
      { all: { default: wrongId as never }, current: null },
      'propfolio_subscription',
    );
    expect(r.offering).toBe(wrongId);
    expect(r.reason).toBe('scanned_monthly_store_product');
  });
});

describe('pickCreditsOffering', () => {
  it('uses configured credits offering id', () => {
    const o = {
      identifier: 'propfolio_credits',
      availablePackages: [pkg('com.propfolio.credits.1')],
    };
    const r = pickCreditsOffering(
      { all: { propfolio_credits: o as never }, current: null },
      'propfolio_credits',
    );
    expect(r.offering).toBe(o);
    expect(r.reason).toBe('configured_credits_offering_id');
  });

  it('scans for consumable SKU when id mismatches', () => {
    const packs = {
      identifier: 'extras',
      availablePackages: [pkg('com.propfolio.credits.10')],
    };
    const r = pickCreditsOffering({ all: { extras: packs as never }, current: null }, 'propfolio_credits');
    expect(r.offering).toBe(packs);
    expect(r.reason).toBe('scanned_credit_store_product');
  });
});
