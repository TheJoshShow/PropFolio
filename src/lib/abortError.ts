/**
 * Abort/cancellation errors without DOMException (not available in React Native / Hermes).
 */

export function createAbortError(message = 'Aborted'): Error {
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}

/** Cross-platform abort detection — never references DOMException. */
export function isAbortError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) {
    return false;
  }
  const name = (e as { name?: unknown }).name;
  if (name === 'AbortError') {
    return true;
  }
  const msg = e instanceof Error ? e.message : '';
  if (/aborted/i.test(msg)) {
    return true;
  }
  return false;
}
