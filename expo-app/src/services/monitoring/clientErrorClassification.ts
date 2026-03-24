/**
 * Privacy-safe error bucketing for Crashlytics flow context (message patterns only; no payloads).
 */

export type ClientErrorKind =
  | 'timeout'
  | 'network'
  | 'unauthorized'
  | 'server'
  | 'not_found'
  | 'config'
  | 'unknown';

export interface ClientErrorClass {
  kind: ClientErrorKind;
  /** Heuristic: user can retry or fix without app reinstall. */
  recoverable: boolean;
}

/**
 * Classify an unknown error for monitoring strings only.
 */
export function classifyClientError(error: unknown): ClientErrorClass {
  const msg = error instanceof Error ? error.message : String(error);
  const m = msg.toLowerCase();

  if (m.includes('timeout') || m.includes('timed out')) {
    return { kind: 'timeout', recoverable: true };
  }
  if (
    m.includes('network request failed') ||
    m.includes('network error') ||
    m.includes('failed to fetch') ||
    m.includes('internet connection') ||
    m.includes('offline') ||
    m.includes('connection') && m.includes('refused')
  ) {
    return { kind: 'network', recoverable: true };
  }
  if (
    m.includes('unauthorized') ||
    m.includes('401') ||
    m.includes('invalid jwt') ||
    m.includes('jwt expired')
  ) {
    return { kind: 'unauthorized', recoverable: true };
  }
  if (m.includes('503') || m.includes('502') || m.includes('504') || m.includes('500')) {
    return { kind: 'server', recoverable: true };
  }
  if (m.includes('404') || m.includes('not found')) {
    return { kind: 'not_found', recoverable: false };
  }
  if (m.includes('not configured') || m.includes('missing') && m.includes('key')) {
    return { kind: 'config', recoverable: false };
  }

  return { kind: 'unknown', recoverable: true };
}
