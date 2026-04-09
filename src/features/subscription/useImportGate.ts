import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSubscription } from './SubscriptionContext';

/**
 * Import gating (see `membershipCreditRules.canRunImport`): **membership** then **server credits**.
 * Credits never unlock the app; without membership we never send the user to buy credits alone.
 */
export function useImportGate() {
  const router = useRouter();
  const {
    accessHydrated,
    hasAppAccess,
    hasImportCredits,
    canRunImport,
    refresh,
  } = useSubscription();

  const ensureCanImport = useCallback(async (): Promise<boolean> => {
    // Credits are only consumed on the server when import succeeds; this gate reads wallet state.
    if (accessHydrated && hasAppAccess && hasImportCredits && canRunImport) {
      return true;
    }
    const r = await refresh();
    if (!r.hasAppAccess) {
      router.replace('/access-restricted');
      return false;
    }
    if (!r.hasImportCredits) {
      router.push('/credit-top-up');
      return false;
    }
    return true;
  }, [router, accessHydrated, hasAppAccess, hasImportCredits, canRunImport, refresh]);

  return { ensureCanImport };
}
