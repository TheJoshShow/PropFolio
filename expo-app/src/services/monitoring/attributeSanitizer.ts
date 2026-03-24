/**
 * Crashlytics custom attributes: short ASCII-safe strings only.
 * https://firebase.google.com/docs/crashlytics/customize-crash-reports — keys/values have length limits.
 */

const MAX_KEY = 32;
const MAX_VALUE = 64;

const SAFE_KEY = /^[a-z0-9_]+$/i;

export function sanitizeMonitoringKey(key: string): string | null {
  const t = key.trim().slice(0, MAX_KEY);
  if (!t || !SAFE_KEY.test(t)) return null;
  return t.toLowerCase();
}

export function sanitizeMonitoringValue(value: unknown, maxLen = MAX_VALUE): string {
  if (value == null) return '';
  const s = typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : String(value);
  const ascii = s.replace(/[^\x20-\x7E]/g, '_').trim();
  return ascii.slice(0, maxLen);
}

/** Mask UUIDs in route segments for privacy. */
export function sanitizeRouteForMonitoring(path: string | undefined | null): string {
  if (!path || typeof path !== 'string') return '';
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]')
    .replace(/\/[0-9a-f-]{16,}\b/gi, '/[id]')
    .slice(0, 96);
}
