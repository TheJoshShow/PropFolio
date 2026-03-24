/**
 * Structured startup logging: visible in __DEV__, non-fatal breadcrumb in production (Crashlytics).
 */

import { recordMessage } from '../services/monitoring';

export function logStartupPhase(phase: string, detail?: string): void {
  const line = detail ? `${phase} — ${detail}` : phase;
  if (__DEV__) {
    console.log(`[PropFolio][Startup] ${line}`);
  }
  try {
    recordMessage(line, 'startup');
  } catch {
    /* never affect boot */
  }
}
