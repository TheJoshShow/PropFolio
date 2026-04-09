/**
 * Single structured shape for internal billing diagnostics (dev tooling).
 * Never store full API keys — only safe summaries (see `summarizeRevenueCatKey`).
 */

export type AppExecutionSurface = 'expo_go' | 'development_build' | 'standalone' | 'bare' | 'unknown';

export type DeviceSurface = 'ios' | 'android' | 'web' | 'other';

/** Best-effort; precise detection may require native metadata not always exposed in JS. */
export type PhysicalDeviceHint = 'likely_physical' | 'likely_simulator' | 'unknown';

export type RevenueCatKeyClass = 'appl_public' | 'goog_public' | 'secret_sk' | 'missing' | 'invalid_prefix' | 'unknown';

export type BillingDiagnosticsState = {
  updatedAtIso: string;
  app: {
    executionSurface: AppExecutionSurface;
    deviceSurface: DeviceSurface;
    physicalDeviceHint: PhysicalDeviceHint;
    /** Safe: Expo/React version strings only */
    expoSdkVersion: string | null;
    debugMode: boolean;
  };
  revenueCat: {
    platform: 'ios' | 'android' | 'unsupported';
    apiKeyPresent: boolean;
    /** Prefix + length only, e.g. `appl_… (len=32)` */
    apiKeySummary: string;
    keyClass: RevenueCatKeyClass;
    keyValidationCode: string | null;
    environmentBlocked: boolean;
    environmentBlockReason: string | null;
    purchasesConfigureCompleted: boolean | null;
    purchasesConfigureError: string | null;
  };
  billing: {
    canMakePurchases: boolean;
    /** Human reason when canMakePurchases is false */
    canMakePurchasesReason: string;
    offeringsFetchStatus: 'not_attempted' | 'ok' | 'failed';
    offeringsError: string | null;
    offeringIdsReturned: string[];
    subscriptionPackageCount: number;
    creditsPackageCount: number;
    catalogLoadPhase: string | null;
    customerInfoFetchStatus: 'not_attempted' | 'ok' | 'failed';
    customerInfoError: string | null;
  };
  membership: {
    storeEntitlementActive: boolean;
    entitlementIdentifierExpected: string;
    activeEntitlementIds: string[];
    storeSubscriptionStatus: string;
    serverEntitlementActive: boolean | null;
  };
  credits: {
    walletBalance: number | null;
    signupBonusGranted: number | null;
    monthlyIncludedGranted: number | null;
    canRunImport: boolean | null;
    canPurchaseCreditPacks: boolean | null;
  };
  lastErrors: {
    initialization: string | null;
    offerings: string | null;
    restorePurchase: string | null;
    purchase: string | null;
  };
};

export const BILLING_DIAGNOSTICS_INITIAL: BillingDiagnosticsState = {
  updatedAtIso: '',
  app: {
    executionSurface: 'unknown',
    deviceSurface: 'other',
    physicalDeviceHint: 'unknown',
    expoSdkVersion: null,
    debugMode: false,
  },
  revenueCat: {
    platform: 'unsupported',
    apiKeyPresent: false,
    apiKeySummary: '(empty)',
    keyClass: 'missing',
    keyValidationCode: null,
    environmentBlocked: false,
    environmentBlockReason: null,
    purchasesConfigureCompleted: null,
    purchasesConfigureError: null,
  },
  billing: {
    canMakePurchases: false,
    canMakePurchasesReason: 'Not evaluated',
    offeringsFetchStatus: 'not_attempted',
    offeringsError: null,
    offeringIdsReturned: [],
    subscriptionPackageCount: 0,
    creditsPackageCount: 0,
    catalogLoadPhase: null,
    customerInfoFetchStatus: 'not_attempted',
    customerInfoError: null,
  },
  membership: {
    storeEntitlementActive: false,
    entitlementIdentifierExpected: 'propfolio_pro',
    activeEntitlementIds: [],
    storeSubscriptionStatus: 'unknown',
    serverEntitlementActive: null,
  },
  credits: {
    walletBalance: null,
    signupBonusGranted: null,
    monthlyIncludedGranted: null,
    canRunImport: null,
    canPurchaseCreditPacks: null,
  },
  lastErrors: {
    initialization: null,
    offerings: null,
    restorePurchase: null,
    purchase: null,
  },
};
