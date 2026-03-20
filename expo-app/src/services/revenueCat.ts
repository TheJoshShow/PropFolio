/**
 * RevenueCat integration for iOS-only in-app subscriptions.
 * Initialized only after authenticated user is known; uses Supabase user ID as app user ID.
 * On web, all methods no-op or return safe defaults so the app can run (optional web support later).
 * API keys and entitlement/offering identifiers come from src/config/billing.ts.
 */

import { Platform } from 'react-native';
import { getRevenueCatApiKey, ENTITLEMENT_PRO } from '../config/billing';

const isNative = Platform.OS === 'ios';

/** Lazy load native module only on iOS to avoid web bundle errors. */
function getPurchases(): typeof import('react-native-purchases').default | null {
  if (!isNative) return null;
  try {
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

function getApiKey(): string {
  return getRevenueCatApiKey();
}

// -----------------------------------------------------------------------------
// Public types (stable API; map from RC types internally)
// -----------------------------------------------------------------------------

export interface RevenueCatPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    priceString: string;
    title?: string;
    description?: string;
  };
}

export interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: RevenueCatPackage[];
}

export interface RevenueCatCustomerInfo {
  activeSubscriptions: string[];
  entitlements: {
    active: Record<string, { isActive: boolean; identifier: string; expirationDate?: string | null }>;
  };
}

export type PurchaseResult =
  | { success: true; customerInfo: RevenueCatCustomerInfo }
  | { success: false; cancelled: true }
  | { success: false; pending: true }
  | { success: false; error: string };

export type RestoreResult =
  | { success: true; customerInfo: RevenueCatCustomerInfo }
  | { success: false; error: string };

/** Entitlement identifier for Pro access. Sourced from config/billing (must match RevenueCat Dashboard). */
export const PRO_ENTITLEMENT_ID = ENTITLEMENT_PRO;

// -----------------------------------------------------------------------------
// Configure (call once when authenticated user is known)
// -----------------------------------------------------------------------------

let configuredUserId: string | null = null;

/**
 * Configure RevenueCat with the Supabase user ID as app user ID.
 * Strategy: one RevenueCat user per Supabase auth user; same ID for server (subscription_status)
 * and client entitlement. Call only after the authenticated user is known (sign-in or session
 * restore). No-op on web or if API key missing.
 */
export async function configureRevenueCat(appUserId: string): Promise<boolean> {
  if (!isNative || !appUserId) return false;
  const apiKey = getApiKey();
  if (!apiKey) {
    if (__DEV__) console.warn('[RevenueCat] API key not set for this platform; subscriptions disabled.');
    return false;
  }
  try {
    const Purchases = getPurchases();
    if (!Purchases) return false;
    await Purchases.configure({ apiKey, appUserID: appUserId });
    configuredUserId = appUserId;
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] configure failed:', e);
    return false;
  }
}

/**
 * Log out RevenueCat user (e.g. on app sign-out). Clears local cached user.
 */
export function logOutRevenueCat(): void {
  configuredUserId = null;
  if (!isNative) return;
  try {
    const Purchases = getPurchases();
    if (Purchases) Purchases.logOut();
  } catch (_) {
    // ignore
  }
}

/**
 * Whether RevenueCat is available (native + configured with a user).
 */
export function isRevenueCatAvailable(): boolean {
  return isNative && !!getApiKey() && !!getPurchases();
}

// -----------------------------------------------------------------------------
// Offerings
// -----------------------------------------------------------------------------

/** Raw package from SDK (needed for purchasePackage). Kept as unknown to avoid importing RC on web. */
export type RawPurchasesPackage = unknown;

/**
 * Fetch current offerings. Returns null on web, on error, or when not configured.
 * rawCurrentPackages: pass these to purchasePackage() for purchase.
 */
export async function getOfferings(): Promise<{
  current: RevenueCatOffering | null;
  all: Record<string, RevenueCatOffering>;
  rawCurrentPackages: RawPurchasesPackage[];
} | null> {
  if (!isNative) return null;
  try {
    const Purchases = getPurchases();
    if (!Purchases) return null;
    const offerings = await Purchases.getOfferings();
    if (!offerings?.current) return { current: null, all: {}, rawCurrentPackages: [] };

    const mapPackage = (pkg: { identifier: string; packageType: string; product: { identifier: string; priceString: string; title?: string; description?: string } }): RevenueCatPackage => ({
      identifier: pkg.identifier,
      packageType: pkg.packageType,
      product: {
        identifier: pkg.product?.identifier ?? '',
        priceString: pkg.product?.priceString ?? '',
        title: pkg.product?.title,
        description: pkg.product?.description,
      },
    });

    const current = offerings.current as { identifier: string; serverDescription?: string; availablePackages: unknown[] };
    const rawCurrentPackages = (current.availablePackages ?? []) as RawPurchasesPackage[];
    const all: Record<string, RevenueCatOffering> = {};
    if (offerings.all) {
      for (const [id, off] of Object.entries(offerings.all)) {
        const o = off as { identifier: string; serverDescription?: string; availablePackages: unknown[] };
        all[id] = {
          identifier: o.identifier,
          serverDescription: o.serverDescription ?? '',
          availablePackages: (o.availablePackages ?? []).map((p: unknown) => mapPackage(p as RevenueCatPackage)),
        };
      }
    }

    return {
      current: {
        identifier: current.identifier,
        serverDescription: current.serverDescription ?? '',
        availablePackages: rawCurrentPackages.map((p: unknown) => mapPackage(p as RevenueCatPackage)),
      },
      all,
      rawCurrentPackages,
    };
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] getOfferings failed:', e);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Customer info and entitlement
// -----------------------------------------------------------------------------

function mapCustomerInfo(raw: {
  activeSubscriptions?: string[];
  entitlements?: { active?: Record<string, { isActive?: boolean; identifier?: string; expirationDate?: string | null }> };
}): RevenueCatCustomerInfo {
  const active = raw?.entitlements?.active ?? {};
  const activeSubscriptions = raw?.activeSubscriptions ?? [];
  const entitlements = {
    active: Object.fromEntries(
      Object.entries(active).map(([k, v]) => [
        k,
        {
          isActive: !!v?.isActive,
          identifier: v?.identifier ?? k,
          expirationDate: typeof v?.expirationDate === 'string' ? v.expirationDate : null,
        },
      ])
    ),
  };
  return { activeSubscriptions, entitlements };
}

/**
 * Fetch latest customer info from RevenueCat. Returns null on web or on error.
 */
export async function getCustomerInfo(): Promise<RevenueCatCustomerInfo | null> {
  if (!isNative) return null;
  try {
    const Purchases = getPurchases();
    if (!Purchases) return null;
    const info = await Purchases.getCustomerInfo();
    return info ? mapCustomerInfo(info as Parameters<typeof mapCustomerInfo>[0]) : null;
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] getCustomerInfo failed:', e);
    return null;
  }
}

/**
 * Simple entitlement helper: true if the user has active Pro access.
 * We never revoke based on client-only guess: entitlement comes from RevenueCat (server).
 * isActive is true until the subscription actually expires (or is revoked); canceled-but-active
 * subscriptions remain active until end of billing period.
 */
export function hasProAccess(customerInfo: RevenueCatCustomerInfo | null): boolean {
  if (!customerInfo?.entitlements?.active) return false;
  const pro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
  return !!pro?.isActive;
}

// -----------------------------------------------------------------------------
// Purchase and restore (defensive: cancelled, pending, network errors)
// -----------------------------------------------------------------------------

/**
 * Purchase a package. Pass the raw package from getOfferings().rawCurrentPackages.
 * Handles cancelled, pending, and errors.
 */
export async function purchasePackage(
  rawPackage: RawPurchasesPackage
): Promise<PurchaseResult> {
  if (!isNative) {
    return { success: false, error: 'Purchases are not available on this platform.' };
  }
  try {
    const Purchases = getPurchases();
    if (!Purchases) return { success: false, error: 'RevenueCat is not available.' };

    const purchaseResult = await Purchases.purchasePackage(
      rawPackage as import('react-native-purchases').PurchasesPackage
    );
    const customerInfo = purchaseResult.customerInfo;
    const userCancelled = Boolean((purchaseResult as { userCancelled?: boolean }).userCancelled);

    if (userCancelled) {
      if (__DEV__) console.log('[RevenueCat] purchasePackage: user cancelled');
      return { success: false, cancelled: true };
    }

    if (customerInfo) {
      if (__DEV__) console.log('[RevenueCat] purchasePackage: success');
      return { success: true, customerInfo: mapCustomerInfo(customerInfo as Parameters<typeof mapCustomerInfo>[0]) };
    }

    if (__DEV__) console.warn('[RevenueCat] purchasePackage: success but no customerInfo');
    return { success: false, error: 'Purchase completed but no customer info returned.' };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; code?: string; message?: string };
    if (err?.userCancelled) {
      if (__DEV__) console.log('[RevenueCat] purchasePackage: cancelled (exception)');
      return { success: false, cancelled: true };
    }
    if (err?.code === 'PURCHASE_CANCELLED') {
      if (__DEV__) console.log('[RevenueCat] purchasePackage: cancelled');
      return { success: false, cancelled: true };
    }
    if (err?.code === 'DEFERRED' || err?.message?.toLowerCase().includes('pending')) {
      if (__DEV__) console.log('[RevenueCat] purchasePackage: pending');
      return { success: false, pending: true };
    }
    const message = err?.message ?? (err?.code ? String(err.code) : 'Purchase failed.');
    if (__DEV__) console.warn('[RevenueCat] purchasePackage: error', message);
    return { success: false, error: message };
  }
}

/**
 * Restore previous purchases. Use after "Restore" button or to refresh stale customer info.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!isNative) {
    return { success: false, error: 'Restore is not available on this platform.' };
  }
  try {
    const Purchases = getPurchases();
    if (!Purchases) return { success: false, error: 'RevenueCat is not available.' };

    const customerInfo = await Purchases.restorePurchases();
    if (customerInfo) {
      if (__DEV__) console.log('[RevenueCat] restorePurchases: success');
      return { success: true, customerInfo: mapCustomerInfo(customerInfo as Parameters<typeof mapCustomerInfo>[0]) };
    }
    if (__DEV__) console.log('[RevenueCat] restorePurchases: no purchases');
    return { success: false, error: 'No purchases to restore.' };
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    const message = err?.message ?? (err?.code ? String(err.code) : 'Restore failed.');
    if (__DEV__) console.warn('[RevenueCat] restorePurchases: error', message);
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// Subscription management URL (for Manage Subscription button)
// -----------------------------------------------------------------------------

/**
 * Get the subscription management URL from RevenueCat when available (e.g. Google Play).
 * Returns null on web or when not available.
 */
export async function getManagementUrl(): Promise<string | null> {
  if (!isNative) return null;
  try {
    const Purchases = getPurchases();
    if (!Purchases) return null;
    const info = await Purchases.getCustomerInfo();
    const raw = info as { managementURL?: string | null } | null | undefined;
    const url = raw?.managementURL;
    return typeof url === 'string' && url.trim().length > 0 ? url.trim() : null;
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] getManagementUrl failed:', e);
    return null;
  }
}
