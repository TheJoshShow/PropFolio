/**
 * Single source of truth for paywall UI state: plans, loading, error, purchasing/restoring,
 * entitlement verification. Consumes SubscriptionContext (offerings, hasProAccess). No duplicate
 * purchase flow; verifies entitlement after purchase before closing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isBillingConfigured } from '../config';
import {
  buildMapOfferingsInput,
  mapOfferingsToPlans,
  getFallbackOfferingsResult,
  type SubscriptionPlan,
  type OfferingsLoadResult,
} from '../services/offeringsMapper';
import { hasProAccess as checkHasProAccess } from '../services/revenueCat';
import type { RevenueCatCustomerInfo } from '../services/revenueCat';
import { getRestoreOutcome, type RestoreOutcome } from '../services/restorePurchases';
import { trackEvent } from '../services/analytics';
import { logPurchaseOutcome, logRestoreOutcome } from '../services/diagnostics';
import { recordFlowException } from '../services/monitoring/flowInstrumentation';

const LOG_TAG = '[Paywall]';

export interface UsePaywallStateOptions {
  /** Called after successful purchase (entitlement verified). */
  onPurchaseSuccess?: () => void;
  /** Called after successful restore. */
  onRestoreSuccess?: () => void;
  /** Called when user cancels purchase. */
  onPurchaseCancelled?: (planId: string) => void;
  /** Message shown when entitlement is delayed (timeout). Defaults to built-in copy. */
  entitlementDelayedMessage?: string;
}

export interface UsePaywallStateReturn {
  /** Mapped plans (recommended first). Empty when fallback or loading. */
  plansForDisplay: SubscriptionPlan[];
  /** Success with plans or fallback with message/retryLabel. */
  offeringsResult: OfferingsLoadResult;
  /** Subscription context is loading offerings/customerInfo. */
  isLoading: boolean;
  /** Last error from subscription context. */
  error: string | null;
  /** Id of plan currently being purchased. */
  purchasingId: string | null;
  /** Restore is in progress. */
  restoring: boolean;
  /** Pending approval message (e.g. Ask to Buy). */
  pendingMessage: string | null;
  /** User already has Pro. */
  hasProAccess: boolean;
  /** True while verifying entitlement after purchase (show "Activating…"). */
  entitlementVerifying: boolean;
  /** Non-null when entitlement is delayed (show message + Close). */
  entitlementDelayedMessage: string | null;
  /** Outcome of last restore (success / no_purchases / failed / offline). Clear when user dismisses. */
  restoreOutcome: RestoreOutcome | null;
  /** Clear restore outcome (e.g. after showing success card or retry). */
  clearRestoreOutcome: () => void;
  /** Purchase a plan. */
  handlePurchase: (plan: SubscriptionPlan) => Promise<void>;
  /** Restore previous purchases. */
  handleRestore: () => Promise<void>;
  /** Refresh offerings and customer info. */
  onRefresh: () => Promise<void>;
  /** Clear last error. */
  clearError: () => void;
  /** Set pending message (e.g. from purchase flow). */
  setPendingMessage: (msg: string | null) => void;
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

export function usePaywallState(
  options: UsePaywallStateOptions = {}
): UsePaywallStateReturn {
  const {
    onPurchaseSuccess,
    onRestoreSuccess,
    onPurchaseCancelled,
    entitlementDelayedMessage: entitlementDelayedMessageCopy = 'Your subscription is activating. You can close this screen—Pro access will appear shortly.',
  } = options;
  const {
    offerings,
    hasProAccess,
    isLoading,
    error,
    isAvailable,
    revenueCatSdkReady,
    refresh,
    purchase,
    restore,
    clearError: clearSubscriptionError,
    diagnostics,
  } = useSubscription();

  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreOutcome, setRestoreOutcome] = useState<RestoreOutcome | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [entitlementVerifying, setEntitlementVerifying] = useState(false);
  const [entitlementDelayedMessage, setEntitlementDelayedMessage] = useState<string | null>(null);
  const purchaseInProgressRef = useRef(false);
  const entitlementVerifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const offeringsResult: OfferingsLoadResult = useMemo(() => {
    if (error && !offerings?.current) return getFallbackOfferingsResult('error');
    if (Platform.OS === 'web' && isAvailable && !isLoading) {
      return getFallbackOfferingsResult('web_not_supported');
    }
    if (!isLoading && isAvailable && !revenueCatSdkReady && Platform.OS === 'ios') {
      return getFallbackOfferingsResult(isBillingConfigured() ? 'sdk_not_configured' : 'missing_api_key');
    }
    if (!isLoading && revenueCatSdkReady && !offerings?.current && isAvailable) {
      return getFallbackOfferingsResult('unavailable');
    }
    const input = buildMapOfferingsInput(offerings ?? null);
    if (!input) return getFallbackOfferingsResult(isLoading ? 'unavailable' : 'empty');
    return mapOfferingsToPlans(input);
  }, [offerings, isLoading, error, isAvailable, revenueCatSdkReady]);

  const plansForDisplay: SubscriptionPlan[] = useMemo(() => {
    if (offeringsResult.kind !== 'success') return [];
    const list = [...offeringsResult.plans];
    list.sort((a, b) => (a.isRecommended ? -1 : b.isRecommended ? 1 : 0));
    return list;
  }, [offeringsResult]);

  const onRefresh = useCallback(async () => {
    clearSubscriptionError();
    setPendingMessage(null);
    setEntitlementDelayedMessage(null);
    setRestoreOutcome(null);
    await refresh();
  }, [refresh, clearSubscriptionError]);

  const clearRestoreOutcome = useCallback(() => setRestoreOutcome(null), []);

  const handlePurchase = useCallback(
    async (plan: SubscriptionPlan) => {
      if (purchaseInProgressRef.current) {
        if (__DEV__) console.warn(LOG_TAG, 'Purchase ignored (already in progress)');
        return;
      }
      purchaseInProgressRef.current = true;
      setPurchasingId(plan.id);
      setEntitlementDelayedMessage(null);
      clearSubscriptionError();
      setPendingMessage(null);
      if (__DEV__) console.log(LOG_TAG, 'Purchase start', { planId: plan.id, planType: plan.type });
      if (plan.rawPackage == null || typeof plan.rawPackage !== 'object') {
        if (__DEV__) console.warn(LOG_TAG, 'Purchase blocked: missing raw package');
        setPendingMessage('This plan is not available right now. Pull down to refresh.');
        purchaseInProgressRef.current = false;
        setPurchasingId(null);
        return;
      }
      try {
        const result = await purchase(plan.rawPackage, plan.displayPackage);

        if (result.success && result.customerInfo) {
          const info = result.customerInfo as RevenueCatCustomerInfo;
          if (checkHasProAccess(info)) {
            if (__DEV__) console.log(LOG_TAG, 'Purchase success, entitlement immediate');
            onPurchaseSuccess?.();
            return;
          }
          if (__DEV__) console.log(LOG_TAG, 'Purchase success, entitlement delayed—verifying');
          setEntitlementVerifying(true);
          await refresh();
          entitlementVerifyTimeoutRef.current = setTimeout(() => {
            setEntitlementVerifying(false);
            setEntitlementDelayedMessage(entitlementDelayedMessageCopy);
            if (__DEV__) console.log(LOG_TAG, 'Entitlement delayed (timeout), show message');
          }, 10_000);
          return;
        }

        if ('cancelled' in result && result.cancelled) {
          if (__DEV__) console.log(LOG_TAG, 'Purchase cancelled');
          trackEvent('purchase_cancelled', { metadata: { planId: plan.id, planType: plan.type } });
          onPurchaseCancelled?.(plan.id);
          return;
        }
        if ('pending' in result && result.pending) {
          if (__DEV__) console.log(LOG_TAG, 'Purchase pending approval');
          setPendingMessage('Purchase is pending approval. You will get Pro access once approved.');
          return;
        }
        if ('error' in result && result.error) {
          if (__DEV__) console.warn(LOG_TAG, 'Purchase error', result.error);
          trackEvent('purchase_failed', {
            metadata: {
              outcome: typeof result.error === 'string' ? result.error.slice(0, 100) : 'unknown',
              planType: plan.type,
            },
          });
          setPendingMessage(null);
        }
      } finally {
        setPurchasingId(null);
        purchaseInProgressRef.current = false;
      }
    },
    [
      purchase,
      refresh,
      clearSubscriptionError,
      onPurchaseSuccess,
      onPurchaseCancelled,
      entitlementDelayedMessageCopy,
    ]
  );

  useEffect(() => {
    if (!entitlementVerifying || !hasProAccess) return;
    if (entitlementVerifyTimeoutRef.current) {
      clearTimeout(entitlementVerifyTimeoutRef.current);
      entitlementVerifyTimeoutRef.current = null;
    }
    setEntitlementVerifying(false);
    if (__DEV__) console.log(LOG_TAG, 'Entitlement verified after refresh');
    onPurchaseSuccess?.();
  }, [entitlementVerifying, hasProAccess, onPurchaseSuccess]);

  useEffect(() => {
    return () => {
      if (entitlementVerifyTimeoutRef.current) {
        clearTimeout(entitlementVerifyTimeoutRef.current);
      }
    };
  }, []);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    clearSubscriptionError();
    setPendingMessage(null);
    setRestoreOutcome(null);
    trackEvent('restore_started', { metadata: {} });
    if (__DEV__) console.log(LOG_TAG, 'Restore start');
    try {
      const result = await restore();
      const outcome = getRestoreOutcome(result);
      setRestoreOutcome(outcome);
      if (outcome.status === 'success') {
        trackEvent('restore_succeeded', { metadata: {} });
        logRestoreOutcome('success');
        if (__DEV__) console.log(LOG_TAG, 'Restore success, entitlement active');
        onRestoreSuccess?.();
      } else {
        trackEvent('restore_failed', { metadata: {} });
        logRestoreOutcome(outcome.status);
        if (__DEV__) console.log(LOG_TAG, 'Restore outcome', outcome.status, outcome.message);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Restore failed unexpectedly.';
      setRestoreOutcome({
        status: 'failed',
        title: 'Restore failed',
        message,
      });
      recordFlowException('paywall_restore_throw', e, { stage: 'restore' });
      if (__DEV__) console.warn(LOG_TAG, 'Restore threw', e);
    } finally {
      setRestoring(false);
    }
  }, [restore, clearSubscriptionError, onRestoreSuccess]);

  const clearError = useCallback(() => {
    clearSubscriptionError();
    setPendingMessage(null);
  }, [clearSubscriptionError]);

  return {
    plansForDisplay,
    offeringsResult,
    isLoading,
    error,
    purchasingId,
    restoring,
    pendingMessage,
    setPendingMessage,
    hasProAccess,
    entitlementVerifying,
    entitlementDelayedMessage,
    restoreOutcome,
    clearRestoreOutcome,
    handlePurchase,
    handleRestore,
    onRefresh,
    clearError,
    diagnostics,
  };
}
