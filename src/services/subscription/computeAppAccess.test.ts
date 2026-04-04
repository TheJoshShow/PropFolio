import { describe, expect, it } from 'vitest';

import { computeAppAccess } from './computeAppAccess';
import type { CustomerInfoSummary } from '@/services/revenuecat/types';
import type { UserSubscriptionStatusRow } from './serverSubscriptionTypes';

const RC_ENTITLEMENT = 'propfolio_pro';

function store(
  partial: Partial<CustomerInfoSummary> & Pick<CustomerInfoSummary, 'status'>,
): CustomerInfoSummary {
  return {
    activeEntitlements: [],
    managementURL: null,
    ...partial,
  };
}

function row(partial: Partial<UserSubscriptionStatusRow>): UserSubscriptionStatusRow {
  return {
    user_id: 'u1',
    entitlement_active: false,
    entitlement_source: null,
    billing_issue_detected: false,
    product_id: null,
    trial_start_at: null,
    trial_end_at: null,
    current_period_end: null,
    expires_at: null,
    will_renew: null,
    updated_at: new Date().toISOString(),
    ...partial,
  };
}

describe('computeAppAccess', () => {
  it('returns loading until hydrated', () => {
    const r = computeAppAccess({
      accessHydrated: false,
      serverRow: null,
      storeSummary: store({ status: 'active', activeEntitlements: [RC_ENTITLEMENT] }),
      serverFetchFailed: false,
    });
    expect(r).toEqual({ hasAppAccess: false, displayState: 'loading' });
  });

  it('allows when server entitlement_active', () => {
    const r = computeAppAccess({
      accessHydrated: true,
      serverRow: row({ entitlement_active: true }),
      storeSummary: store({ status: 'not_subscribed', activeEntitlements: [] }),
      serverFetchFailed: false,
    });
    expect(r.hasAppAccess).toBe(true);
    expect(r.displayState).toBe('active_paid');
  });

  it('allows store-only when no server row (webhook lag)', () => {
    const r = computeAppAccess({
      accessHydrated: true,
      serverRow: null,
      storeSummary: store({ status: 'active', activeEntitlements: [RC_ENTITLEMENT] }),
      serverFetchFailed: false,
    });
    expect(r.hasAppAccess).toBe(true);
  });

  it('denies store when server row says inactive (server wins)', () => {
    const r = computeAppAccess({
      accessHydrated: true,
      serverRow: row({ entitlement_active: false }),
      storeSummary: store({ status: 'active', activeEntitlements: [RC_ENTITLEMENT] }),
      serverFetchFailed: false,
    });
    expect(r.hasAppAccess).toBe(false);
    expect(r.displayState).toBe('expired');
  });

  it('flags active_trial from store period type', () => {
    const r = computeAppAccess({
      accessHydrated: true,
      serverRow: row({ entitlement_active: true }),
      storeSummary: store({
        status: 'active',
        activeEntitlements: [RC_ENTITLEMENT],
        subscriptionPeriodType: 'TRIAL',
      }),
      serverFetchFailed: false,
    });
    expect(r.hasAppAccess).toBe(true);
    expect(r.displayState).toBe('active_trial');
  });

  it('flags grace_period from store', () => {
    const r = computeAppAccess({
      accessHydrated: true,
      serverRow: row({ entitlement_active: true }),
      storeSummary: store({ status: 'grace_period', activeEntitlements: [RC_ENTITLEMENT] }),
      serverFetchFailed: false,
    });
    expect(r.hasAppAccess).toBe(true);
    expect(r.displayState).toBe('grace_period');
  });

  it('unknown when server fetch failed and store unknown', () => {
    const r = computeAppAccess({
      accessHydrated: true,
      serverRow: null,
      storeSummary: store({ status: 'unknown' }),
      serverFetchFailed: true,
    });
    expect(r.hasAppAccess).toBe(false);
    expect(r.displayState).toBe('unknown');
  });

  it('billing_issue when server marks billing issue and inactive', () => {
    const r = computeAppAccess({
      accessHydrated: true,
      serverRow: row({ entitlement_active: false, billing_issue_detected: true }),
      storeSummary: store({ status: 'not_subscribed', activeEntitlements: [] }),
      serverFetchFailed: false,
    });
    expect(r.hasAppAccess).toBe(false);
    expect(r.displayState).toBe('billing_issue');
  });
});
