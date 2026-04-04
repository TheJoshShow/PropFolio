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
import { revenueCatService } from '@/services/revenuecat/revenueCatService';
import type { CustomerInfoSummary, PaywallCatalog } from '@/services/revenuecat/types';
import {
  computeAppAccess,
  fetchUserSubscriptionStatus,
  subscriptionStatusDetail,
  subscriptionTierLabel,
  type AppAccessDisplayState,
  type UserSubscriptionStatusRow,
} from '@/services/subscription';
import { tryGetSupabaseClient } from '@/services/supabase';

type SubscriptionContextValue = {
  customerInfo: CustomerInfoSummary;
  /** @deprecated Prefer `hasAppAccess` — same value for gates. */
  isPremium: boolean;
  /** True when user may use portfolio, imports, and full analysis (active membership / free first month). */
  hasAppAccess: boolean;
  /** First server+store subscription hydration finished for this session (avoids gate flicker). */
  accessHydrated: boolean;
  accessDisplayState: AppAccessDisplayState;
  tierLabel: string;
  statusDetail: string;
  /** Server wallet balance — authoritative for import credits (webhook grants). */
  creditBalance: number;
  /** True while the first wallet sync runs for a signed-in user — avoid showing 0 as final. */
  creditsLoading: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  lastError: string | null;
  /** Non-error store messages (e.g. payment pending). */
  storeNotice: string | null;
  clearStoreNotice: () => void;
  refresh: () => Promise<{ isPremium: boolean; hasAppAccess: boolean; creditBalance: number }>;
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

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const refreshGenerationRef = useRef(0);
  const serverSubscriptionRef = useRef<UserSubscriptionStatusRow | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoSummary>(initialSummary);
  const [serverSubscription, setServerSubscription] = useState<UserSubscriptionStatusRow | null>(null);
  const [serverSubscriptionFetchFailed, setServerSubscriptionFetchFailed] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditWalletState, setCreditWalletState] = useState<UserCreditStateRpc | null>(null);
  const [monthlyIncludedGrantStatus, setMonthlyIncludedGrantStatus] =
    useState<MonthlyIncludedGrantStatus>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [accessHydrated, setAccessHydrated] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [storeNotice, setStoreNotice] = useState<string | null>(null);

  const clearStoreNotice = useCallback(() => setStoreNotice(null), []);

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
      setAccessHydrated(true);
      setServerSubscription(null);
      setServerSubscriptionFetchFailed(false);
      setCreditWalletState(null);
      setMonthlyIncludedGrantStatus('unknown');
      return;
    }
    setAccessHydrated(false);
  }, [user?.id]);

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

  const refresh = useCallback(async (): Promise<{
    isPremium: boolean;
    hasAppAccess: boolean;
    creditBalance: number;
  }> => {
    const gen = ++refreshGenerationRef.current;
    setLastError(null);
    setIsLoading(true);
    try {
      if (!user?.id) {
        setCustomerInfo(initialSummary);
        setCreditBalance(0);
        setCreditWalletState(null);
        setMonthlyIncludedGrantStatus('unknown');
        setServerSubscription(null);
        setServerSubscriptionFetchFailed(false);
        return { isPremium: false, hasAppAccess: false, creditBalance: 0 };
      }

      await revenueCatService.initialize();
      if (isReady) {
        try {
          await revenueCatService.syncAppUserId(user?.id);
        } catch {
          /* configure / login failure — still attempt reads */
        }
      }

      const [info, walletLoad, subRes] = await Promise.all([
        revenueCatService.getCustomerInfo(),
        loadCreditWalletForUser(user.id),
        loadServerSubscriptionRow(user.id),
      ]);

      setCustomerInfo(info);
      setCreditBalance(walletLoad.balance);
      setCreditWalletState(walletLoad.state);
      setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
      const balance = walletLoad.balance;
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
      });

      return {
        isPremium: access.hasAppAccess,
        hasAppAccess: access.hasAppAccess,
        creditBalance: balance,
      };
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Membership sync failed');
      try {
        const walletLoad = await loadCreditWalletForUser(user?.id);
        setCreditBalance(walletLoad.balance);
        setCreditWalletState(walletLoad.state);
        setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
        const balance = walletLoad.balance;
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
        });
        return { isPremium: access.hasAppAccess, hasAppAccess: access.hasAppAccess, creditBalance: balance };
      } catch {
        return { isPremium: false, hasAppAccess: false, creditBalance: 0 };
      }
    } finally {
      setIsLoading(false);
      if (refreshGenerationRef.current === gen) {
        setAccessHydrated(true);
      }
    }
  }, [isReady, user?.id]);

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
      const walletLoad = await loadCreditWalletForUser(user?.id);
      setCreditBalance(walletLoad.balance);
      setCreditWalletState(walletLoad.state);
      setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
      const subRes = await loadServerSubscriptionRow(user?.id);
      if (subRes.error) {
        setServerSubscriptionFetchFailed(true);
      } else {
        setServerSubscription(subRes.row);
        setServerSubscriptionFetchFailed(false);
      }
      await revenueCatService.invalidateCustomerInfoCache();
    },
    [user?.id],
  );

  const purchaseSubscription = useCallback(async () => {
    setStoreNotice(null);
    setLastError(null);
    setIsPurchasing(true);
    try {
      if (isReady) {
        await revenueCatService.syncAppUserId(user?.id ?? null);
      }
      const result = await revenueCatService.purchaseDefaultSubscription();
      await applyPurchaseResult(result);
    } finally {
      setIsPurchasing(false);
    }
  }, [applyPurchaseResult, isReady, user?.id]);

  const purchaseCreditsPack = useCallback(
    async (refKey: string) => {
      setStoreNotice(null);
      setLastError(null);
      setIsPurchasing(true);
      try {
        if (isReady) {
          await revenueCatService.syncAppUserId(user?.id ?? null);
        }
        const result = await revenueCatService.purchaseByRefKey(refKey);
        await applyPurchaseResult(result);
      } finally {
        setIsPurchasing(false);
      }
    },
    [applyPurchaseResult, isReady, user?.id],
  );

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
      const walletLoad = await loadCreditWalletForUser(user?.id);
      setCreditBalance(walletLoad.balance);
      setCreditWalletState(walletLoad.state);
      setMonthlyIncludedGrantStatus(walletLoad.monthlyIncluded);
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
  }, [isReady, user?.id]);

  const openPaywall = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  const openCreditTopUp = useCallback(() => {
    router.push('/credit-top-up');
  }, [router]);

  const accessComputed = useMemo(
    () =>
      computeAppAccess({
        accessHydrated,
        serverRow: serverSubscription,
        storeSummary: customerInfo,
        serverFetchFailed: serverSubscriptionFetchFailed,
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
      if (accessDisplayState === 'unknown') {
        return 'Status unknown';
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
      if (accessDisplayState === 'unknown') {
        return 'Check your connection, then try Restore purchases or start membership.';
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

  const value = useMemo(
    () => ({
      customerInfo,
      isPremium,
      hasAppAccess,
      accessHydrated,
      accessDisplayState,
      tierLabel,
      statusDetail,
      creditBalance,
      creditsLoading,
      isLoading,
      isPurchasing,
      isRestoring,
      lastError,
      storeNotice,
      clearStoreNotice,
      refresh,
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
      accessHydrated,
      accessDisplayState,
      tierLabel,
      statusDetail,
      creditBalance,
      creditsLoading,
      isLoading,
      isPurchasing,
      isRestoring,
      lastError,
      storeNotice,
      clearStoreNotice,
      refresh,
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
