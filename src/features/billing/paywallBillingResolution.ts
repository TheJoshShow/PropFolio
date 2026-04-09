/**
 * Single place to classify paywall / store billing failures for calm UI + structured dev logs.
 */

import { PROP_FOLIO_PAYWALL_BILLING_LOG_TAG } from '@/services/revenuecat/billingLogTags';
import type { PaywallCatalog, PaywallCatalogLoadPhase } from '@/services/revenuecat/types';
import type { RevenueCatEnvironmentBlockState } from '@/services/revenuecat/revenueCatService';

export type BillingUnavailableReason =
  | 'NONE'
  | 'MISSING_PUBLIC_KEY'
  | 'SECRET_KEY_ON_CLIENT'
  | 'EXPO_GO_UNSUPPORTED'
  | 'NON_NATIVE_BUILD'
  | 'REVENUECAT_INIT_FAILED'
  | 'OFFERINGS_EMPTY'
  | 'PACKAGE_MISSING'
  | 'APPLE_PRODUCTS_NOT_READY'
  | 'ENTITLEMENT_CONFIG_ERROR'
  | 'UNKNOWN';

export type PaywallBillingResolution = {
  reason: BillingUnavailableReason;
  /** Primary user-facing headline when reason !== NONE */
  userTitle: string;
  /** Single explanatory paragraph (no stack traces, no env var names). */
  userBody: string;
  /** Optional note when membership products work but credit packs are not wired. */
  supplementaryHint: string | null;
  canPurchaseSubscription: boolean;
  /** StoreKit catalog usable for purchases (subscription and/or credits). */
  storeCatalogReachable: boolean;
  canUseRestorePurchases: boolean;
  /** Shown near disabled Subscribe / store purchase actions. */
  purchaseActionHint: string | null;
  /** Shown near Restore when the action is disabled (Expo Go, SDK not started, etc.). */
  restoreDisabledExplanation: string | null;
  /** Dev-only payload; log with `logPaywallBillingDeveloperDiagnostics`. */
  developerDiagnostics: Record<string, unknown>;
};

const CALM = {
  NONE: { title: '', body: '' },
  MISSING_PUBLIC_KEY: {
    title: 'Billing isn’t configured',
    body: 'This build can’t connect to Apple’s billing service yet. Once your team adds the correct public billing key and ships an update, you can subscribe here.',
  },
  SECRET_KEY_ON_CLIENT: {
    title: 'This build can’t use checkout',
    body: 'The app is using the wrong type of billing key. Your developer should switch to the public App Store key from RevenueCat, then rebuild. This isn’t something you can fix in the app.',
  },
  EXPO_GO_UNSUPPORTED: {
    title: 'Install the PropFolio app',
    body: 'Preview mode (Expo Go) can’t load App Store subscriptions. Install the development or TestFlight build to subscribe or restore purchases.',
  },
  NON_NATIVE_BUILD: {
    title: 'Use the mobile app',
    body: 'Membership is purchased through the PropFolio iOS or Android app. Open the app on your phone to subscribe or restore purchases.',
  },
  REVENUECAT_INIT_FAILED: {
    title: 'Billing didn’t start',
    body: 'We couldn’t start Apple’s purchase service on this device. Try again in a moment, update the app, or contact support if it keeps happening.',
  },
  OFFERINGS_EMPTY: {
    title: 'Store isn’t ready yet',
    body: 'The subscription isn’t visible from the store yet. Your team needs to publish products and offerings in App Store Connect and RevenueCat. Pull down to refresh after they’re live.',
  },
  PACKAGE_MISSING: {
    title: 'Membership isn’t listed',
    body: 'Apple didn’t return a membership product for this app version. Your team should check App Store Connect and RevenueCat, then try again after an update.',
  },
  ENTITLEMENT_CONFIG_ERROR: {
    title: 'Store configuration mismatch',
    body: 'The membership product from Apple doesn’t match what this app expects. Your team should align product IDs in App Store Connect and RevenueCat, then ship an update.',
  },
  APPLE_PRODUCTS_NOT_READY: {
    title: 'Can’t reach the App Store',
    body: 'We couldn’t load products from Apple. Check your connection, try again shortly, or switch to Wi‑Fi.',
  },
  UNKNOWN: {
    title: 'Billing unavailable',
    body: 'Something prevented us from loading subscription options. Try again later, or use Restore purchases if you already subscribed.',
  },
} as const;

function envBlockToReason(block: Extract<RevenueCatEnvironmentBlockState, { ok: false }>): BillingUnavailableReason {
  switch (block.reasonCode) {
    case 'expo_go':
      return 'EXPO_GO_UNSUPPORTED';
    case 'non_native_platform':
      return 'NON_NATIVE_BUILD';
    case 'missing':
      return 'MISSING_PUBLIC_KEY';
    case 'secret_key':
      return 'SECRET_KEY_ON_CLIENT';
    default:
      return 'UNKNOWN';
  }
}

function catalogPhaseToReason(phase: PaywallCatalogLoadPhase): BillingUnavailableReason {
  switch (phase) {
    case 'ok':
      return 'NONE';
    case 'expo_go_unsupported':
      return 'EXPO_GO_UNSUPPORTED';
    case 'unsupported_platform':
      return 'NON_NATIVE_BUILD';
    case 'missing_api_key':
      return 'MISSING_PUBLIC_KEY';
    case 'invalid_api_key':
      return 'UNKNOWN';
    case 'sdk_init_failed':
      return 'REVENUECAT_INIT_FAILED';
    case 'rc_offerings_empty':
      return 'OFFERINGS_EMPTY';
    case 'subscription_offering_missing':
    case 'subscription_packages_empty':
      return 'PACKAGE_MISSING';
    case 'subscription_product_mismatch':
      return 'ENTITLEMENT_CONFIG_ERROR';
    case 'offerings_fetch_failed':
      return 'APPLE_PRODUCTS_NOT_READY';
    default:
      return 'UNKNOWN';
  }
}

function calmCopy(reason: BillingUnavailableReason): { title: string; body: string } {
  if (reason === 'NONE') {
    return { title: CALM.NONE.title, body: CALM.NONE.body };
  }
  return CALM[reason];
}

/** `invalid_api_key` catalog: devDetail is `code=<RevenueCatKeyValidationFailureCode>` from `loadPaywallCatalog`. */
function invalidApiKeyCatalogReason(catalog: PaywallCatalog): BillingUnavailableReason {
  const codeMatch = catalog.devDetail?.match(/code=([\w_]+)/);
  const code = codeMatch?.[1];
  if (code === 'secret_key') {
    return 'SECRET_KEY_ON_CLIENT';
  }
  if (code === 'missing') {
    return 'MISSING_PUBLIC_KEY';
  }
  const msg = `${catalog.loadMessage ?? ''}`.toLowerCase();
  if (msg.includes('secret') && msg.includes('key')) {
    return 'SECRET_KEY_ON_CLIENT';
  }
  if (msg.includes('missing')) {
    return 'MISSING_PUBLIC_KEY';
  }
  return 'UNKNOWN';
}

export function logPaywallBillingDeveloperDiagnostics(resolution: PaywallBillingResolution, context?: string): void {
  if (!__DEV__) {
    return;
  }
  const payload = {
    context: context ?? 'paywall',
    reason: resolution.reason,
    ...resolution.developerDiagnostics,
  };
  console.log(PROP_FOLIO_PAYWALL_BILLING_LOG_TAG, JSON.stringify(payload, null, 2));
}

export type ResolvePaywallBillingArgs = {
  envBlock: RevenueCatEnvironmentBlockState;
  catalog: PaywallCatalog | null;
  catalogLoading: boolean;
  isPremium: boolean;
};

function buildDeveloperBase(args: {
  catalog: PaywallCatalog | null;
  catalogLoading: boolean;
  isPremium: boolean;
}): Record<string, unknown> {
  const { catalog, catalogLoading, isPremium } = args;
  return {
    catalogLoading,
    isPremium,
    catalogLoadPhase: catalog?.loadPhase ?? null,
    rawCatalogMessage: catalog?.loadMessage ?? catalog?.sdkMessage ?? null,
    catalogDevDetail: catalog?.devDetail ?? null,
    revenueCatOfferingIds: catalog?.revenueCatAllOfferingIds ?? null,
    subscriptionPackageCount: catalog?.subscriptionPackages.length ?? 0,
    creditPackageCount: catalog?.creditPackages.length ?? 0,
    creditsOfferingFound: catalog?.creditsOfferingFound ?? null,
    sdkConfigured: catalog?.sdkConfigured ?? null,
  };
}

/**
 * Prefer environment/SDK gate first, then catalog load phase. When still loading, avoid alarming copy.
 */
export function resolvePaywallBillingState(args: ResolvePaywallBillingArgs): PaywallBillingResolution {
  const { envBlock, catalog, catalogLoading, isPremium } = args;
  const baseDiag = () => buildDeveloperBase({ catalog, catalogLoading, isPremium });

  if (catalogLoading && !catalog) {
    return {
      reason: 'NONE',
      userTitle: '',
      userBody: '',
      supplementaryHint: null,
      canPurchaseSubscription: false,
      storeCatalogReachable: false,
      canUseRestorePurchases: false,
      purchaseActionHint: 'Loading subscription options…',
      restoreDisabledExplanation: 'Restore becomes available after subscription options finish loading.',
      developerDiagnostics: { ...baseDiag(), gate: 'catalog_loading' },
    };
  }

  if (!envBlock.ok) {
    const reason = envBlockToReason(envBlock);
    const calm = calmCopy(reason);
    return {
      reason,
      userTitle: calm.title,
      userBody: calm.body,
      supplementaryHint: null,
      canPurchaseSubscription: false,
      storeCatalogReachable: false,
      canUseRestorePurchases: false,
      purchaseActionHint: null,
      restoreDisabledExplanation: calm.body,
      developerDiagnostics: {
        ...baseDiag(),
        gate: 'environment_block',
        envReasonCode: envBlock.reasonCode,
        envTechnicalMessage: envBlock.message,
      },
    };
  }

  if (!catalog) {
    const calm = calmCopy('UNKNOWN');
    return {
      reason: 'UNKNOWN',
      userTitle: calm.title,
      userBody: calm.body,
      supplementaryHint: null,
      canPurchaseSubscription: false,
      storeCatalogReachable: false,
      canUseRestorePurchases: false,
      purchaseActionHint: null,
      restoreDisabledExplanation: calm.body,
      developerDiagnostics: { ...baseDiag(), gate: 'catalog_null' },
    };
  }

  if (catalog.loadPhase !== 'ok') {
    const reason =
      catalog.loadPhase === 'invalid_api_key'
        ? invalidApiKeyCatalogReason(catalog)
        : catalogPhaseToReason(catalog.loadPhase);
    const calm = calmCopy(reason);
    const sdkReady = catalog.sdkConfigured === true;
    const canRestore =
      sdkReady &&
      catalog.loadPhase !== 'sdk_init_failed' &&
      catalog.loadPhase !== 'invalid_api_key' &&
      catalog.loadPhase !== 'missing_api_key';

    return {
      reason,
      userTitle: calm.title,
      userBody: calm.body,
      supplementaryHint: null,
      canPurchaseSubscription: false,
      storeCatalogReachable: sdkReady,
      canUseRestorePurchases: canRestore,
      purchaseActionHint: null,
      restoreDisabledExplanation: canRestore
        ? null
        : calm.body,
      developerDiagnostics: {
        ...baseDiag(),
        gate: 'catalog_phase',
        catalogLoadPhase: catalog.loadPhase,
      },
    };
  }

  const subPackages = catalog.subscriptionPackages.length;
  if (!isPremium && subPackages === 0) {
    const calm = calmCopy('PACKAGE_MISSING');
    return {
      reason: 'PACKAGE_MISSING',
      userTitle: calm.title,
      userBody: calm.body,
      supplementaryHint: null,
      canPurchaseSubscription: false,
      storeCatalogReachable: true,
      canUseRestorePurchases: true,
      purchaseActionHint: null,
      restoreDisabledExplanation: null,
      developerDiagnostics: { ...baseDiag(), gate: 'ok_but_zero_subscription_packages' },
    };
  }

  const canSub = !isPremium && subPackages > 0;

  const supplementaryHint =
    !catalog.creditsOfferingFound
      ? 'Import credit packs aren’t available from the store in this build yet. Membership is separate; credits never unlock the app by themselves.'
      : catalog.creditPackages.length === 0
        ? 'Credit packs are not attached in the store configuration yet. Membership is still available when shown above.'
        : null;

  return {
    reason: 'NONE',
    userTitle: '',
    userBody: '',
    supplementaryHint,
    canPurchaseSubscription: canSub,
    storeCatalogReachable: true,
    canUseRestorePurchases: true,
    purchaseActionHint: !canSub && !isPremium ? 'Subscription options are not available from Apple right now.' : null,
    restoreDisabledExplanation: null,
    developerDiagnostics: { ...baseDiag(), gate: 'ok' },
  };
}

/**
 * `loadPhase !== 'ok'` (e.g. subscription offering product mismatch) sets `resolvePaywallBillingState` to a
 * non-NONE reason, which incorrectly disabled **credit** purchases for members who already have access.
 * Credit top-up should allow IAP when consumable packages loaded and the failure is subscription-catalog only.
 */
const SUBSCRIPTION_CATALOG_ISSUE_PHASES: ReadonlySet<PaywallCatalogLoadPhase> = new Set([
  'subscription_offering_missing',
  'subscription_packages_empty',
  'subscription_product_mismatch',
]);

export function creditPackPurchasesAllowed(args: ResolvePaywallBillingArgs): boolean {
  const { envBlock, catalog, catalogLoading, isPremium } = args;
  if (!isPremium || !envBlock.ok) {
    return false;
  }
  if (catalogLoading && !catalog) {
    return false;
  }
  if (!catalog || catalog.sdkConfigured !== true) {
    return false;
  }
  if (catalog.creditPackages.length === 0) {
    return false;
  }
  if (catalog.loadPhase === 'ok') {
    return true;
  }
  return SUBSCRIPTION_CATALOG_ISSUE_PHASES.has(catalog.loadPhase);
}
