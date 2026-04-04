import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { env } from '@/config';

import { getRcCreditsOfferingId, getRcSubscriptionOfferingId } from './constants';
import {
  CREDIT_PACK_PRODUCT_ORDER,
  CREDITS_PER_STORE_PRODUCT,
  STORE_PRODUCT_IDS,
} from './productIds';
import { mapCustomerInfo, mapNotConfiguredSummary, mapUnknownCustomerInfo } from './mapCustomerInfo';
import { interpretPurchaseError, successFromCustomerInfo, type PurchaseFlowResult } from './purchaseOutcome';
import type { CustomerInfoSummary, PaywallCatalog, PaywallPackageOption } from './types';

type CustomerInfoListener = (summary: CustomerInfoSummary) => void;

const packageCache = new Map<string, PurchasesPackage>();
const customerInfoListeners = new Set<CustomerInfoListener>();

let configurePromise: Promise<void> | null = null;
let isConfigured = false;
/** Tracks last Supabase user id passed to `syncAppUserId` (null = anonymous / signed out). */
let lastAppUserId: string | null | undefined = undefined;
let listenerInstalled = false;

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
    notifyListeners(mapCustomerInfo(info));
  });
}

function nativeStoreSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function apiKeyForPlatform(): string | null {
  const key = Platform.OS === 'ios' ? env.revenueCatApiKeyIos : env.revenueCatApiKeyAndroid;
  return key?.trim() ? key : null;
}

async function ensureConfigured(): Promise<void> {
  if (!nativeStoreSupported()) {
    return;
  }
  if (isConfigured) {
    return;
  }
  if (configurePromise) {
    await configurePromise;
    return;
  }

  configurePromise = (async () => {
    const key = apiKeyForPlatform();
    if (!key) {
      throw new Error(
        'RevenueCat API key missing. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS (and Android key for Play builds).',
      );
    }
    Purchases.configure({ apiKey: key });
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
    }
    installCustomerInfoListener();
    isConfigured = true;
  })();

  try {
    await configurePromise;
  } catch (e) {
    configurePromise = null;
    isConfigured = false;
    listenerInstalled = false;
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
  const creditsQuantity = CREDITS_PER_STORE_PRODUCT[storeProductId] ?? null;
  return {
    refKey: refKeyFor(offeringId, pkg),
    offeringIdentifier: offeringId,
    packageIdentifier: pkg.identifier,
    storeProductId,
    title: product.title,
    description: product.description,
    priceString: product.priceString,
    packageType: String(pkg.packageType),
    creditsQuantity,
  };
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
  /**
   * Subscribe to RevenueCat customer-info updates (entitlement changes, renewals, restores).
   * Unsubscribe on cleanup.
   */
  subscribeCustomerInfo(listener: CustomerInfoListener): () => void {
    customerInfoListeners.add(listener);
    return () => customerInfoListeners.delete(listener);
  },

  /**
   * Configure the SDK (once) and align the RevenueCat `appUserId` with Supabase `auth.users.id`.
   * Call on sign-in, sign-out, and before purchases.
   */
  async syncAppUserId(userId: string | null): Promise<void> {
    if (!nativeStoreSupported()) {
      lastAppUserId = userId;
      notifyListeners(mapNotConfiguredSummary());
      return;
    }

    try {
      await ensureConfigured();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'configure failed';
      notifyListeners(mapUnknownCustomerInfo(msg));
      throw e;
    }

    if (lastAppUserId === userId) {
      return;
    }

    try {
      if (userId) {
        const { customerInfo } = await Purchases.logIn(userId);
        lastAppUserId = userId;
        notifyListeners(mapCustomerInfo(customerInfo));
      } else if (lastAppUserId != null) {
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
      throw e;
    }
  },

  /**
   * Backwards-compatible name used by SubscriptionProvider.
   */
  async initialize(): Promise<void> {
    if (!nativeStoreSupported()) {
      return;
    }
    try {
      await ensureConfigured();
    } catch (e) {
      console.warn('[RevenueCat] initialize:', e);
    }
  },

  async getCustomerInfo(): Promise<CustomerInfoSummary> {
    if (!nativeStoreSupported()) {
      return mapNotConfiguredSummary();
    }
    try {
      await ensureConfigured();
      const info = await Purchases.getCustomerInfo();
      return mapCustomerInfo(info);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'getCustomerInfo failed';
      return mapUnknownCustomerInfo(msg);
    }
  },

  /**
   * Load subscription + credit-pack offerings for the paywall. Caches native packages for `purchaseByRefKey`.
   */
  async loadPaywallCatalog(): Promise<PaywallCatalog> {
    packageCache.clear();

    if (!nativeStoreSupported()) {
      return {
        sdkConfigured: false,
        sdkMessage: 'In-app purchases are only available on the iOS and Android apps (development build).',
        subscriptionOfferingId: getRcSubscriptionOfferingId(),
        subscriptionPackages: [],
        creditsOfferingId: getRcCreditsOfferingId(),
        creditPackages: [],
      };
    }

    const key = apiKeyForPlatform();
    if (!key) {
      return {
        sdkConfigured: false,
        sdkMessage: 'Missing RevenueCat API key for this platform.',
        subscriptionOfferingId: getRcSubscriptionOfferingId(),
        subscriptionPackages: [],
        creditsOfferingId: getRcCreditsOfferingId(),
        creditPackages: [],
      };
    }

    try {
      await ensureConfigured();
      const offerings = await Purchases.getOfferings();
      const subId = getRcSubscriptionOfferingId();
      const creditsId = getRcCreditsOfferingId();

      const subOffering = offerings.all[subId] ?? offerings.current ?? null;
      const creditOffering = offerings.all[creditsId] ?? null;

      const subscriptionPkgs = subOffering?.availablePackages ?? [];
      const creditPkgs = creditOffering?.availablePackages ?? [];

      if (subOffering) {
        cachePackages(subOffering.identifier, subscriptionPkgs);
      }
      if (creditOffering) {
        cachePackages(creditOffering.identifier, creditPkgs);
      }

      const subscriptionPackages = subscriptionPkgs.map((p) =>
        toPaywallOption(subOffering?.identifier ?? subId, p),
      );
      const creditPackages = sortCreditPackages(
        creditPkgs.map((p) => toPaywallOption(creditOffering?.identifier ?? creditsId, p)),
      );

      return {
        sdkConfigured: true,
        sdkMessage: null,
        subscriptionOfferingId: subOffering?.identifier ?? subId,
        subscriptionPackages,
        creditsOfferingId: creditOffering?.identifier ?? creditsId,
        creditPackages,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load store products.';
      return {
        sdkConfigured: true,
        sdkMessage: msg,
        subscriptionOfferingId: getRcSubscriptionOfferingId(),
        subscriptionPackages: [],
        creditsOfferingId: getRcCreditsOfferingId(),
        creditPackages: [],
      };
    }
  },

  /**
   * Purchase a package returned from `loadPaywallCatalog` (by `refKey`).
   */
  async purchaseByRefKey(refKey: string): Promise<PurchaseFlowResult> {
    if (!nativeStoreSupported()) {
      return { outcome: 'error', message: 'Purchases are not available on this platform.' };
    }
    try {
      await ensureConfigured();
      const pkg = packageCache.get(refKey);
      if (!pkg) {
        return {
          outcome: 'error',
          message: 'That offer expired. Pull to refresh the paywall and try again.',
        };
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return successFromCustomerInfo(customerInfo);
    } catch (e) {
      return interpretPurchaseError(e);
    }
  },

  /**
   * Subscribe using the default monthly package when present; otherwise the first subscription package.
   */
  async purchaseDefaultSubscription(): Promise<PurchaseFlowResult> {
    const catalog = await this.loadPaywallCatalog();
    const pick = pickDefaultMonthly(catalog.subscriptionPackages);
    if (!pick) {
      return {
        outcome: 'error',
        message:
          'No subscription products were returned. Check RevenueCat offerings and App Store Connect availability.',
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
    if (!nativeStoreSupported()) {
      return mapNotConfiguredSummary();
    }
    try {
      await ensureConfigured();
      await Purchases.syncPurchases();
      const info = await Purchases.getCustomerInfo();
      const summary = mapCustomerInfo(info);
      notifyListeners(summary);
      return summary;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'restore failed';
      const failed = mapUnknownCustomerInfo(msg);
      notifyListeners(failed);
      return failed;
    }
  },

  /**
   * Forces a refetch from RevenueCat (e.g. after webhook delay). Optional; prefer restore for user-triggered sync.
   */
  async invalidateCustomerInfoCache(): Promise<void> {
    if (!nativeStoreSupported() || !isConfigured) {
      return;
    }
    try {
      await Purchases.invalidateCustomerInfoCache();
    } catch {
      /* noop */
    }
  },
};
