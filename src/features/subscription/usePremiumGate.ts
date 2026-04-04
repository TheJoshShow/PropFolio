import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSubscriptionOptional } from './SubscriptionContext';

/**
 * Single entry for subscription-gated actions (portfolio-level Pro features).
 * Uses `hasAppAccess` (server + store). For imports, use `useImportGate` (subscription + credits).
 */
export function usePremiumGate() {
  const router = useRouter();
  const sub = useSubscriptionOptional();

  const withPremium = useCallback(
    (action: () => void) => {
      if (sub?.hasAppAccess) {
        action();
        return;
      }
      router.push('/access-restricted');
    },
    [router, sub],
  );

  return {
    hasAppAccess: sub?.hasAppAccess ?? false,
    isPremium: sub?.hasAppAccess ?? false,
    openPaywall: sub?.openPaywall ?? (() => {}),
    openAccessGate: () => router.push('/access-restricted'),
    withPremium,
  };
}
