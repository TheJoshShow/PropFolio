import { describe, expect, it } from 'vitest';

import type { PaywallCatalog } from '@/services/revenuecat/types';

import { creditPackPurchasesAllowed, resolvePaywallBillingState } from './paywallBillingResolution';

function baseCatalog(over: Partial<PaywallCatalog>): PaywallCatalog {
  return {
    sdkConfigured: true,
    sdkMessage: null,
    loadPhase: 'ok',
    loadMessage: null,
    devDetail: null,
    revenueCatCurrentOfferingId: 'x',
    revenueCatAllOfferingIds: ['x'],
    subscriptionOfferingId: 'propfolio_subscription',
    subscriptionOfferingFound: true,
    subscriptionPackages: [{ refKey: 'a', storeProductId: 'com.propfolio.subscription.monthly' } as PaywallCatalog['subscriptionPackages'][0]],
    creditsOfferingId: 'propfolio_credits',
    creditsOfferingFound: true,
    creditPackages: [],
    ...over,
  };
}

describe('resolvePaywallBillingState', () => {
  it('returns loading hint when catalog loading and no catalog', () => {
    const r = resolvePaywallBillingState({
      envBlock: { ok: true },
      catalog: null,
      catalogLoading: true,
      isPremium: false,
    });
    expect(r.reason).toBe('NONE');
    expect(r.purchaseActionHint).toContain('Loading');
    expect(r.canUseRestorePurchases).toBe(false);
  });

  it('maps Expo Go block', () => {
    const r = resolvePaywallBillingState({
      envBlock: { ok: false, message: 'x', reasonCode: 'expo_go' },
      catalog: null,
      catalogLoading: false,
      isPremium: false,
    });
    expect(r.reason).toBe('EXPO_GO_UNSUPPORTED');
    expect(r.userTitle).toContain('Install');
    expect(r.canPurchaseSubscription).toBe(false);
  });

  it('maps secret key block', () => {
    const r = resolvePaywallBillingState({
      envBlock: { ok: false, message: 'x', reasonCode: 'secret_key' },
      catalog: null,
      catalogLoading: false,
      isPremium: false,
    });
    expect(r.reason).toBe('SECRET_KEY_ON_CLIENT');
  });

  it('maps rc_offerings_empty', () => {
    const c = baseCatalog({
      loadPhase: 'rc_offerings_empty',
      loadMessage: 'technical',
      subscriptionPackages: [],
    });
    const r = resolvePaywallBillingState({
      envBlock: { ok: true },
      catalog: c,
      catalogLoading: false,
      isPremium: false,
    });
    expect(r.reason).toBe('OFFERINGS_EMPTY');
    expect(r.userTitle).toContain('ready');
  });

  it('maps subscription_product_mismatch', () => {
    const c = baseCatalog({
      loadPhase: 'subscription_product_mismatch',
      loadMessage: 'technical',
      subscriptionPackages: [],
    });
    const r = resolvePaywallBillingState({
      envBlock: { ok: true },
      catalog: c,
      catalogLoading: false,
      isPremium: false,
    });
    expect(r.reason).toBe('ENTITLEMENT_CONFIG_ERROR');
  });

  it('allows subscription when ok and packages present', () => {
    const c = baseCatalog({});
    const r = resolvePaywallBillingState({
      envBlock: { ok: true },
      catalog: c,
      catalogLoading: false,
      isPremium: false,
    });
    expect(r.reason).toBe('NONE');
    expect(r.canPurchaseSubscription).toBe(true);
    expect(r.canUseRestorePurchases).toBe(true);
  });

  it('suppresses subscribe when premium', () => {
    const c = baseCatalog({});
    const r = resolvePaywallBillingState({
      envBlock: { ok: true },
      catalog: c,
      catalogLoading: false,
      isPremium: true,
    });
    expect(r.canPurchaseSubscription).toBe(false);
  });
});

describe('creditPackPurchasesAllowed', () => {
  const creditPkg = {
    refKey: 'k',
    offeringIdentifier: 'propfolio_credits',
    packageIdentifier: 'p',
    storeProductId: 'com.propfolio.credits.10',
    title: '10',
    description: '',
    priceString: '$14.99',
    packageType: 'CUSTOM',
    creditsQuantity: 10,
  } satisfies PaywallCatalog['creditPackages'][0];

  it('is false when subscription_product_mismatch and not premium', () => {
    const c = baseCatalog({
      loadPhase: 'subscription_product_mismatch',
      loadMessage: 'x',
      subscriptionPackages: [],
      creditPackages: [creditPkg],
    });
    expect(
      creditPackPurchasesAllowed({
        envBlock: { ok: true },
        catalog: c,
        catalogLoading: false,
        isPremium: false,
      }),
    ).toBe(false);
  });

  it('is true for premium when credits loaded despite subscription_product_mismatch', () => {
    const c = baseCatalog({
      loadPhase: 'subscription_product_mismatch',
      loadMessage: 'x',
      subscriptionPackages: [],
      creditPackages: [creditPkg],
    });
    expect(
      creditPackPurchasesAllowed({
        envBlock: { ok: true },
        catalog: c,
        catalogLoading: false,
        isPremium: true,
      }),
    ).toBe(true);
  });

  it('is false when loadPhase is rc_offerings_empty even if premium', () => {
    const c = baseCatalog({
      loadPhase: 'rc_offerings_empty',
      loadMessage: 'x',
      subscriptionPackages: [],
      creditPackages: [],
    });
    expect(
      creditPackPurchasesAllowed({
        envBlock: { ok: true },
        catalog: c,
        catalogLoading: false,
        isPremium: true,
      }),
    ).toBe(false);
  });
});
