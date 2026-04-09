import { useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/features/auth';
import {
  balanceFromCreditState,
  fetchCreditWalletSnapshot,
  type MonthlyIncludedGrantStatus,
  type UserCreditStateRpc,
} from '@/services/credits';
import { interpretPurchaseError } from '@/services/revenuecat/purchaseOutcome';
import {
  getRevenueCatEnvironmentBlockReason,
  revenueCatService,
} from '@/services/revenuecat/revenueCatService';
import type { CustomerInfoSummary, PaywallCatalog } from '@/services/revenuecat/types';
import { patchBillingDiagnosticsSub } from '@/services/billing/billingDiagnosticsStore';
import {
  computeAppAccess,
  fetchUserSubscriptionStatus,
  hasPremiumAccess,
  subscriptionStatusDetail,
  subscriptionTierLabel,
  type AppAccessDisplayState,
  type UserSubscriptionStatusRow,
} from '@/services/subscription';
import * as membershipRules from '@/services/subscription/membershipCreditRules';
import { tryGetSupabaseClient } from '@/services/supabase';

export type SubscriptionRefreshResult = {
  isPremium: boolean;
  hasAppAccess: boolean;
  creditBalance: number;
  hasImportCredits: boolean;
  canPurchaseCreditPacks: boolean;
  canRunImport: boolean;
  canAccessApp: boolean;
};

function subscriptionRefreshPayload(hasAppAccess: boolean, balance: number): SubscriptionRefreshResult {
  return {
    isPremium: hasAppAccess,
    hasAppAccess,
    creditBalance: balance,
    hasImportCredits: membershipRules.hasImportCredits({ creditBalance: balance }),
    canPurchaseCreditPacks: membershipRules.canPurchaseCreditPacks({ hasAppAccess }),
    canRunImport: membershipRules.canRunImport({
      accessHydrated: true,
      hasAppAccess,
      creditBalance: balance,
    }),
    canAccessApp: membershipRules.canAccessApp({ accessHydrated: true, hasAppAccess }),
  };
}

type SubscriptionContextValue = {
  customerInfo: CustomerInfoSummary;
  /** @deprecated Prefer `hasAppAccess` or `hasActiveMembership` — same value. */
  isPremium: boolean;
  /** Membership active: user may use the app (portfolio, etc.). Ignores credit balance. */
  hasAppAccess: boolean;
  /** Same as `hasAppAccess` — explicit product language (“active membership”). */
  hasActiveMembership: boolean;
  canAccessApp: boolean;
  hasImportCredits: boolean;
  canPurchaseCreditPacks: boolean;
  canRunImport: boolean;
  /** First server+store subscription hydration finished for this session (avoids gate flicker). */
  accessHydrated: boolean;
  accessDisplayState: AppAccessDisplayState;
  tierLabel: string;
  statusDetail: string;
  /** Server wallet balance — authoritative for import credits (signup, monthly grants, purchases). */
  creditBalance: number;
  /**
   * Apply `balance_after` from `import-property` (or similar) before a full `refresh()` completes.
   * Does not replace `refresh()` — only avoids stale UI between success and reconciliation.
   */
  applyCreditBalanceHint: (balanceAfter: number | null | undefined) => void;
  /** True while the first wallet sync runs for a signed-in user — avoid showing 0 as final. */
  creditsLoading: boolean;
  /** True only while the server credit wallet RPC is in flight (not full membership refresh). */
  creditWalletSyncing: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  lastError: string | null;
  /** Non-error store messages (e.g. payment pending). */
  storeNotice: string | null;
  clearStoreNotice: () => void;
  refresh: () => Promise<SubscriptionRefreshResult>;
  /** Wallet snapshot only (no RevenueCat, does not toggle `creditWalletSyncing`) — Import focus + post-import reconcile. */
  refreshCreditWalletOnly: () => Promise<void>;
  loadPaywallCatalog: () => Promise<PaywallCatalog>;
  /** Monthly membership (default package from the subscription offering). */
  purchaseSubscription: () => Promise<void>;
  /** Consumable credit pack from the credits offering (`refKey` from catalog). */
  purchaseCreditsPack: (refKey: string) => Promise<void>;
  /** @deprecated Use `purchaseSubscription`. */
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  openPaywall: () => void;
  openCreditTopUp: () => void;
  /** Latest `get_user_credit_state` payload (null if unavailable). */
  creditWalletState: UserCreditStateRpc | null;
  /** Server ledger check for monthly included credit vs current `current_period_start`. */
  monthlyIncludedGrantStatus: MonthlyIncludedGrantStatus;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const initialSummary: CustomerInfoSummary = {
  status: 'unknown',
  activeEntitlements: [],
};

async function loadCreditWalletForUser(userId: string | undefined | null): Promise<{
  balance: number;
  state: UserCreditStateRpc | null;
  monthlyIncluded: MonthlyIncludedGrantStatus;
}> {
  const client = tryGetSupabaseClient();
  if (!client || !userId) {
    return { balance: 0, state: null, monthlyIncluded: 'unknown' };
  }
  try {
    const { state, monthlyIncluded } = await fetchCreditWalletSnapshot(client);
    return { balance: balanceFromCreditState(state), state, monthlyIncluded };
  } catch {
    return { balance: 0, state: null, monthlyIncluded: 'unknown' };
  }
}

async function loadServerSubscriptionRow(
  userId: string | undefined | null,
): Promise<{ row: UserSubscriptionStatusRow | null; error: Error | null }> {
  const client = tryGetSupabaseClient();
  if (!client || !userId) {
    return { row: null, error: null };
  }
  return fetchUserSubscriptionStatus(client);
}

const WALLET_RPC_TIMEOUT_MS = 16_000;

type WalletLoadResult = Awaited<ReturnType<typeof loadCreditWalletForUser>>;

/** Race wallet RPC so `creditWalletSyncing` cannot hang indefinitely if Supabase stalls. */
async function loadCreditWalletForUserWithTimeout(
  userId: string | undefined | null,
): Promise<WalletLoadResult | null> {
  if (!userId) {
    return loadCreditWalletForUser(userId);
  }
  try {
    return await Promise.race([
      loadCreditWalletForUser(userId),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('wallet_timeout')), WALLET_RPC_TIMEOUT_MS),
      ),
    ]);
  } catch (e) {
    if (e instanceof Error && e.message === 'wallet_timeout') {
      console.warn('[Subscription] Credit wallet RPC timed out');
      return null;
    }
    return loadCreditWalletForUser(userId);
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const refreshGenerationRef = useRef(0);
  const serverSubscriptionRef = useRef<UserSubscriptionStatusRow | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoSummary>(initialSummary);
  const [serverSubscription, setServerSubscription] = useState<UserSubscriptionStatusRow | null>(null);
  const [serverSubscriptionFetchFailed, setServerSubscriptionFetchFailed] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const creditBalanceRef = useRef(0);
  const [creditWalletState, setCreditWalletState] = useState<UserCreditStateRpc | null>(null);
  const [monthlyIncludedGrantStatus, setMonthlyIncludedGrantStatus] =
    useState<MonthlyIncludedGrantStatus>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [creditWalletSyncing, setCreditWalletSyncing] = useState(false);
  const [accessHydrated, setAccessHydrated] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [storeNotice, setStoreNotice] = useState<string | null>(null);

  /** Nested `refresh()` / restore / purchase wallet loads must not clear `creditWalletSyncing` early. */
  const creditWalletSyncDepthRef = useRef(0);

  const enterCreditWalletSync = useCallback(() => {
    creditWalletSyncDepthRef.current += 1;
    if (creditWalletSyncDepthRef.current === 1) {
      setCreditWalletSyncing(true);
    }
  }, []);

  const exitCreditWalletSync = useCallback(() => {
    creditWalletSyncDepthRef.current = Math.max(0, creditWalletSyncDepthRef.current - 1);
    if (creditWalletSyncDepthRef.current === 0) {
      setCreditWalletSyncing(false);
    }
  }, []);

  const resetCreditWalletSync = useCallback(() => {
    creditWalletSyncDepthRef.current = 0;
    setCreditWalletSyncing(false);
  }, []);

  const clearStoreNotice = useCallback(() => setStoreNotice(null), []);

  const applyCreditBalanceHint = useCallback((balanceAfter: number | null | undefined) => {
    if (typeof balanceAfter === 'number' && Number.isFinite(balanceAfter) && balanceAfter >= 0) {
      const b = Math.floor(balanceAfter);
      creditBalanceRef.current = b;
      setCreditBalance(b);
    }
  }, []);

  useEffect(() => {
    creditBalanceRef.current = creditBalance;
  }, [creditBalance]);

  useEffect(() => {
    serverSubscriptionRef.current = serverSubscription;
  }, [serverSubscription]);

  useEffect(() => {
    return revenueCatService.subscribeCustomerInfo((summary) => {
      setCustomerInfo(summary);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) {
      resetCreditWalletSync();
      setAccessHydrated(true);
      setServerSubscription(null);
      setServerSubscriptionFetchFailed(false);
      setCreditWalletState(null);
      setMonthlyIncludedGrantStatus('unknown');
      return;
    }
    setAccessHydrated(false);
  }, [user?.id, resetCreditWalletSync]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    void (async () => {
      try {
        await revenueCatService.syncAppUserId(user?.id ?? null);
      } catch (e) {
        console.warn('[RevenueCat] syncAppUserId:', e);
      }
    })();
  }, [isReady, user?.id]);

  const refresh = useCallback(async (): Promise<SubscriptionRefreshResult> => {
    const gen = ++refreshGenerationRef.current;
    setLastError(null);
    setIsLoading(true);
    try {
      if (!user?.id) {
        resetCreditWalletSync();
        setCustomerInfo(initialSummary);
        creditBalanceRef.current = 0;
        setCreditBalance(0);
        setCreditWalletState(null);
        setMonthlyIncludedGrantStatus('unknown');
        setServerSubscription(null);
        setServerSubscriptionFetchFailed(false);
        return subscriptionRefreshPayload(false, 0);
      }

      await revenueCatService.initialize();
      if (isReady) {
        try {
          await revenueCatService.syncAppUserId(user?.id);
        } catch {
          /* configure / login failure — still attempt reads */
        }
      }

      enterCreditWalletSync();
      let walletLoad: WalletLoadResult | null;
      try {
        walletLoad = await loadCreditWalletForUserWithTimeout(user.id);
      } finally {
        exitCreditWalletSync();
      }

      if (walletLoad) {
        creditBalanceRef.current = walletLoad.balance;
        setCreditBalance(walletLoad.balance);
        setCreditWalletState(walletLoad.state);
        setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
      }
      const balance = walletLoad?.balance ?? creditBalanceRef.current;

      const [info, subRes] = await Promise.all([
        revenueCatService.getCustomerInfo(),
        loadServerSubscriptionRow(user.id),
      ]);

      setCustomerInfo(info);
      if (subRes.error) {
        setServerSubscriptionFetchFailed(true);
      } else {
        setServerSubscription(subRes.row);
        setServerSubscriptionFetchFailed(false);
      }

      const rowForAccess = subRes.error ? serverSubscriptionRef.current : subRes.row;
      const access = computeAppAccess({
        accessHydrated: true,
        serverRow: rowForAccess,
        storeSummary: info,
        serverFetchFailed: Boolean(subRes.error),
        revenueCatEnvironmentBlock: getRevenueCatEnvironmentBlockReason(),
      });

      return subscriptionRefreshPayload(access.hasAppAccess, balance);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Membership sync failed');
      try {
        enterCreditWalletSync();
        let walletLoad: WalletLoadResult | null;
        try {
          walletLoad = await loadCreditWalletForUserWithTimeout(user?.id);
        } finally {
          exitCreditWalletSync();
        }
        if (walletLoad) {
          creditBalanceRef.current = walletLoad.balance;
          setCreditBalance(walletLoad.balance);
          setCreditWalletState(walletLoad.state);
          setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
        }
        const balance = walletLoad?.balance ?? creditBalanceRef.current;
        const subRes = await loadServerSubscriptionRow(user?.id);
        if (subRes.error) {
          setServerSubscriptionFetchFailed(true);
        } else {
          setServerSubscription(subRes.row);
          setServerSubscriptionFetchFailed(false);
        }
        const info = await revenueCatService.getCustomerInfo().catch(() => initialSummary);
        setCustomerInfo(info);
        const rowForAccessCatch = subRes.error ? serverSubscriptionRef.current : subRes.row;
        const access = computeAppAccess({
          accessHydrated: true,
          serverRow: rowForAccessCatch,
          storeSummary: info,
          serverFetchFailed: Boolean(subRes.error),
          revenueCatEnvironmentBlock: getRevenueCatEnvironmentBlockReason(),
        });
        return subscriptionRefreshPayload(access.hasAppAccess, balance);
      } catch {
        return subscriptionRefreshPayload(false, 0);
      }
    } finally {
      setIsLoading(false);
      if (refreshGenerationRef.current === gen) {
        setAccessHydrated(true);
      }
    }
  }, [isReady, user?.id, resetCreditWalletSync, enterCreditWalletSync, exitCreditWalletSync]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    void refresh();
  }, [isReady, refresh]);

  const loadPaywallCatalog = useCallback(async (): Promise<PaywallCatalog> => {
    try {
      await revenueCatService.initialize();
      if (isReady) {
        await revenueCatService.syncAppUserId(user?.id ?? null);
      }
    } catch {
      /* continue — catalog will report SDK message */
    }
    return revenueCatService.loadPaywallCatalog();
  }, [isReady, user?.id]);

  const applyPurchaseResult = useCallback(
    async (result: Awaited<ReturnType<typeof revenueCatService.purchaseByRefKey>>) => {
      if (result.outcome === 'cancelled') {
        setLastError(null);
        return;
      }
      if (result.outcome === 'pending') {
        setLastError(null);
        setStoreNotice(result.message);
        return;
      }
      if (result.outcome === 'error') {
        setLastError(result.message);
        return;
      }
      setCustomerInfo(result.customerInfo);
      setLastError(null);
      enterCreditWalletSync();
      let walletLoad: WalletLoadResult | null;
      try {
        walletLoad = await loadCreditWalletForUserWithTimeout(user?.id);
      } finally {
        exitCreditWalletSync();
      }
      if (walletLoad) {
        creditBalanceRef.current = walletLoad.balance;
        setCreditBalance(walletLoad.balance);
        setCreditWalletState(walletLoad.state);
        setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
      }
      const subRes = await loadServerSubscriptionRow(user?.id);
      if (subRes.error) {
        setServerSubscriptionFetchFailed(true);
      } else {
        setServerSubscription(subRes.row);
        setServerSubscriptionFetchFailed(false);
      }
      await revenueCatService.invalidateCustomerInfoCache();
    },
    [user?.id, enterCreditWalletSync, exitCreditWalletSync],
  );

  const purchaseSubscription = useCallback(async () => {
    setStoreNotice(null);
    setLastError(null);
    setIsPurchasing(true);
    try {
      if (isReady) {
        try {
          await revenueCatService.syncAppUserId(user?.id ?? null);
        } catch (e) {
          const r = interpretPurchaseError(e);
          if (r.outcome === 'error') {
            setLastError(r.message);
            return;
          }
          if (r.outcome === 'pending') {
            setStoreNotice(r.message);
            return;
          }
        }
      }
      const result = await revenueCatService.purchaseDefaultSubscription();
      await applyPurchaseResult(result);
    } catch (e) {
      const r = interpretPurchaseError(e);
      if (r.outcome === 'error') {
        setLastError(r.message);
      } else if (r.outcome === 'pending') {
        setStoreNotice(r.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [applyPurchaseResult, isReady, user?.id]);

  const restorePurchases = useCallback(async () => {
    setLastError(null);
    setStoreNotice(null);
    setIsRestoring(true);
    try {
      if (isReady) {
        await revenueCatService.syncAppUserId(user?.id ?? null);
      }
      const info = await revenueCatService.restorePurchases();
      setCustomerInfo(info);
      enterCreditWalletSync();
      let walletLoad: WalletLoadResult | null;
      try {
        walletLoad = await loadCreditWalletForUserWithTimeout(user?.id);
      } finally {
        exitCreditWalletSync();
      }
      if (walletLoad) {
        creditBalanceRef.current = walletLoad.balance;
        setCreditBalance(walletLoad.balance);
        setCreditWalletState(walletLoad.state);
        setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
      }
      const subRes = await loadServerSubscriptionRow(user?.id);
      if (subRes.error) {
        setServerSubscriptionFetchFailed(true);
      } else {
        setServerSubscription(subRes.row);
        setServerSubscriptionFetchFailed(false);
      }
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setIsRestoring(false);
    }
  }, [isReady, user?.id, enterCreditWalletSync, exitCreditWalletSync]);

  const openPaywall = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  const openCreditTopUp = useCallback(() => {
    router.push('/credit-top-up');
  }, [router]);

  /**
   * Wallet snapshot only — does **not** set `creditWalletSyncing`.
   * Import screen focus + post-import reconcile must not flip that flag or `useFocusEffect([sub])` will
   * re-run forever (new `sub` every render), blocking `canRunImport` and flickering ImportCreditNotice.
   */
  const refreshCreditWalletOnly = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    try {
      const walletLoad = await loadCreditWalletForUserWithTimeout(user.id);
      if (walletLoad) {
        creditBalanceRef.current = walletLoad.balance;
        setCreditBalance(walletLoad.balance);
        setCreditWalletState(walletLoad.state);
        setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
      }
    } catch {
      /* keep prior balance; timeout path returns null from loader */
    }
  }, [user?.id]);

  const accessComputed = useMemo(
    () =>
      computeAppAccess({
        accessHydrated,
        serverRow: serverSubscription,
        storeSummary: customerInfo,
        serverFetchFailed: serverSubscriptionFetchFailed,
        revenueCatEnvironmentBlock: getRevenueCatEnvironmentBlockReason(),
      }),
    [accessHydrated, serverSubscription, customerInfo, serverSubscriptionFetchFailed],
  );

  const { hasAppAccess, displayState: accessDisplayState } = accessComputed;
  const isPremium = hasAppAccess;

  const tierLabel = useMemo(() => {
    if (!accessHydrated || accessDisplayState === 'loading') {
      return 'Checking access…';
    }
    if (!hasAppAccess) {
      if (accessDisplayState === 'rc_misconfigured') {
        return 'Billing unavailable in this build';
      }
      if (accessDisplayState === 'unknown') {
        return 'Could not verify membership';
      }
      if (accessDisplayState === 'billing_issue') {
        return 'Billing issue';
      }
      return 'Membership required';
    }
    return subscriptionTierLabel(customerInfo);
  }, [accessHydrated, accessDisplayState, hasAppAccess, customerInfo]);

  const statusDetail = useMemo(() => {
    if (!accessHydrated || accessDisplayState === 'loading') {
      return 'Verifying your membership with PropFolio and the App Store…';
    }
    if (!hasAppAccess) {
      if (accessDisplayState === 'rc_misconfigured') {
        return (
          getRevenueCatEnvironmentBlockReason() ??
          'Fix RevenueCat configuration (public appl_ key, EAS env), use a dev build or TestFlight—not Expo Go—then rebuild.'
        );
      }
      if (accessDisplayState === 'unknown') {
        return (
          customerInfo.lastStoreError ??
          'We could not confirm membership with Apple. Check your connection, tap Restore purchases, or subscribe from the paywall.'
        );
      }
      if (accessDisplayState === 'billing_issue') {
        return 'Update payment in the App Store to restore access.';
      }
      if (accessDisplayState === 'expired') {
        return 'Your membership ended. Resubscribe ($1.99/mo after a free first month) to continue.';
      }
      return 'Active membership is required. Import credits do not unlock the app without it.';
    }
    return subscriptionStatusDetail(customerInfo);
  }, [accessHydrated, accessDisplayState, hasAppAccess, customerInfo]);

  const creditsLoading = isLoading && Boolean(user);

  const hasActiveMembership = hasAppAccess;
  const canAccessAppComputed = useMemo(
    () => membershipRules.canAccessApp({ accessHydrated, hasAppAccess }),
    [accessHydrated, hasAppAccess],
  );
  const hasImportCreditsComputed = useMemo(
    () => membershipRules.hasImportCredits({ creditBalance }),
    [creditBalance],
  );
  const canPurchaseCreditPacksComputed = useMemo(
    () => membershipRules.canPurchaseCreditPacks({ hasAppAccess }),
    [hasAppAccess],
  );
  const canRunImportComputed = useMemo(
    () =>
      membershipRules.canRunImport({
        accessHydrated,
        hasAppAccess,
        creditBalance,
      }),
    [accessHydrated, hasAppAccess, creditBalance],
  );

  const purchaseCreditsPack = useCallback(
    async (refKey: string) => {
      if (!membershipRules.canPurchaseCreditPacks({ hasAppAccess })) {
        setLastError('Active membership is required to buy import credit packs.');
        return;
      }
      setStoreNotice(null);
      setLastError(null);
      setIsPurchasing(true);
      try {
        if (isReady) {
          try {
            await revenueCatService.syncAppUserId(user?.id ?? null);
          } catch (e) {
            const r = interpretPurchaseError(e);
            if (r.outcome === 'error') {
              setLastError(r.message);
              return;
            }
            if (r.outcome === 'pending') {
              setStoreNotice(r.message);
              return;
            }
          }
        }
        const result = await revenueCatService.purchaseByRefKey(refKey);
        await applyPurchaseResult(result);
      } catch (e) {
        const r = interpretPurchaseError(e);
        if (r.outcome === 'error') {
          setLastError(r.message);
        } else if (r.outcome === 'pending') {
          setStoreNotice(r.message);
        }
      } finally {
        setIsPurchasing(false);
      }
    },
    [applyPurchaseResult, hasAppAccess, isReady, user?.id],
  );

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    const w = creditWalletState?.wallet;
    patchBillingDiagnosticsSub({
      membership: {
        storeEntitlementActive: hasPremiumAccess(customerInfo),
        activeEntitlementIds: [...customerInfo.activeEntitlements],
        storeSubscriptionStatus: customerInfo.status,
        serverEntitlementActive: serverSubscription?.entitlement_active ?? null,
      },
      credits: {
        walletBalance: creditBalance,
        signupBonusGranted:
          typeof w?.signup_bonus_credits_granted === 'number' ? w.signup_bonus_credits_granted : null,
        monthlyIncludedGranted:
          typeof w?.monthly_included_credits_granted === 'number' ? w.monthly_included_credits_granted : null,
        canRunImport: canRunImportComputed,
        canPurchaseCreditPacks: canPurchaseCreditPacksComputed,
      },
      lastErrors: {
        purchase: lastError,
      },
    });
  }, [
    customerInfo,
    creditWalletState,
    creditBalance,
    serverSubscription,
    lastError,
    canRunImportComputed,
    canPurchaseCreditPacksComputed,
  ]);

  const value = useMemo(
    () => ({
      customerInfo,
      isPremium,
      hasAppAccess,
      hasActiveMembership,
      canAccessApp: canAccessAppComputed,
      hasImportCredits: hasImportCreditsComputed,
      canPurchaseCreditPacks: canPurchaseCreditPacksComputed,
      canRunImport: canRunImportComputed,
      accessHydrated,
      accessDisplayState,
      tierLabel,
      statusDetail,
      creditBalance,
      applyCreditBalanceHint,
      creditsLoading,
      creditWalletSyncing,
      isLoading,
      isPurchasing,
      isRestoring,
      lastError,
      storeNotice,
      clearStoreNotice,
      refresh,
      refreshCreditWalletOnly,
      loadPaywallCatalog,
      purchaseSubscription,
      purchaseCreditsPack,
      purchasePremium: purchaseSubscription,
      restorePurchases,
      openPaywall,
      openCreditTopUp,
      creditWalletState,
      monthlyIncludedGrantStatus,
    }),
    [
      customerInfo,
      isPremium,
      hasAppAccess,
      hasActiveMembership,
      canAccessAppComputed,
      hasImportCreditsComputed,
      canPurchaseCreditPacksComputed,
      canRunImportComputed,
      accessHydrated,
      accessDisplayState,
      tierLabel,
      statusDetail,
      creditBalance,
      applyCreditBalanceHint,
      creditsLoading,
      creditWalletSyncing,
      isLoading,
      isPurchasing,
      isRestoring,
      lastError,
      storeNotice,
      clearStoreNotice,
      refresh,
      refreshCreditWalletOnly,
      loadPaywallCatalog,
      purchaseSubscription,
      purchaseCreditsPack,
      restorePurchases,
      openPaywall,
      openCreditTopUp,
      creditWalletState,
      monthlyIncludedGrantStatus,
    ],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}

export function useSubscriptionOptional(): SubscriptionContextValue | null {
  return useContext(SubscriptionContext);
}
