/**
 * Subscription context: single source of truth for entitlement (hasProAccess) and subscription state.
 * RevenueCat offerings, purchase, restore; caches last-known state for offline/error so we don't revoke Pro prematurely.
 * Connects to auth: identifies user in RevenueCat on sign-in/session restore, logs out on sign-out.
 *
 * Refresh points (why each exists):
 * - App launch / auth restore: load() runs when session?.id is set so entitlement is correct from
 *   first paint; avoids showing free then flashing to pro (or vice versa).
 * - Login: same as above (onAuthStateChange sets session => effect runs load()).
 * - Purchase success: refresh customer info (silent) after success so backend is synced; no loading flash.
 * - Restore success: same silent refresh so state and backend stay in sync.
 * - App foreground: refresh() when app becomes active (throttled) so entitlement updated after
 *   purchase on another device, subscription expiry, or restore in Settings.
 *
 * Edge-case handling (do not revoke on uncertain state):
 * - On load/refresh error we do NOT set customerInfo to null; we keep previous (or cached) state.
 * - Offline / delayed refresh: we hydrate from persisted cache so Pro is not removed until we have
 *   definitive inactive state from RevenueCat.
 * - Expired users: only when customerInfo (or cache) has isActive false do we show Free and gate.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import {
  configureRevenueCat,
  logOutRevenueCat,
  getOfferings,
  getCustomerInfo,
  purchasePackage,
  restorePurchases,
  hasProAccess as checkProAccess,
  type RevenueCatOffering,
  type RevenueCatPackage,
  type RevenueCatCustomerInfo,
  type RawPurchasesPackage,
  type PurchaseResult,
  type RestoreResult,
} from '../services/revenueCat';
import { syncSubscriptionStatus } from '../services/importLimits';
import { getSupabase } from '../services/supabase';
import {
  getSubscriptionStatusDisplay,
  getSubscriptionStatusDisplayFromCache,
  buildCacheSnapshotFromCustomerInfo,
  type SubscriptionStatusDisplay,
} from '../services/subscriptionStatusDisplay';
import {
  getCachedSubscription,
  setCachedSubscription,
  clearCachedSubscription,
  type CachedSubscriptionSnapshot,
} from '../services/subscriptionCache';
import { logEntitlementState, logErrorSafe, logOfferingsLoad, logStoreStep } from '../services/diagnostics';
import { recordFlowException, recordFlowIssue } from '../services/monitoring/flowInstrumentation';
import { getBillingConfig, isBillingConfigured } from '../config';
import { isEntitlementBootstrapPending as computeEntitlementBootstrapPending } from '../subscription/entitlementPolicy';

export interface OfferingsState {
  current: RevenueCatOffering | null;
  rawCurrentPackages: RawPurchasesPackage[];
}

interface SubscriptionContextValue {
  /** Current offering (monthly/annual packages). */
  offerings: OfferingsState | null;
  /** Latest customer info from RevenueCat (refreshed after purchase/restore). */
  customerInfo: RevenueCatCustomerInfo | null;
  /** True if user has active Pro entitlement. */
  hasProAccess: boolean;
  /** UI-safe subscription status (plan name, entitlement, renewal when available). */
  subscriptionStatus: SubscriptionStatusDisplay;
  /** Loading offerings or customer info. */
  isLoading: boolean;
  /** Last error message (e.g. network, restore failed). */
  error: string | null;
  /** User session present (legacy alias for “can attempt billing flows”). */
  isAvailable: boolean;
  /** True after RevenueCat configure() succeeded for this session (API key present and SDK init OK). */
  revenueCatSdkReady: boolean;
  /**
   * True while signed in, subscription load in flight, and neither customerInfo nor cache is present yet.
   * UI should not treat entitlement as definitively "free" for premium upsells during this window.
   */
  entitlementBootstrapPending: boolean;
  /** Fetch offerings and customer info (e.g. on mount or pull-to-refresh). */
  refresh: () => Promise<void>;
  /** Purchase a package (use raw package from offerings.rawCurrentPackages). */
  purchase: (rawPackage: RawPurchasesPackage, displayPackage: RevenueCatPackage) => Promise<PurchaseResult>;
  /** Restore previous purchases. */
  restore: () => Promise<RestoreResult>;
  /** Clear last error. */
  clearError: () => void;
  /** Internal diagnostics for QA/debug UI. */
  diagnostics: {
    initialized: boolean;
    platform: 'ios' | 'android' | 'web';
    billingConfigured: boolean;
    billingKeySource: string;
    offeringsLoaded: boolean;
    entitlementActive: boolean;
    lastError: string | null;
  };
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [offerings, setOfferings] = useState<OfferingsState | null>(null);
  const [customerInfo, setCustomerInfo] = useState<RevenueCatCustomerInfo | null>(null);
  /** Last-known state from persistence; used when offline or when refresh fails so we don't revoke Pro. */
  const [cachedSnapshot, setCachedSnapshot] = useState<CachedSubscriptionSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueCatSdkReady, setRevenueCatSdkReady] = useState(false);
  const lastForegroundRefreshRef = useRef<number>(0);
  const refreshRef = useRef<() => Promise<void>>(() => Promise.resolve());
  /** Set to session id only after initial `load()` completes — avoids RC refresh racing boot. */
  const foregroundRefreshSessionRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(session?.id);
  const lastKnownUserIdRef = useRef<string | undefined>(session?.id);
  sessionIdRef.current = session?.id;
  if (session?.id) lastKnownUserIdRef.current = session.id;

  const load = useCallback(async () => {
    const uid = session?.id;
    if (!uid) {
      setOfferings(null);
      setCustomerInfo(null);
      setRevenueCatSdkReady(false);
      setIsLoading(false);
      return;
    }
    const markForegroundEligible = () => {
      if (sessionIdRef.current === uid) {
        foregroundRefreshSessionRef.current = uid;
      }
    };
    setIsLoading(true);
    const configured = await configureRevenueCat(uid);
    if (!configured) {
      setRevenueCatSdkReady(false);
      setOfferings({ current: null, rawCurrentPackages: [] });
      setCustomerInfo(null);
      logStoreStep('configure_failed', { billingEnvSet: isBillingConfigured() });
      // Do not clear cachedSnapshot: offline or RC unavailable; keep showing last-known state.
      setIsLoading(false);
      markForegroundEligible();
      return;
    }
    setRevenueCatSdkReady(true);
    setError(null);
    try {
      const [offeringsResult, info] = await Promise.all([getOfferings(), getCustomerInfo()]);
      if (offeringsResult) {
        setOfferings({
          current: offeringsResult.current,
          rawCurrentPackages: offeringsResult.rawCurrentPackages,
        });
      } else {
        setOfferings({ current: null, rawCurrentPackages: [] });
        setError('Could not load subscription plans. Check your connection and try again.');
        logStoreStep('offerings_null', {});
        recordFlowIssue('billing_paywall_offerings_empty', { stage: 'offerings', recoverable: true });
      }
      setCustomerInfo(info ?? null);
      // Persist so next launch or failed refresh can show this state (do not revoke on error).
      const snapshot = buildCacheSnapshotFromCustomerInfo(info ?? null);
      if (snapshot) await setCachedSubscription(uid, snapshot);
      logEntitlementState({ hasProAccess: checkProAccess(info ?? null), source: 'fresh' });
      logOfferingsLoad({
        planCount: offeringsResult?.rawCurrentPackages?.length ?? 0,
        hasOfferings: !!offeringsResult?.current,
        error: !offeringsResult,
      });
    } catch (e) {
      // Do not set customerInfo to null: keep previous or cached state so we don't revoke Pro.
      recordFlowException('billing_subscription_load_failed', e, { stage: 'subscription_load' });
      setError(e instanceof Error ? e.message : 'Couldn’t load subscription. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      markForegroundEligible();
    }
  }, [session?.id]);

  // App launch & auth restore: hydrate from cache then load. Sign-out: clear state and cache.
  useEffect(() => {
    if (session?.id) {
      foregroundRefreshSessionRef.current = null;
      let cancelled = false;
      void (async () => {
        try {
          const cached = await getCachedSubscription(session!.id);
          if (!cancelled) {
            setCachedSnapshot(cached ?? null);
            if (cached) logEntitlementState({ hasProAccess: cached.hasProAccess, source: 'cache' });
          }
          await load();
        } catch (e) {
          if (!cancelled) {
            recordFlowException('billing_subscription_boot_effect_failed', e, { stage: 'subscription_boot' });
            setIsLoading(false);
            setRevenueCatSdkReady(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    } else {
      foregroundRefreshSessionRef.current = null;
      const prevId = lastKnownUserIdRef.current;
      if (prevId) {
        void clearCachedSubscription(prevId).catch((e) =>
          logErrorSafe('SubscriptionContext clearCachedSubscription on sign-out', e)
        );
      }
      logOutRevenueCat();
      setOfferings(null);
      setCustomerInfo(null);
      setCachedSnapshot(null);
      setError(null);
      setRevenueCatSdkReady(false);
      setIsLoading(false);
    }
  }, [session?.id, load]);

  // Entitlement: prefer fresh customerInfo; fall back to cache so we never revoke on uncertain state.
  const hasProAccess = customerInfo
    ? checkProAccess(customerInfo)
    : (cachedSnapshot?.hasProAccess ?? false);

  const entitlementBootstrapPending = computeEntitlementBootstrapPending({
    sessionUserId: session?.id,
    subscriptionLoading: isLoading,
    customerInfoPresent: customerInfo !== null,
    cachePresent: cachedSnapshot !== null,
  });
  const subscriptionStatus = useMemo(
    () =>
      customerInfo
        ? getSubscriptionStatusDisplay(customerInfo)
        : getSubscriptionStatusDisplayFromCache(cachedSnapshot),
    [customerInfo, cachedSnapshot]
  );

  useEffect(() => {
    // Guard against overwriting entitlement_active with a default "false" before we have
    // either cachedSnapshot or fresh customerInfo loaded.
    if (session?.id && !isLoading && (customerInfo !== null || cachedSnapshot !== null)) {
      void syncSubscriptionStatus(getSupabase(), session.id, hasProAccess).catch((e) =>
        logErrorSafe('SubscriptionContext syncSubscriptionStatus effect', e)
      );
    }
  }, [session?.id, hasProAccess, customerInfo, cachedSnapshot, isLoading]);

  const refresh = useCallback(async () => {
    const uid = session?.id;
    if (!uid) return;
    const markForegroundEligible = () => {
      if (sessionIdRef.current === uid) {
        foregroundRefreshSessionRef.current = uid;
      }
    };
    const configured = await configureRevenueCat(uid);
    if (!configured) {
      setRevenueCatSdkReady(false);
      setOfferings({ current: null, rawCurrentPackages: [] });
      logStoreStep('refresh_configure_failed', { billingEnvSet: isBillingConfigured() });
      markForegroundEligible();
      return;
    }
    setRevenueCatSdkReady(true);
    setError(null);
    setIsLoading(true);
    try {
      const [offeringsResult, info] = await Promise.all([getOfferings(), getCustomerInfo()]);
      if (offeringsResult) {
        setOfferings({
          current: offeringsResult.current,
          rawCurrentPackages: offeringsResult.rawCurrentPackages,
        });
      } else {
        setOfferings({ current: null, rawCurrentPackages: [] });
        setError('Could not load subscription plans. Check your connection and try again.');
      }
      setCustomerInfo(info ?? null);
      const snapshot = buildCacheSnapshotFromCustomerInfo(info ?? null);
      if (snapshot) await setCachedSubscription(uid, snapshot);
    } catch (e) {
      // Do not overwrite customerInfo: keep showing last state (or cache) so we don't revoke Pro.
      recordFlowException('billing_subscription_refresh_failed', e, { stage: 'subscription_refresh' });
      setError(e instanceof Error ? e.message : 'Couldn’t load subscription. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      markForegroundEligible();
    }
  }, [session?.id]);

  const refreshCustomerInfoOnly = useCallback(async () => {
    if (!session?.id) return;
    try {
      const info = await getCustomerInfo();
      setCustomerInfo(info ?? null);
      const snapshot = buildCacheSnapshotFromCustomerInfo(info ?? null);
      if (snapshot) await setCachedSubscription(session.id, snapshot);
    } catch (e) {
      logErrorSafe('SubscriptionContext refreshCustomerInfoOnly', e);
    }
  }, [session?.id]);

  refreshRef.current = refresh;

  // App foreground: refresh entitlement when returning to app (e.g. bought on web, or expired).
  // Throttled to avoid excessive calls when toggling app state quickly.
  const FOREGROUND_REFRESH_THROTTLE_MS = 30_000;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active' || !sessionIdRef.current) return;
      if (foregroundRefreshSessionRef.current !== sessionIdRef.current) return;
      const now = Date.now();
      if (now - lastForegroundRefreshRef.current < FOREGROUND_REFRESH_THROTTLE_MS) return;
      lastForegroundRefreshRef.current = now;
      refreshRef.current();
    });
    return () => sub.remove();
  }, []);

  const purchase = useCallback(
    async (rawPackage: RawPurchasesPackage, _displayPackage: RevenueCatPackage): Promise<PurchaseResult> => {
      setError(null);
      if (rawPackage == null || typeof rawPackage !== 'object') {
        const msg = 'Subscription plan is not available. Pull to refresh and try again.';
        setError(msg);
        recordFlowIssue('billing_purchase_invalid_package', { stage: 'purchase', recoverable: true });
        return { success: false, error: msg };
      }
      const result = await purchasePackage(rawPackage);
      if (result.success && result.customerInfo && session?.id) {
        setCustomerInfo(result.customerInfo);
        const snapshot = buildCacheSnapshotFromCustomerInfo(result.customerInfo);
        if (snapshot) await setCachedSubscription(session.id, snapshot);
        await refreshCustomerInfoOnly();
      }
      if (!result.success && 'error' in result) {
        setError(result.error);
      }
      return result;
    },
    [session?.id, refreshCustomerInfoOnly]
  );

  const restore = useCallback(async (): Promise<RestoreResult> => {
    setError(null);
    const result = await restorePurchases();
    if (result.success && result.customerInfo && session?.id) {
      setCustomerInfo(result.customerInfo);
      const snapshot = buildCacheSnapshotFromCustomerInfo(result.customerInfo);
      if (snapshot) await setCachedSubscription(session.id, snapshot);
      await refreshCustomerInfoOnly();
    }
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, [session?.id, refreshCustomerInfoOnly]);

  const clearError = useCallback(() => setError(null), []);

  const isAvailable = !!session?.id;
  const billing = getBillingConfig();

  const value: SubscriptionContextValue = {
    offerings,
    customerInfo,
    hasProAccess,
    subscriptionStatus,
    isLoading,
    error,
    isAvailable,
    revenueCatSdkReady,
    entitlementBootstrapPending,
    refresh,
    purchase,
    restore,
    clearError,
    diagnostics: {
      initialized: revenueCatSdkReady,
      platform: billing.platform,
      billingConfigured: billing.configured,
      billingKeySource: billing.keySource,
      offeringsLoaded: Boolean(offerings?.current),
      entitlementActive: hasProAccess,
      lastError: error,
    },
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
