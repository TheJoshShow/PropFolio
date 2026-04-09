import { describe, expect, it } from 'vitest';

import { buildPrimaryBillingDiagnosisString } from './buildBillingDiagnosis';
import { BILLING_DIAGNOSTICS_INITIAL, type BillingDiagnosticsState } from './billingDiagnosticsTypes';

/** Shallow partial at each nested slice (tests only). */
type BillingDiagnosticsPatch = {
  [K in keyof BillingDiagnosticsState]?: BillingDiagnosticsState[K] extends object
    ? Partial<BillingDiagnosticsState[K]>
    : BillingDiagnosticsState[K];
};

function base(over: BillingDiagnosticsPatch): BillingDiagnosticsState {
  return {
    ...BILLING_DIAGNOSTICS_INITIAL,
    ...over,
    app: { ...BILLING_DIAGNOSTICS_INITIAL.app, ...over.app },
    revenueCat: { ...BILLING_DIAGNOSTICS_INITIAL.revenueCat, ...over.revenueCat },
    billing: { ...BILLING_DIAGNOSTICS_INITIAL.billing, ...over.billing },
    membership: { ...BILLING_DIAGNOSTICS_INITIAL.membership, ...over.membership },
    credits: { ...BILLING_DIAGNOSTICS_INITIAL.credits, ...over.credits },
    lastErrors: { ...BILLING_DIAGNOSTICS_INITIAL.lastErrors, ...over.lastErrors },
    updatedAtIso: new Date().toISOString(),
  };
}

describe('buildPrimaryBillingDiagnosisString', () => {
  it('detects Expo Go', () => {
    const s = base({ app: { executionSurface: 'expo_go' } });
    expect(buildPrimaryBillingDiagnosisString(s)).toContain('Expo Go');
  });

  it('detects secret sk_ key', () => {
    const s = base({ revenueCat: { keyClass: 'secret_sk', platform: 'ios' } });
    expect(buildPrimaryBillingDiagnosisString(s)).toContain('sk_');
  });

  it('detects offerings failure', () => {
    const s = base({
      revenueCat: {
        platform: 'ios',
        keyClass: 'appl_public',
        environmentBlocked: false,
        purchasesConfigureCompleted: true,
        purchasesConfigureError: null,
      },
      billing: {
        offeringsFetchStatus: 'failed',
        offeringsError: 'network',
        canMakePurchases: false,
        canMakePurchasesReason: '',
      },
    });
    expect(buildPrimaryBillingDiagnosisString(s)).toContain('offerings failed');
  });

  it('detects inactive entitlement when billing healthy', () => {
    const s = base({
      revenueCat: {
        platform: 'ios',
        keyClass: 'appl_public',
        environmentBlocked: false,
        purchasesConfigureCompleted: true,
        purchasesConfigureError: null,
      },
      billing: {
        offeringsFetchStatus: 'ok',
        subscriptionPackageCount: 1,
        catalogLoadPhase: 'ok',
        canMakePurchases: true,
        canMakePurchasesReason: 'ok',
      },
      membership: { storeEntitlementActive: false },
    });
    expect(buildPrimaryBillingDiagnosisString(s)).toContain('inactive');
  });
});
