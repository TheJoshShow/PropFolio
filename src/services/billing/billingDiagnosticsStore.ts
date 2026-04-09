import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { env } from '@/config';
import { getRevenueCatConfigureSnapshot } from '@/services/revenuecat/revenueCatConfigureSnapshot';
import {
  summarizeRevenueCatKey,
  validateRevenueCatPublicKey,
  type RevenueCatKeyValidationFailureCode,
} from '@/services/revenuecat/revenueCatKeyValidation';
import { RC_ENTITLEMENT_PRO } from '@/services/revenuecat/productIds';

import {
  BILLING_DIAGNOSTICS_INITIAL,
  type AppExecutionSurface,
  type BillingDiagnosticsState,
  type DeviceSurface,
  type PhysicalDeviceHint,
  type RevenueCatKeyClass,
} from './billingDiagnosticsTypes';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

export function subscribeBillingDiagnostics(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** RC / catalog / error events (updated from `revenueCatService` + sync helpers). */
let volatileRc: {
  billing?: Partial<BillingDiagnosticsState['billing']>;
  lastErrors?: Partial<BillingDiagnosticsState['lastErrors']>;
} = {};

/** Subscription + wallet snapshot (updated from `SubscriptionContext`). */
let volatileSub: {
  membership?: Partial<BillingDiagnosticsState['membership']>;
  credits?: Partial<BillingDiagnosticsState['credits']>;
  lastErrors?: Partial<BillingDiagnosticsState['lastErrors']>;
} = {};

export function patchBillingDiagnosticsRc(input: typeof volatileRc): void {
  volatileRc = {
    billing: { ...volatileRc.billing, ...input.billing },
    lastErrors: { ...volatileRc.lastErrors, ...input.lastErrors },
  };
  notify();
}

export function patchBillingDiagnosticsSub(input: typeof volatileSub): void {
  volatileSub = {
    membership: { ...volatileSub.membership, ...input.membership },
    credits: { ...volatileSub.credits, ...input.credits },
    lastErrors: { ...volatileSub.lastErrors, ...input.lastErrors },
  };
  notify();
}

export function clearVolatileBillingDiagnostics(): void {
  volatileRc = {};
  volatileSub = {};
  notify();
}

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function executionSurface(): AppExecutionSurface {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return 'expo_go';
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.Standalone) {
    return __DEV__ ? 'development_build' : 'standalone';
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.Bare) {
    return 'bare';
  }
  return 'unknown';
}

function deviceSurface(): DeviceSurface {
  if (Platform.OS === 'ios') {
    return 'ios';
  }
  if (Platform.OS === 'android') {
    return 'android';
  }
  if (Platform.OS === 'web') {
    return 'web';
  }
  return 'other';
}

function physicalDeviceHint(): PhysicalDeviceHint {
  const constants = Platform.constants as Record<string, unknown> | undefined;
  if (constants && typeof constants.isTesting === 'boolean' && constants.isTesting) {
    return 'likely_simulator';
  }
  if (Platform.OS === 'android') {
    const fingerprint = String(constants?.Fingerprint ?? '');
    if (fingerprint.includes('generic') || fingerprint.includes('sdk')) {
      return 'likely_simulator';
    }
  }
  return 'unknown';
}

function environmentBlock(): { blocked: boolean; reason: string | null } {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { blocked: true, reason: 'In-app purchases run only on the iOS or Android app.' };
  }
  if (isExpoGo()) {
    return {
      blocked: true,
      reason:
        'Expo Go cannot use App Store billing. Install a development build or TestFlight build to test purchases.',
    };
  }
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const key = platform === 'ios' ? env.revenueCatApiKeyIos : env.revenueCatApiKeyAndroid;
  const v = validateRevenueCatPublicKey(platform, key);
  if (!v.ok) {
    return { blocked: true, reason: v.userMessage };
  }
  return { blocked: false, reason: null };
}

function classifyKey(
  platform: 'ios' | 'android',
  key: string,
): { summary: string; keyClass: RevenueCatKeyClass; validationCode: RevenueCatKeyValidationFailureCode | null } {
  const summary = summarizeRevenueCatKey(key);
  const v = validateRevenueCatPublicKey(platform, key);
  if (!v.ok) {
    let keyClass: RevenueCatKeyClass = 'invalid_prefix';
    if (v.code === 'missing') {
      keyClass = 'missing';
    } else if (v.code === 'secret_key') {
      keyClass = 'secret_sk';
    }
    return { summary, keyClass, validationCode: v.code };
  }
  if (platform === 'ios') {
    return { summary, keyClass: 'appl_public', validationCode: null };
  }
  return { summary, keyClass: 'goog_public', validationCode: null };
}

function buildRevenueCatSection(): BillingDiagnosticsState['revenueCat'] {
  const native = Platform.OS === 'ios' || Platform.OS === 'android';
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unsupported';
  const keyRaw = platform === 'ios' ? env.revenueCatApiKeyIos : platform === 'android' ? env.revenueCatApiKeyAndroid : '';
  const { summary, keyClass, validationCode } = native
    ? classifyKey(platform === 'ios' ? 'ios' : 'android', keyRaw)
    : { summary: '(n/a)', keyClass: 'missing' as const, validationCode: null };

  const envBlock = native ? environmentBlock() : { blocked: false, reason: null };
  const snap = getRevenueCatConfigureSnapshot();

  return {
    platform,
    apiKeyPresent: Boolean(keyRaw?.trim()),
    apiKeySummary: summary,
    keyClass,
    keyValidationCode: validationCode,
    environmentBlocked: envBlock.blocked,
    environmentBlockReason: envBlock.reason,
    purchasesConfigureCompleted: native ? snap.purchasesSdkConfigured : null,
    purchasesConfigureError: snap.lastPurchasesConfigureError,
  };
}

function buildBillingSection(base: BillingDiagnosticsState['billing']): BillingDiagnosticsState['billing'] {
  const expoGo = isExpoGo();
  const native = Platform.OS === 'ios' || Platform.OS === 'android';
  const rc = buildRevenueCatSection();
  const configured = rc.purchasesConfigureCompleted === true;
  const keyOk = rc.keyClass === 'appl_public' || rc.keyClass === 'goog_public';

  let canMakePurchases = false;
  let canMakePurchasesReason = 'Not on a supported native store.';
  if (!native) {
    canMakePurchasesReason = 'In-app purchases require iOS or Android.';
  } else if (expoGo) {
    canMakePurchasesReason = 'Billing unavailable because the app is running in Expo Go.';
  } else if (rc.environmentBlocked) {
    canMakePurchasesReason = rc.environmentBlockReason ?? 'Billing environment blocked.';
  } else if (!keyOk) {
    if (rc.keyClass === 'secret_sk') {
      canMakePurchasesReason =
        'Billing unavailable because EXPO_PUBLIC_REVENUECAT_API_KEY_IOS is a secret (sk_) key; use the public appl_ SDK key.';
    } else {
      canMakePurchasesReason =
        'Billing unavailable because the RevenueCat API key is missing or not a valid public SDK key for this platform.';
    }
  } else if (!configured) {
    canMakePurchasesReason =
      rc.purchasesConfigureError ?? 'Purchases SDK has not completed configure() yet (or configure failed).';
  } else {
    canMakePurchases = true;
    canMakePurchasesReason = 'SDK configured; products depend on RevenueCat offerings and App Store Connect.';
  }

  return {
    ...base,
    canMakePurchases,
    canMakePurchasesReason,
  };
}

/**
 * Full merged snapshot for UI / logs. Safe to stringify — no raw API keys.
 */
export function getBillingDiagnosticsState(): BillingDiagnosticsState {
  const app = {
    ...BILLING_DIAGNOSTICS_INITIAL.app,
    executionSurface: executionSurface(),
    deviceSurface: deviceSurface(),
    physicalDeviceHint: physicalDeviceHint(),
    expoSdkVersion: Constants.expoConfig?.sdkVersion ?? null,
    debugMode: __DEV__,
  };

  const revenueCat = buildRevenueCatSection();

  const billing = buildBillingSection({
    ...BILLING_DIAGNOSTICS_INITIAL.billing,
    ...volatileRc.billing,
  });

  const membership = {
    ...BILLING_DIAGNOSTICS_INITIAL.membership,
    entitlementIdentifierExpected: RC_ENTITLEMENT_PRO,
    ...volatileSub.membership,
  };

  const credits = {
    ...BILLING_DIAGNOSTICS_INITIAL.credits,
    ...volatileSub.credits,
  };

  const lastErrors = {
    ...BILLING_DIAGNOSTICS_INITIAL.lastErrors,
    ...volatileRc.lastErrors,
    ...volatileSub.lastErrors,
  };

  return {
    updatedAtIso: new Date().toISOString(),
    app,
    revenueCat,
    billing,
    membership,
    credits,
    lastErrors,
  };
}
