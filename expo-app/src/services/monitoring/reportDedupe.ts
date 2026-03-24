/**
 * Short-window deduplication so the same failure is not sent to monitoring
 * multiple times from global handler + boundary + route error UI.
 * Fingerprint ignores the reporting source so one exception is not double-counted.
 */

let lastFingerprint = '';
let lastReportedAt = 0;

const WINDOW_MS = 2500;

function fingerprintFor(error: unknown): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : error != null && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : String(error);
  const stack = error instanceof Error ? error.stack?.slice(0, 400) ?? '' : '';
  return `${msg}|${stack}`;
}

/**
 * Returns true if this error was already reported within the dedupe window (skip send).
 */
export function isDuplicateReport(error: unknown): boolean {
  const fp = fingerprintFor(error);
  const now = Date.now();
  if (fp === lastFingerprint && now - lastReportedAt < WINDOW_MS) {
    return true;
  }
  lastFingerprint = fp;
  lastReportedAt = now;
  return false;
}
