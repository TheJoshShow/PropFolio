import { patchBillingDiagnosticsRc } from './billingDiagnosticsStore';
import type { PaywallCatalog } from '@/services/revenuecat/types';

const PRE_OFFERINGS_PHASES: PaywallCatalog['loadPhase'][] = [
  'unsupported_platform',
  'expo_go_unsupported',
  'invalid_api_key',
  'sdk_init_failed',
];

/**
 * Maps latest paywall catalog load into diagnostics (offerings + package counts).
 */
export function applyPaywallCatalogDiagnostics(catalog: PaywallCatalog): void {
  const beforeOfferings = PRE_OFFERINGS_PHASES.includes(catalog.loadPhase);
  let offeringsFetchStatus: 'not_attempted' | 'ok' | 'failed' = 'not_attempted';
  if (!beforeOfferings) {
    offeringsFetchStatus = catalog.loadPhase === 'offerings_fetch_failed' ? 'failed' : 'ok';
  }

  const errMsg = (catalog.loadMessage ?? catalog.sdkMessage)?.trim() ?? null;
  const offeringsError =
    offeringsFetchStatus === 'failed' ? errMsg?.slice(0, 400) ?? 'offerings_fetch_failed' : null;

  patchBillingDiagnosticsRc({
    billing: {
      offeringsFetchStatus,
      offeringsError,
      offeringIdsReturned: [...catalog.revenueCatAllOfferingIds],
      subscriptionPackageCount: catalog.subscriptionPackages.length,
      creditsPackageCount: catalog.creditPackages.length,
      catalogLoadPhase: catalog.loadPhase,
    },
    lastErrors: {
      offerings: offeringsFetchStatus === 'failed' ? offeringsError : null,
    },
  });
}

export function recordCustomerInfoDiagnostics(ok: boolean, errorMessage: string | null): void {
  patchBillingDiagnosticsRc({
    billing: {
      customerInfoFetchStatus: ok ? 'ok' : 'failed',
      customerInfoError: ok ? null : errorMessage?.slice(0, 400) ?? 'failed',
    },
  });
}

export function recordInitializationDiagnostics(errorMessage: string | null): void {
  patchBillingDiagnosticsRc({
    lastErrors: {
      initialization: errorMessage?.slice(0, 400) ?? null,
    },
  });
}

export function recordRestorePurchaseDiagnostics(errorMessage: string | null): void {
  patchBillingDiagnosticsRc({
    lastErrors: {
      restorePurchase: errorMessage?.slice(0, 400) ?? null,
    },
  });
}
