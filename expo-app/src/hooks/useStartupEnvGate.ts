/**
 * One-shot dev warning + monitoring breadcrumb when required client env is incomplete.
 * Does not block render; keeps root layout free of duplicate validation logic.
 */

import { useEffect, useRef } from 'react';

import { logSupabaseAuthEnvDiagnostics, validateRuntimeConfigForDev, validateRuntimeConfigForRelease } from '../config';
import { recordFlowIssue } from '../services/monitoring';

export function useStartupEnvGate(): void {
  const loggedRef = useRef(false);

  useEffect(() => {
    logSupabaseAuthEnvDiagnostics();
    const devValidation = validateRuntimeConfigForDev();
    const releaseValidation = validateRuntimeConfigForRelease();
    const hasAnyIssue = !devValidation.ok || !releaseValidation.ok || releaseValidation.missingRecommended.length > 0;
    if (!hasAnyIssue) return;

    if (__DEV__ && !devValidation.ok) {
      const msg = `Missing env: ${devValidation.missing.join(', ')}`;
      console.warn(`[PropFolio][Startup] ${msg} — set EXPO_PUBLIC_* in .env or EAS; app runs in limited mode.`);
    }

    if (!__DEV__) {
      if (!releaseValidation.ok) {
        console.error(
          `[PropFolio][Startup][Release] Missing REQUIRED env: ${releaseValidation.missingRequired.join(', ')}. Runtime features may be unavailable.`
        );
      }
      if (releaseValidation.missingRecommended.length > 0) {
        console.warn(
          `[PropFolio][Startup][Release] Missing RECOMMENDED env: ${releaseValidation.missingRecommended.join(', ')}. Legal/support links may fall back to defaults.`
        );
      }
    }

    if (!loggedRef.current) {
      loggedRef.current = true;
      recordFlowIssue('bootstrap_env_incomplete', {
        stage: 'startup',
        recoverable: __DEV__ || releaseValidation.ok,
        n: String(
          new Set([
            ...devValidation.missing,
            ...releaseValidation.missingRequired,
            ...releaseValidation.missingRecommended,
          ]).size
        ),
      });
    }
  }, []);
}
