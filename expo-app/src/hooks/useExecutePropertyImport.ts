/**
 * Central gating for property import: single entry point for all import attempts.
 * Provides loading state, duplicate-submit protection, and refresh on success.
 * Usage is only incremented server-side after a successful save; failed imports do not increment.
 *
 * Example usage (e.g. in import screen):
 *   const { execute, isSubmitting } = useExecutePropertyImport({
 *     onSuccess: ({ propertyId }) => router.push(`/portfolio/${propertyId}`),
 *     onBlocked: () => router.push('/paywall'),
 *     onRetryable: (msg, retry) => Alert.alert('Retry', msg, [{ text: 'Retry', onPress: retry }]),
 *     onError: (msg) => Alert.alert('Error', msg),
 *   });
 *   // On submit: await execute(propertyImportData, 'manual');
 */

import { useState, useCallback, useRef } from 'react';
import { getSupabase } from '../services/supabase';
import {
  recordPropertyImportEnforced,
  type PropertyImportData,
  type ImportSource,
  type RecordPropertyImportResult,
} from '../services/importLimits';
import { useAuth } from '../contexts/AuthContext';
import { useImportLimit } from './useImportLimit';
import { logImportStep } from '../services/diagnostics';
import { IMPORT_USER_MESSAGES } from '../services/importErrorMessages';

export interface ExecutePropertyImportOptions {
  /** Called after a successful import (allowed_free or allowed_paid). */
  onSuccess?: (result: { propertyId: string; property_import_count: number }) => void;
  /** Called when user is blocked by free-tier limit; should open paywall. */
  onBlocked?: () => void;
  /** Called on retryable failure; optional retry callback. */
  onRetryable?: (error: string, retry: () => void) => void;
  /** Called on non-retryable failure. */
  onError?: (error: string) => void;
}

export interface UseExecutePropertyImportReturn {
  /** Run the full import flow (create property + record via RPC). No-op if already submitting. */
  execute: (data: PropertyImportData, source: ImportSource) => Promise<RecordPropertyImportResult>;
  /** True while the import request is in progress; use to disable buttons and show loading. */
  isSubmitting: boolean;
}

/**
 * Single entry point for property import. All screens that add a property should use this hook
 * and call execute(data, source), then handle the result (or pass options for automatic handling).
 */
export function useExecutePropertyImport(
  options: ExecutePropertyImportOptions = {}
): UseExecutePropertyImportReturn {
  const { session, isLoading: authLoading } = useAuth();
  const { refresh } = useImportLimit();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(
    async (data: PropertyImportData, source: ImportSource): Promise<RecordPropertyImportResult> => {
      if (submittingRef.current) {
        return { status: 'failed_retryable', error: 'Please wait for the current import to finish.' };
      }
      if (authLoading) {
        return {
          status: 'failed_retryable',
          error: IMPORT_USER_MESSAGES.authenticationInProgress,
        };
      }
      const supabase = getSupabase();
      if (!session?.id) {
        const result: RecordPropertyImportResult = {
          status: 'failed_nonretryable',
          error: IMPORT_USER_MESSAGES.notSignedIn,
        };
        optionsRef.current.onError?.(result.error);
        return result;
      }

      submittingRef.current = true;
      setIsSubmitting(true);
      logImportStep('execute_start', { authPresent: true, source });
      try {
        const result = await recordPropertyImportEnforced(supabase, session.id, data, source);
        const opts = optionsRef.current;
        logImportStep('execute_result', { status: result.status });

        if (result.status === 'allowed_free' || result.status === 'allowed_paid') {
          await refresh();
          opts.onSuccess?.({ propertyId: result.propertyId, property_import_count: result.property_import_count });
        } else if (result.status === 'blocked_upgrade_required') {
          opts.onBlocked?.();
        } else if (result.status === 'failed_retryable') {
          opts.onRetryable?.(result.error, () => execute(data, source));
        } else if (result.status === 'failed_nonretryable') {
          opts.onError?.(result.error ?? 'Import failed');
        }

        return result;
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [session?.id, authLoading, refresh]
  );

  return { execute, isSubmitting };
}
