/**
 * Dev-only structured logs + per–import-screen-visit refresh attempt counter.
 * Resets when Import Property gains focus so you can correlate Metro lines with one user session on that screen.
 */

let refreshAttemptsThisVisit = 0;

export function resetImportAuthTelemetryForScreenVisit(): void {
  refreshAttemptsThisVisit = 0;
}

export function getRefreshAttemptsThisVisit(): number {
  return refreshAttemptsThisVisit;
}

function bumpRefreshAttempt(): number {
  refreshAttemptsThisVisit += 1;
  return refreshAttemptsThisVisit;
}

export function logImportAuthEvent(
  event: string,
  extra?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!__DEV__) {
    return;
  }
  const t = new Date().toISOString();
  console.log('[PropFolio import-auth]', JSON.stringify({ t, event, ...extra }));
}

/** Call when starting a coalesced refresh (leader only). */
export function logRefreshLeaderStart(source: string): number {
  const n = bumpRefreshAttempt();
  logImportAuthEvent('refresh_start', { source, attemptNumberThisVisit: n });
  return n;
}

export function logRefreshTimeout(source: string, budgetMs: number): void {
  logImportAuthEvent('refresh_timeout', { source, budgetMs });
}

export function logRefreshJoin(source: string): void {
  logImportAuthEvent('refresh_coalesce_join', { source });
}

export function logRefreshSettled(source: string, ms: number, error: boolean): void {
  logImportAuthEvent('refresh_settled', { source, ms, error });
}
