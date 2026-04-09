import { useCallback, useSyncExternalStore } from 'react';

import { getBillingDiagnosticsState, subscribeBillingDiagnostics } from '@/services/billing/billingDiagnosticsStore';

/**
 * Subscribe to the merged billing diagnostics snapshot (dev tooling). No-op churn when store updates.
 */
export function useBillingDiagnostics() {
  const subscribe = useCallback((onStoreChange: () => void) => subscribeBillingDiagnostics(onStoreChange), []);
  const getSnapshot = useCallback(() => getBillingDiagnosticsState(), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
