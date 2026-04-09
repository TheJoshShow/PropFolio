/**
 * RevenueCat / StoreKit integration.
 *
 * In-app purchases require a native build (EAS dev client or TestFlight/App Store). Expo Go cannot use
 * react-native-purchases — `getRevenueCatEnvironmentBlockReason()` will report that when applicable.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { env } from '@/config';
import {
  applyPaywallCatalogDiagnostics,
  recordCustomerInfoDiagnostics,
  recordInitializationDiagnostics,
  recordRestorePurchaseDiagnostics,
} from '@/services/billing/billingDiagnosticsSync';

import { getRcCreditsOfferingId, getRcSubscriptionOfferingId } from './constants';
import { rcDiag } from './revenueCatDiagnostics';
import {
  RevenueCatConfigurationError,
  summarizeRevenueCatKey,
  validateRevenueCatPublicKey,
  type RevenueCatKeyValidationFailureCode,
  type RevenueCatKeyValidationResult,
} from './revenueCatKeyValidation';
import {
  CREDIT_PACK_PRODUCT_ORDER,
  CREDITS_PER_STORE_PRODUCT,
  inferCreditPackSizeFromProductId,
  STORE_PRODUCT_IDS,
} from './productIds';
import { mapCustomerInfo, mapNotConfiguredSummary, mapUnknownCustomerInfo } from './mapCustomerInfo';
import { pickCreditsOffering, pickSubscriptionOffering } from './offeringResolution';
import { setRevenueCatConfigureSnapshot } from '@/services/revenuecat/revenueCatConfigureSnapshot';
import {
  interpretPurchaseError,
  isTransientPurchasesTransportError,
  successFromCustomerInfo,
  type PurchaseFlowResult,
} from './purchaseOutcome';
import type { CustomerInfoSummary, PaywallCatalog, PaywallPackageOption } from './types';

type CustomerInfoListener = (summary: CustomerInfoSummary) => void;

const packageCache = new Map<string, PurchasesPackage>();
const customerInfoListeners = new Set<CustomerInfoListener>();

let configurePromise: Promise<void> | null = null;
let isConfigured = false;
/** Tracks last Supabase user id passed to `syncAppUserId` (null = anonymous / signed out). */
let lastAppUserId: string | null | undefined = undefined;
let listenerInstalled = false;
/** Last configure attempt error (user-safe), when configure failed after validation passed. */
let lastConfigureError: string | null = null;
/** Avoid spamming console with the same invalid key diagnosis. */
let lastLoggedKeyFailureFingerprint: string | null = null;

function logInvalidPublicKeyOnce(platform: 'ios' | 'android', code: string, keySummary: string): void {
  const fp = `${platform}|${code}|${keySummary}`;
  if (lastLoggedKeyFailureFingerprint === fp) {
    return;
  }
  lastLoggedKeyFailureFingerprint = fp;
  rcDiag.keyValidationFailed(platform, code, keySummary);
}

function refKeyFor(offeringId: string, pkg: PurchasesPackage): string {
  return `${offeringId}::${pkg.identifier}`;
}

function notifyListeners(summary: CustomerInfoSummary): void {
  for (const fn of customerInfoListeners) {
    try {
      fn(summary);
    } catch {
      /* screen unmounted */
    }
  }
}

function installCustomerInfoListener(): void {
  if (listenerInstalled) {
    return;
  }
  listenerInstalled = true;
  Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
    const summary = mapCustomerInfo(info);
    rcDiag.customerInfoSummary({
      status: summary.status,
      entitlementKeys: summary.activeEntitlements,
      premiumProductId: summary.premiumProductIdentifier,
    });
    notifyListeners(summary);
  });
}

export function isExpoGoClient(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function nativeIapPlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export type RevenueCatEnvironmentBlockState =
  | { ok: true }
  | {
      ok: false;
      message: string;
      reasonCode: RevenueCatKeyValidationFailureCode | 'expo_go' | 'non_native_platform';
    };

/**
 * Structured environment / API key gate. Prefer this when you need `reasonCode` for logging.
 */
export function getRevenueCatEnvironmentBlockState(): RevenueCatEnvironmentBlockState {
  if (!nativeIapPlatform()) {
    return {
      ok: false,
      message: 'In-app purchases run only on the iOS or Android app.',
      reasonCode: 'non_native_platform',
    };
  }
  if (isExpoGoClient()) {
    return {
      ok: false,
      message:
        'Expo Go cannot use App Store billing. Install a development build or TestFlight build to test purchases.',
      reasonCode: 'expo_go',
    };
  }
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const key = platform === 'ios' ? env.revenueCatApiKeyIos : env.revenueCatApiKeyAndroid;
  rcDiag.keyPresence(platform, key);
  const v = validateRevenueCatPublicKey(platform, key);
  if (!v.ok) {
    logInvalidPublicKeyOnce(platform, v.code, summarizeRevenueCatKey(key));
    return { ok: false, message: v.userMessage, reasonCode: v.code };
  }
  return { ok: true };
}

/**
 * When non-null, the SDK must not be configured and the user should see this message (misconfiguration / Expo Go).
 */
export function getRevenueCatEnvironmentBlockReason(): string | null {
  const s = getRevenueCatEnvironmentBlockState();
  return s.ok ? null : s.message;
}

function validateKeyForCurrentPlatform(): RevenueCatKeyValidationResult {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const key = platform === 'ios' ? env.revenueCatApiKeyIos : env.revenueCatApiKeyAndroid;
  return validateRevenueCatPublicKey(platform, key);
}

function apiKeyForPlatform(): string | null {
  const v = validateKeyForCurrentPlatform();
  if (!v.ok) {
    return null;
  }
  const key = Platform.OS === 'ios' ? env.revenueCatApiKeyIos : env.revenueCatApiKeyAndroid;
  const k = key?.trim() ?? '';
  return k || null;
}

function emptyCatalog(
  loadPhase: PaywallCatalog['loadPhase'],
  loadMessage: string,
  partial: Partial<PaywallCatalog> = {},
): PaywallCatalog {
  const subscriptionOfferingId = getRcSubscriptionOfferingId();
  const creditsOfferingId = getRcCreditsOfferingId();
  return {
    sdkConfigured: false,
    sdkMessage: loadMessage,
    loadPhase,
    loadMessage,
    devDetail: __DEV__ ? partial.devDetail ?? null : null,
    revenueCatCurrentOfferingId: null,
    revenueCatAllOfferingIds: [],
    subscriptionOfferingId,
    subscriptionOfferingFound: false,
    subscriptionPackages: [],
    creditsOfferingId,
    creditsOfferingFound: false,
    creditPackages: [],
    ...partial,
  };
}

async function ensureConfigured(): Promise<void> {
  if (!nativeIapPlatform()) {
    return;
  }
  const blockState = getRevenueCatEnvironmentBlockState();
  if (!blockState.ok) {
    rcDiag.initResult(false, 'environment_blocked');
    throw new RevenueCatConfigurationError(blockState.message, blockState.reasonCode);
  }

  if (isConfigured) {
    return;
  }
  if (configurePromise) {
    await configurePromise;
    return;
  }

  configurePromise = (async () => {
    lastConfigureError = null;
    const key = apiKeyForPlatform();
    if (!key) {
      const v = validateKeyForCurrentPlatform();
      const msg =
        v.ok === false
          ? v.userMessage
          : 'RevenueCat API key missing. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS (public appl_ key only).';
      setRevenueCatConfigureSnapshot(false, msg);
      recordInitializationDiagnostics(msg);
      throw new Error(msg);
    }

    rcDiag.log('sdk.configure.start');
    try {
      Purchases.configure({ apiKey: key });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      lastConfigureError = detail;
      setRevenueCatConfigureSnapshot(false, detail);
      recordInitializationDiagnostics(detail);
      rcDiag.initResult(false, detail);
      throw new RevenueCatConfigurationError(detail, 'configure_failed');
    }

    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
    }
    installCustomerInfoListener();
    isConfigured = true;
    setRevenueCatConfigureSnapshot(true, null);
    recordInitializationDiagnostics(null);
    rcDiag.initResult(true);
  })();

  try {
    await configurePromise;
  } catch (e) {
    configurePromise = null;
    isConfigured = false;
    listenerInstalled = false;
    const failMsg = e instanceof Error ? e.message : String(e);
    setRevenueCatConfigureSnapshot(false, failMsg);
    recordInitializationDiagnostics(failMsg);
    throw e;
  }
}

function cachePackages(offeringId: string, pkgs: PurchasesPackage[]): void {
  for (const p of pkgs) {
    packageCache.set(refKeyFor(offeringId, p), p);
  }
}

function toPaywallOption(offeringId: string, pkg: PurchasesPackage): PaywallPackageOption {
  const product = pkg.product;
  const storeProductId = product.identifier;
  const creditsQuantity =
    CREDITS_PER_STORE_PRODUCT[storeProductId] ?? inferCreditPackSizeFromProductId(storeProductId);
  const priceRaw = product.priceString?.trim() ?? '';
  return {
    refKey: refKeyFor(offeringId, pkg),
    offeringIdentifier: offeringId,
    packageIdentifier: pkg.identifier,
    storeProductId,
    title: product.title?.trim() ? product.title : 'Product',
    description: product.description?.trim() ? product.description : '',
    priceString: priceRaw.length > 0 ? priceRaw : '—',
    packageType: String(pkg.packageType),
    creditsQuantity,
  };
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sortCreditPackages(pkgs: PaywallPackageOption[]): PaywallPackageOption[] {
  const order = new Map(CREDIT_PACK_PRODUCT_ORDER.map((id, i) => [id, i]));
  return [...pkgs].sort((a, b) => {
    const ia = order.get(a.storeProductId) ?? 999;
    const ib = order.get(b.storeProductId) ?? 999;
    if (ia !== ib) {
      return ia - ib;
    }
    return a.priceString.localeCompare(b.priceString);
  });
}

function pickDefaultMonthly(packages: PaywallPackageOption[]): PaywallPackageOption | null {
  const monthly = packages.find(
    (p) =>
      p.storeProductId === STORE_PRODUCT_IDS.subscriptionMonthly ||
      p.packageType === String(Purchases.PACKAGE_TYPE.MONTHLY),
  );
  return monthly ?? packages[0] ?? null;
}

export const revenueCatService = {
  subscribeCustomerInfo(listener: CustomerInfoListener): () => void {
    customerInfoListeners.add(listener);
    return () => customerInfoListeners.delete(listener);
  },

  async syncAppUserId(userId: string | null): Promise<void> {
    if (!nativeIapPlatform()) {
      lastAppUserId = userId;
      notifyListeners(mapNotConfiguredSummary());
      return;
    }

    const block = getRevenueCatEnvironmentBlockReason();
    if (block) {
      notifyListeners(mapUnknownCustomerInfo(block));
      rcDiag.log('syncAppUserId.blocked', { reason: 'environment' });
      return;
    }

    try {
      await ensureConfigured();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'configure failed';
      const reason =
        e instanceof RevenueCatConfigurationError ? e.reasonCode : 'configure_failed';
      notifyListeners(mapUnknownCustomerInfo(msg));
      rcDiag.log('syncAppUserId.configure_failed', { detail: msg.slice(0, 120) });
      rcDiag.configureAttemptFailed(msg, reason);
      if (__DEV__) {
        throw e;
      }
      return;
    }

    if (lastAppUserId === userId) {
      return;
    }

    try {
      if (userId) {
        rcDiag.log('purchases.logIn.start');
        const { customerInfo } = await Purchases.logIn(userId);
        lastAppUserId = userId;
        const summary = mapCustomerInfo(customerInfo);
        rcDiag.customerInfoSummary({
          status: summary.status,
          entitlementKeys: summary.activeEntitlements,
          premiumProductId: summary.premiumProductIdentifier,
        });
        notifyListeners(summary);
      } else if (lastAppUserId != null) {
        rcDiag.log('purchases.logOut');
        const customerInfo = await Purchases.logOut();
        lastAppUserId = null;
        notifyListeners(mapCustomerInfo(customerInfo));
      } else {
        lastAppUserId = null;
        const customerInfo = await Purchases.getCustomerInfo();
        notifyListeners(mapCustomerInfo(customerInfo));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'login failed';
      notifyListeners(mapUnknownCustomerInfo(msg));
      rcDiag.log('syncAppUserId.error', { detail: msg.slice(0, 120) });
      throw e;
    }
  },

  async initialize(): Promise<void> {
    if (!nativeIapPlatform()) {
      return;
    }
    const block = getRevenueCatEnvironmentBlockReason();
    if (block) {
      rcDiag.log('initialize.skipped', { reason: 'environment_block' });
      return;
    }
    try {
      await ensureConfigured();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      console.warn('[RevenueCat] initialize:', e);
      recordInitializationDiagnostics(m);
      rcDiag.initResult(false, m);
    }
  },

  async getCustomerInfo(): Promise<CustomerInfoSummary> {
    if (!nativeIapPlatform()) {
      recordCustomerInfoDiagnostics(false, 'not_native_platform');
      return mapNotConfiguredSummary();
    }
    const block = getRevenueCatEnvironmentBlockReason();
    if (block) {
      recordCustomerInfoDiagnostics(false, block);
      return mapUnknownCustomerInfo(block);
    }
    try {
      await ensureConfigured();
      const info = await Purchases.getCustomerInfo();
      const summary = mapCustomerInfo(info);
      recordCustomerInfoDiagnostics(true, null);
      rcDiag.customerInfoSummary({
        status: summary.status,
        entitlementKeys: summary.activeEntitlements,
        premiumProductId: summary.premiumProductIdentifier,
      });
      return summary;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'getCustomerInfo failed';
      recordCustomerInfoDiagnostics(false, msg);
      rcDiag.log('getCustomerInfo.error', { detail: msg.slice(0, 120) });
      return mapUnknownCustomerInfo(msg);
    }
  },

  async loadPaywallCatalog(): Promise<PaywallCatalog> {
    packageCache.clear();

    const finish = (c: PaywallCatalog): PaywallCatalog => {
      applyPaywallCatalogDiagnostics(c);
      return c;
    };

    if (!nativeIapPlatform()) {
      return finish(
        emptyCatalog(
          'unsupported_platform',
          'In-app purchases are only available in the iOS and Android apps (not on web).',
          { devDetail: `platform=${Platform.OS}` },
        ),
      );
    }

    if (isExpoGoClient()) {
      return finish(
        emptyCatalog(
          'expo_go_unsupported',
          'Expo Go cannot load App Store products. Use a development build or TestFlight.',
          { devDetail: 'executionEnvironment=StoreClient (Expo Go)' },
        ),
      );
    }

    const keyCheck = validateKeyForCurrentPlatform();
    if (!keyCheck.ok) {
      return finish(
        emptyCatalog('invalid_api_key', keyCheck.userMessage, {
          sdkMessage: keyCheck.userMessage,
          devDetail: `code=${keyCheck.code}`,
        }),
      );
    }

    try {
      await ensureConfigured();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'SDK failed to start';
      return finish(
        emptyCatalog('sdk_init_failed', msg, {
          sdkMessage: msg,
          devDetail: lastConfigureError ?? undefined,
        }),
      );
    }

    const subId = getRcSubscriptionOfferingId();
    const creditsId = getRcCreditsOfferingId();

    try {
      rcDiag.log('offerings.fetch.start');
      const offerings = await Purchases.getOfferings();
      const mergedAll: Record<string, PurchasesOffering> = { ...offerings.all };
      if (offerings.current && mergedAll[offerings.current.identifier] == null) {
        mergedAll[offerings.current.identifier] = offerings.current;
      }
      const allIds = Object.keys(mergedAll);
      const currentId = offerings.current?.identifier ?? null;

      if (allIds.length === 0) {
        const msg =
          'RevenueCat returned no offerings. In the RevenueCat dashboard, create offerings, attach your App Store products, and set a current offering.';
        rcDiag.offeringsResult({
          currentOfferingId: null,
          allOfferingIds: [],
          subscriptionOfferingId: subId,
          subscriptionPackageCount: 0,
          creditsOfferingId: creditsId,
          creditPackageCount: 0,
          error: 'rc_offerings_empty',
        });
        return finish({
          sdkConfigured: true,
          sdkMessage: msg,
          loadPhase: 'rc_offerings_empty',
          loadMessage: msg,
          devDetail: __DEV__ ? 'getOfferings returned no offerings in `all`' : null,
          revenueCatCurrentOfferingId: null,
          revenueCatAllOfferingIds: [],
          subscriptionOfferingId: subId,
          subscriptionOfferingFound: false,
          subscriptionPackages: [],
          creditsOfferingId: creditsId,
          creditsOfferingFound: false,
          creditPackages: [],
        });
      }

      const bundle = { all: mergedAll, current: offerings.current };
      const subPick = pickSubscriptionOffering(bundle, subId);
      const creditPick = pickCreditsOffering(bundle, creditsId);
      rcDiag.log('catalog.offering_resolution', {
        subscriptionReason: subPick.reason,
        creditsReason: creditPick.reason,
        configuredSubscriptionId: subId,
        configuredCreditsId: creditsId,
        offeringIds: allIds,
      });

      const subOffering = subPick.offering;
      const creditOffering = creditPick.offering;

      const subscriptionRaw = subOffering?.availablePackages ?? [];
      const creditPkgs = creditOffering?.availablePackages ?? [];

      if (subOffering) {
        cachePackages(subOffering.identifier, subscriptionRaw);
      }
      if (creditOffering) {
        cachePackages(creditOffering.identifier, creditPkgs);
      }

      let loadPhase: PaywallCatalog['loadPhase'] = 'ok';
      let loadMessage: string | null = null;
      let devDetail: string | null = null;

      let subscriptionPackages: PaywallPackageOption[] = [];

      if (!subOffering) {
        loadPhase = 'subscription_offering_missing';
        loadMessage = `No membership offering found for id "${subId}", and no offering contains the monthly App Store product "${STORE_PRODUCT_IDS.subscriptionMonthly}". Create offering "${subId}" (or set EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID) and attach that product. Offerings in this build: ${allIds.join(', ')}.`;
        devDetail = `subPick=${subPick.reason} expectedSubId=${subId} currentRC=${currentId ?? 'null'}`;
      } else if (subscriptionRaw.length === 0) {
        loadPhase = 'subscription_packages_empty';
        loadMessage = `Offering "${subOffering.identifier}" has no packages. In RevenueCat, add a package and attach the auto-renewable product "${STORE_PRODUCT_IDS.subscriptionMonthly}".`;
        devDetail = `offering=${subOffering.identifier} subPick=${subPick.reason}`;
      } else {
        const mappedSub = subscriptionRaw.map((p) => toPaywallOption(subOffering.identifier, p));
        const hasExpectedProduct = mappedSub.some(
          (p) => p.storeProductId === STORE_PRODUCT_IDS.subscriptionMonthly,
        );
        const hasMonthlyType = mappedSub.some(
          (p) => p.packageType === String(Purchases.PACKAGE_TYPE.MONTHLY),
        );
        if (!hasExpectedProduct && !hasMonthlyType) {
          loadPhase = 'subscription_product_mismatch';
          loadMessage = `Offering "${subOffering.identifier}" has packages, but none use App Store product id "${STORE_PRODUCT_IDS.subscriptionMonthly}". Align App Store Connect with productIds.ts or attach the correct product in RevenueCat. Package ids returned: ${mappedSub.map((p) => p.storeProductId).join(', ')}.`;
          devDetail = `subPick=${subPick.reason} storeProducts=${mappedSub.map((p) => p.storeProductId).join(',')}`;
          subscriptionPackages = [];
        } else {
          subscriptionPackages = mappedSub;
        }
      }

      const creditPackages = sortCreditPackages(
        creditPkgs.map((p) => toPaywallOption(creditOffering?.identifier ?? creditsId, p)),
      );

      rcDiag.offeringsResult({
        currentOfferingId: currentId,
        allOfferingIds: allIds,
        subscriptionOfferingId: subId,
        subscriptionPackageCount: subscriptionPackages.length,
        creditsOfferingId: creditsId,
        creditPackageCount: creditPackages.length,
        error: loadPhase === 'ok' ? undefined : loadPhase,
      });

      const creditsMissing = !creditOffering;
      if (creditsMissing && loadPhase === 'ok') {
        devDetail =
          [devDetail, `credits offering "${creditsId}" not resolved (creditsPick=${creditPick.reason})`]
            .filter(Boolean)
            .join('; ') || null;
      } else if (!creditsMissing && __DEV__) {
        devDetail = [devDetail, `creditsPick=${creditPick.reason}`].filter(Boolean).join('; ') || devDetail;
      }

      return finish({
        sdkConfigured: true,
        sdkMessage: loadMessage,
        loadPhase,
        loadMessage,
        devDetail: __DEV__ ? devDetail : null,
        revenueCatCurrentOfferingId: currentId,
        revenueCatAllOfferingIds: allIds,
        subscriptionOfferingId: subOffering?.identifier ?? subId,
        subscriptionOfferingFound: Boolean(subOffering),
        subscriptionPackages,
        creditsOfferingId: creditOffering?.identifier ?? creditsId,
        creditsOfferingFound: Boolean(creditOffering),
        creditPackages,
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Failed to load store products.';
      rcDiag.log('offerings.fetch.error', { detail: raw.slice(0, 160) });
      return finish({
        ...emptyCatalog('offerings_fetch_failed', raw, {
          sdkConfigured: true,
          sdkMessage: raw,
          devDetail: raw,
        }),
        sdkConfigured: true,
      });
    }
  },

  async purchaseByRefKey(refKey: string): Promise<PurchaseFlowResult> {
    if (!nativeIapPlatform()) {
      return { outcome: 'error', message: 'Purchases are not available on this platform.' };
    }
    const block = getRevenueCatEnvironmentBlockReason();
    if (block) {
      return { outcome: 'error', message: block };
    }
    try {
      await ensureConfigured();
      const pkg = packageCache.get(refKey);
      if (!pkg) {
        rcDiag.purchaseFlow('no_cached_package', { refKey });
        return {
          outcome: 'error',
          message: 'That offer expired. Pull to refresh the paywall and try again.',
        };
      }
      rcDiag.purchaseFlow('purchasePackage.start', { packageId: pkg.identifier });
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const result = successFromCustomerInfo(customerInfo);
        rcDiag.purchaseFlow('purchasePackage.done', { outcome: result.outcome });
        return result;
      } catch (e) {
        if (isTransientPurchasesTransportError(e)) {
          rcDiag.purchaseFlow('purchasePackage.retry', { reason: 'transient_transport' });
          await sleepMs(700);
          try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            const result = successFromCustomerInfo(customerInfo);
            rcDiag.purchaseFlow('purchasePackage.done', { outcome: result.outcome });
            return result;
          } catch (e2) {
            return interpretPurchaseError(e2);
          }
        }
        return interpretPurchaseError(e);
      }
    } catch (e) {
      return interpretPurchaseError(e);
    }
  },

  async purchaseDefaultSubscription(): Promise<PurchaseFlowResult> {
    const catalog = await this.loadPaywallCatalog();
    const pick = pickDefaultMonthly(catalog.subscriptionPackages);
    if (!pick) {
      rcDiag.purchaseFlow('no_subscription_package', {
        phase: catalog.loadPhase,
        loadMessage: catalog.loadMessage?.slice(0, 200) ?? null,
      });
      return {
        outcome: 'error',
        message:
          'We couldn’t start membership checkout. Pull down on the paywall to refresh store products, then try again.',
      };
    }
    return this.purchaseByRefKey(pick.refKey);
  },

  /** @deprecated Prefer `purchaseDefaultSubscription` or `purchaseByRefKey` from catalog. */
  async purchasePackage(_offeringId: string): Promise<CustomerInfoSummary> {
    void _offeringId;
    const result = await this.purchaseDefaultSubscription();
    if (result.outcome === 'purchased') {
      return result.customerInfo;
    }
    if (result.outcome === 'cancelled') {
      return this.getCustomerInfo();
    }
    if (result.outcome === 'pending') {
      return this.getCustomerInfo();
    }
    throw new Error(result.message);
  },

  async restorePurchases(): Promise<CustomerInfoSummary> {
    if (!nativeIapPlatform()) {
      recordRestorePurchaseDiagnostics('not_native_platform');
      return mapNotConfiguredSummary();
    }
    const block = getRevenueCatEnvironmentBlockReason();
    if (block) {
      recordRestorePurchaseDiagnostics(block);
      rcDiag.restoreFlow('blocked', {});
      return mapUnknownCustomerInfo(block);
    }
    try {
      await ensureConfigured();
      rcDiag.restoreFlow('syncPurchases.start');
      await Purchases.syncPurchases();
      const info = await Purchases.getCustomerInfo();
      const summary = mapCustomerInfo(info);
      rcDiag.restoreFlow('done', {
        status: summary.status,
        entitlements: summary.activeEntitlements.join(',') || '(none)',
      });
      notifyListeners(summary);
      recordRestorePurchaseDiagnostics(null);
      return summary;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'restore failed';
      recordRestorePurchaseDiagnostics(msg);
      rcDiag.restoreFlow('error', { detail: msg.slice(0, 120) });
      const failed = mapUnknownCustomerInfo(msg);
      notifyListeners(failed);
      return failed;
    }
  },

  async invalidateCustomerInfoCache(): Promise<void> {
    if (!nativeIapPlatform() || !isConfigured) {
      return;
    }
    try {
      await Purchases.invalidateCustomerInfoCache();
    } catch {
      /* noop */
    }
  },
};
