import { useCallback, useRef, useState, type MutableRefObject } from 'react';

import type { InvestmentStrategy } from '@/lib/investmentStrategy';
import { saveImportListingDraft } from '@/services/import/importListingDraftStorage';
import type { PropertyImportNeedsAddress, PropertyImportResult, PropertyImportSuccess } from '@/services/property-import';
import { AuthPrepError } from '@/services/supabase/authPrepErrors';
import { tryGetSupabaseClient } from '@/services/supabase';
import { prepareSessionForEdgeInvoke } from '@/services/supabase/prepareSessionForEdgeInvoke';

import { mapImportUserFacingError } from './mapImportUserError';
import { interpretPropertyImportResult } from './propertyImportLifecycle';
import { refreshWalletAfterPropertyImport } from './refreshWalletAfterPropertyImport';

/** `refresh()` can wait on RevenueCat / wallet RPC; never block import UI indefinitely. */
const IMPORT_GATE_TIMEOUT_MS = 25_000;

export type ImportSubmissionPhase = 'idle' | 'validating' | 'submitting';

export type ImportInvocationContext = {
  strategy: InvestmentStrategy;
};

export type RunPropertyImportSubmissionArgs = {
  /** Runs after the in-flight lock is acquired; e.g. clear banners. */
  beforeValidate?: () => void;
  validateInput: () => string | null;
  requireStrategy: () => InvestmentStrategy;
  invoke: (ctx: ImportInvocationContext) => Promise<PropertyImportResult>;
  /** Listing flow only — server needs more address detail; no wallet change. */
  onNeedsAddress?: (result: PropertyImportNeedsAddress) => void;
  /** Runs after wallet refresh and correlation rotation, before navigation. */
  afterSuccessfulImport?: (result: PropertyImportSuccess) => void;
};

type UseImportSubmissionOptions = {
  ensureCanImport: () => Promise<boolean>;
  subscriptionRefresh: () => Promise<unknown>;
  correlationIdRef: MutableRefObject<string>;
  /** Invoked when import saved successfully (draft or ready); replaces screen. */
  onNavigateToProperty: (propertyId: string) => void;
  /** Called after a successful import to rotate idempotency key for the next job. */
  rotateCorrelationIdOnSuccess: () => void;
  /**
   * Apply `balance_after` from `import-property` before `subscriptionRefresh` finishes so the UI
   * matches server truth immediately (no fake client decrement).
   */
  applyServerBalanceHint?: (balanceAfter: number | null | undefined) => void;
  /** Persisted after `invalid_refresh` so the user can paste the same listing URL post sign-in. */
  getListingDraftForRecovery?: () => string | null;
  /** e.g. sign out + replace to `/` — runs after draft save when refresh token is dead. */
  onInvalidRefreshSession?: () => Promise<void>;
};

/**
 * Shared listing + manual import submission: validation → credit gate → edge invoke →
 * interpret result → wallet refresh when needed → navigate on saved property.
 * Uses a ref lock so rapid double-taps cannot start parallel imports (duplicate charges).
 */
export function useImportSubmission({
  ensureCanImport,
  subscriptionRefresh,
  correlationIdRef,
  onNavigateToProperty,
  rotateCorrelationIdOnSuccess,
  applyServerBalanceHint,
  getListingDraftForRecovery,
  onInvalidRefreshSession,
}: UseImportSubmissionOptions) {
  const inFlightRef = useRef(false);
  const [phase, setPhase] = useState<ImportSubmissionPhase>('idle');
  const [importError, setImportError] = useState<string | null>(null);

  const clearImportError = useCallback(() => setImportError(null), []);

  const recoverFromInvalidRefresh = useCallback(async () => {
    const draft = getListingDraftForRecovery?.() ?? null;
    if (draft) {
      await saveImportListingDraft(draft);
    }
    try {
      await onInvalidRefreshSession?.();
    } catch {
      /* sign-out navigation is best-effort */
    }
  }, [getListingDraftForRecovery, onInvalidRefreshSession]);

  const runSubmission = useCallback(
    async (args: RunPropertyImportSubmissionArgs): Promise<void> => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      args.beforeValidate?.();
      setImportError(null);
      setPhase('validating');

      let strategy: InvestmentStrategy;
      try {
        strategy = args.requireStrategy();
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'Choose a strategy');
        setPhase('idle');
        inFlightRef.current = false;
        return;
      }

      const validationMessage = args.validateInput();
      if (validationMessage) {
        setImportError(validationMessage);
        setPhase('idle');
        inFlightRef.current = false;
        return;
      }

      try {
        const supabase = tryGetSupabaseClient();
        if (!supabase) {
          setImportError('Add Supabase credentials to import properties.');
          setPhase('idle');
          inFlightRef.current = false;
          return;
        }
        await prepareSessionForEdgeInvoke(supabase);
      } catch (e) {
        if (e instanceof AuthPrepError && e.code === 'invalid_refresh') {
          await recoverFromInvalidRefresh();
        }
        setImportError(mapImportUserFacingError(e));
        setPhase('idle');
        inFlightRef.current = false;
        return;
      }

      let gateOk: boolean;
      try {
        gateOk = await Promise.race([
          ensureCanImport(),
          new Promise<boolean>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    'Taking too long to verify membership and credits. Check your connection and try again.',
                  ),
                ),
              IMPORT_GATE_TIMEOUT_MS,
            ),
          ),
        ]);
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'Could not verify your account. Try again.');
        setPhase('idle');
        inFlightRef.current = false;
        return;
      }

      if (!gateOk) {
        setImportError('You need 1 import credit. Open Buy credits or Membership from Settings.');
        setPhase('idle');
        inFlightRef.current = false;
        return;
      }

      setPhase('submitting');

      try {
        const result = await args.invoke({ strategy });
        const outcome = interpretPropertyImportResult(result);

        switch (outcome.kind) {
          case 'needs_address':
            // End "submitting" before running navigation/state that shows the address step.
            setPhase('idle');
            if (args.onNeedsAddress) {
              args.onNeedsAddress(outcome.result);
            } else {
              setImportError(
                'We still need a confirmed street address for this listing. Pick a suggestion below.',
              );
            }
            break;
          case 'import_saved':
            applyServerBalanceHint?.(outcome.result.balance_after);
            try {
              await refreshWalletAfterPropertyImport(subscriptionRefresh);
            } catch {
              /* `balance_after` already applied; navigation must not fail if wallet RPC hangs */
            }
            rotateCorrelationIdOnSuccess();
            args.afterSuccessfulImport?.(outcome.result);
            onNavigateToProperty(outcome.result.propertyId);
            break;
          case 'failure_refresh_wallet':
            try {
              await refreshWalletAfterPropertyImport(subscriptionRefresh);
            } catch {
              /* still show error below */
            }
            setImportError(outcome.message);
            break;
          case 'failure_silent_wallet':
            setImportError(outcome.message);
            break;
          default:
            setImportError('Import could not be completed.');
        }
      } catch (e) {
        if (e instanceof AuthPrepError && e.code === 'invalid_refresh') {
          await recoverFromInvalidRefresh();
        }
        setImportError(mapImportUserFacingError(e));
      } finally {
        setPhase('idle');
        inFlightRef.current = false;
      }
    },
    [
      ensureCanImport,
      onNavigateToProperty,
      rotateCorrelationIdOnSuccess,
      subscriptionRefresh,
      applyServerBalanceHint,
      recoverFromInvalidRefresh,
    ],
  );

  return {
    runSubmission,
    importError,
    clearImportError,
    submissionPhase: phase,
    /** True while client validation or edge function is in progress */
    isSubmitting: phase !== 'idle',
  };
}
