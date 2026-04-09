import { describe, expect, it } from 'vitest';

import { RC_ENTITLEMENT_PRO } from '@/services/revenuecat/productIds';
import type { CustomerInfoSummary } from '@/services/revenuecat/types';

import { hasPremiumAccess, subscriptionTierLabel } from './entitlementLogic';

describe('hasPremiumAccess', () => {
  it('is true when premium entitlement present', () => {
    const s: CustomerInfoSummary = {
      status: 'not_subscribed',
      activeEntitlements: [RC_ENTITLEMENT_PRO],
    };
    expect(hasPremiumAccess(s)).toBe(true);
  });

  it('is false when free and no entitlements', () => {
    const s: CustomerInfoSummary = { status: 'not_subscribed', activeEntitlements: [] };
    expect(hasPremiumAccess(s)).toBe(false);
  });

  it('is false when status active but entitlements not yet mapped', () => {
    const s: CustomerInfoSummary = { status: 'active', activeEntitlements: [] };
    expect(hasPremiumAccess(s)).toBe(false);
  });

  it('is false when only non-pro entitlements are active (e.g. misconfigured consumable)', () => {
    const s: CustomerInfoSummary = { status: 'not_subscribed', activeEntitlements: ['credits_only'] };
    expect(hasPremiumAccess(s)).toBe(false);
  });

  it('is true in grace period when pro entitlement is listed', () => {
    const s: CustomerInfoSummary = {
      status: 'grace_period',
      activeEntitlements: [RC_ENTITLEMENT_PRO],
    };
    expect(hasPremiumAccess(s)).toBe(true);
  });
});

describe('subscriptionTierLabel', () => {
  it('returns Pro when entitled', () => {
    const s: CustomerInfoSummary = {
      status: 'active',
      activeEntitlements: [RC_ENTITLEMENT_PRO],
    };
    expect(subscriptionTierLabel(s)).toBe('PropFolio member');
  });
});
