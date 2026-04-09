/**
 * Single place to map thrown errors / raw Edge messages to safe UI copy for import flows.
 */
export function mapImportUserFacingError(raw: unknown): string {
  if (raw instanceof Error && raw.name === 'AbortError') {
    return 'Import could not be completed. Please try again.';
  }
  const msg = raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '';
  const m = msg.toLowerCase();

  if (
    m === 'aborted' ||
    /request aborted|aborted the request|the operation was aborted|user aborted/i.test(m)
  ) {
    return 'Import could not be completed. Please try again.';
  }

  if (m.includes('domexception') || /property ['"]domexception['"]/i.test(msg)) {
    return 'Import is temporarily unavailable. Please try again in a moment.';
  }

  if (m.includes('requested function was not found') || m.includes('function not found')) {
    return 'That feature is not available right now. Check for an app update or try again in a few minutes.';
  }
  if (m.includes('this listing took too long') || (m.includes('timed out') && m.includes('try again'))) {
    return 'This listing took too long to load. Please try again.';
  }
  /** Must run before generic “connection” — that substring appears in this refresh copy too. */
  if (m.includes('could not refresh your sign-in') || m.includes('refresh your sign-in')) {
    return msg.length > 0 && msg.length < 220
      ? msg.trim()
      : 'Could not refresh your sign-in in time. Check your connection, wait a moment, and try again.';
  }
  if (m.includes('session expired') || m.includes('sign in')) {
    return msg.length > 0 && msg.length < 180 ? msg : 'Please sign in again, then retry the import.';
  }
  if (
    m.includes('failed to send a request to the edge function') ||
    m.includes('relay error invoking')
  ) {
    return msg.length > 0 && msg.length < 220
      ? msg.trim()
      : 'Could not reach PropFolio servers. Check Wi‑Fi or cellular, try disabling VPN, then try again.';
  }
  if (m.includes('network request failed')) {
    return 'Could not reach PropFolio servers. Check Wi‑Fi or cellular, disable VPN if you use one, then try again.';
  }
  if (m.includes('network') || m.includes('failed to fetch') || m.includes('connection')) {
    return 'Check your connection and try again.';
  }
  if (msg.trim().length > 0 && msg.length < 220) {
    return msg.trim();
  }
  return 'Import could not be completed. Please try again.';
}
