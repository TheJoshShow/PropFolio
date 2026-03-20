/**
 * Single source of truth for usage state: import count, freeRemaining, canImport.
 * Reads from server (property_imports count) and combines with hasProAccess from SubscriptionContext.
 * canImport = (freeRemaining > 0) || hasProAccess.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getSupabase } from '../services/supabase';
import { getImportCount, FREE_IMPORT_LIMIT, type ImportCountResult } from '../services/importLimits';
import { logUsageCheck } from '../services/diagnostics';

export interface ImportLimitState extends ImportCountResult {
  canImport: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useImportLimit(): ImportLimitState {
  const { session, isLoading: authLoading } = useAuth();
  const { hasProAccess } = useSubscription();
  const supabase = getSupabase();
  const [result, setResult] = useState<ImportCountResult>({
    count: 0,
    freeRemaining: FREE_IMPORT_LIMIT,
    canImport: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.id) {
      // Wait until auth finishes restoring session.
      if (authLoading) return;
      setResult({ count: 0, freeRemaining: FREE_IMPORT_LIMIT, canImport: true });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const r = await getImportCount(supabase);
    setResult(r);
    setIsLoading(false);
  }, [session?.id, supabase, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const canImport = result.freeRemaining > 0 || hasProAccess;
  const freeRemaining = result.freeRemaining;

  useEffect(() => {
    if (!__DEV__ || isLoading) return;
    logUsageCheck({
      canImport,
      freeRemaining: result.freeRemaining,
      count: result.count,
    });
  }, [isLoading, canImport, result.freeRemaining, result.count]);

  return {
    ...result,
    freeRemaining,
    canImport,
    isLoading,
    refresh: load,
  };
}
