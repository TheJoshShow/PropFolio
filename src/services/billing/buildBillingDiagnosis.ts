import type { BillingDiagnosticsState } from './billingDiagnosticsTypes';

/**
 * One-line primary diagnosis for dev support (no secrets). Order reflects most common root causes.
 */
export function buildPrimaryBillingDiagnosisString(state: BillingDiagnosticsState): string {
  const { app, revenueCat, billing, membership } = state;

  if (app.executionSurface === 'expo_go') {
    return 'Billing unavailable because the app is running in Expo Go (use a development or TestFlight build).';
  }

  if (revenueCat.platform === 'unsupported') {
    return 'Billing unavailable because this platform is not iOS/Android.';
  }

  if (revenueCat.keyClass === 'secret_sk') {
    return 'Billing unavailable because EXPO_PUBLIC_REVENUECAT_API_KEY_IOS uses a secret (sk_) key — use the public appl_ Apple SDK key from RevenueCat.';
  }

  if (revenueCat.keyClass === 'missing' || revenueCat.keyClass === 'invalid_prefix') {
    return 'Billing unavailable because the RevenueCat public SDK key is missing or invalid for this platform.';
  }

  if (revenueCat.environmentBlocked && revenueCat.environmentBlockReason) {
    return `Billing unavailable: ${revenueCat.environmentBlockReason}`;
  }

  if (revenueCat.purchasesConfigureCompleted !== true) {
    const detail = revenueCat.purchasesConfigureError ?? state.lastErrors.initialization;
    if (detail) {
      return `Billing unavailable because Purchases.configure did not complete: ${detail}`;
    }
    return 'Billing unavailable because Purchases.configure has not completed successfully yet.';
  }

  if (billing.offeringsFetchStatus === 'failed') {
    const detail = billing.offeringsError ?? state.lastErrors.offerings ?? 'unknown error';
    return `Billing unavailable because offerings failed to load: ${detail}`;
  }

  if (
    billing.offeringsFetchStatus === 'ok' &&
    billing.subscriptionPackageCount === 0 &&
    billing.catalogLoadPhase &&
    billing.catalogLoadPhase !== 'ok'
  ) {
    return `Billing partially unavailable: no subscription packages (catalog phase "${billing.catalogLoadPhase}"). Check RevenueCat offerings and App Store product ids.`;
  }

  if (
    billing.offeringsFetchStatus === 'ok' &&
    billing.subscriptionPackageCount === 0 &&
    billing.catalogLoadPhase === 'ok'
  ) {
    return 'Billing initialized, but offerings returned zero subscription packages — check RevenueCat offering and attached products.';
  }

  if (!membership.storeEntitlementActive) {
    return 'Billing initialized, but membership entitlement is inactive (subscribe or restore purchases).';
  }

  if (billing.canMakePurchases) {
    return 'Billing looks healthy: SDK configured, offerings loaded, membership entitlement active.';
  }

  return billing.canMakePurchasesReason;
}
