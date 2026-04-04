import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSubscription } from './SubscriptionContext';

/**
 * Import gating: active subscription (`hasAppAccess`) first, then server credit wallet ≥ 1.
 * Call `ensureCanImport` before starting an import (refreshes subscription + balance).
 */
export function useImportGate() {
  const router = useRouter();
  const sub = useSubscription();

  const ensureCanImport = useCallback(async (): Promise<boolean> => {
    const { hasAppAccess, creditBalance } = await sub.refresh();
    if (!hasAppAccess) {
      router.replace('/access-restricted');
      return false;
    }
    if (creditBalance < 1) {
      router.push('/paywall');
      return false;
    }
    return true;
  }, [router, sub]);

  return { ensureCanImport };
}
