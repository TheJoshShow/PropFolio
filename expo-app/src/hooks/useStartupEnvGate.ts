/**
 * One-shot dev warning + monitoring breadcrumb when required client env is incomplete.
 * Does not block render; keeps root layout free of duplicate validation logic.
 */

import { useEffect, useRef } from 'react';

import { validateRuntimeConfigForDev } from '../config';
import { recordFlowIssue } from '../services/monitoring';

export function useStartupEnvGate(): void {
  const loggedRef = useRef(false);

  useEffect(() => {
    const validation = validateRuntimeConfigForDev();
    if (validation.ok) {
      return;
    }
    const msg = `Missing env: ${validation.missing.join(', ')}`;
    if (__DEV__) {
      console.warn(`[PropFolio][Startup] ${msg} — set EXPO_PUBLIC_* in .env or EAS; app runs in limited mode.`);
    }
    if (!loggedRef.current) {
      loggedRef.current = true;
      recordFlowIssue('bootstrap_env_incomplete', {
        stage: 'startup',
        recoverable: true,
        n: String(validation.missing.length),
      });
    }
  }, []);
}
