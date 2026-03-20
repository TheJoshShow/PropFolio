/**
 * User-facing import / account-readiness messages. Centralized so UI and services stay consistent.
 * Do not surface raw Supabase errors to users.
 */

export const IMPORT_USER_MESSAGES = {
  sessionExpired: 'Your session expired. Please sign in again.',
  sessionMismatch: 'Your session changed. Please sign out and sign back in.',
  notSignedIn: 'You must be signed in to save a property.',
  /** Auth provider still hydrating session from storage — avoid import until ready */
  authenticationInProgress: 'Please wait a moment while we finish signing you in.',
  supabaseNotConfigured: 'Your app is not connected to the server. Please try again after updating the app.',
  unsupportedListingUrl:
    "That listing link isn't supported yet. Paste a Zillow or Redfin listing link, or enter the address manually.",
  invalidListingLinkFormat: 'Paste a valid Zillow or Redfin listing link.',
  unableToExtractListingAddress:
    "We couldn't read an address from this listing. Open the full property page, copy that URL, or enter the address manually.",
  blankAddress: 'Enter a property address to continue.',
  unresolvableAddress: "We couldn't verify that address. Check it and try again.",
  invalidAddress: 'Enter a valid property address to continue.',
  /** Recoverable transient / unknown backend while we retry or after retries exhausted */
  importTemporaryFailure: "We couldn't import this property right now. Please try again in a moment.",
  /** Only when profile/portfolio setup truly cannot complete after repair attempts */
  accountSetupUnrecoverable:
    "We couldn't finish setting up your account. Please sign out and sign back in.",
  portfolioCreateFailed: "We couldn't set up your portfolio. Please try again in a moment.",
  portfolioLoadFailed: "We couldn't load your portfolio. Please try again in a moment.",
} as const;

export type ImportFailureKind =
  | 'session'
  | 'account'
  | 'portfolio'
  | 'network'
  | 'validation'
  | 'unknown';

/**
 * Map account-readiness / Supabase-style errors to a clean message + kind for logging/analytics.
 */
export function messageForAccountSetupFailure(params: {
  /** PostgREST / Supabase error message (internal only; do not show raw) */
  rawMessage: string;
  /** Optional Postgres / PostgREST code */
  code?: string;
}): { userMessage: string; kind: ImportFailureKind } {
  const m = params.rawMessage.toLowerCase();
  const code = params.code ?? '';

  if (
    code === 'PGRST301' ||
    m.includes('jwt') ||
    m.includes('jwt expired') ||
    m.includes('invalid jwt')
  ) {
    return { userMessage: IMPORT_USER_MESSAGES.sessionExpired, kind: 'session' };
  }

  if (
    m.includes('row-level security') ||
    m.includes('row level security') ||
    m.includes('violates row-level security') ||
    m.includes('permission denied') ||
    code === '42501'
  ) {
    return { userMessage: IMPORT_USER_MESSAGES.importTemporaryFailure, kind: 'account' };
  }

  if (m.includes('network') || m.includes('fetch') || m.includes('timeout')) {
    return { userMessage: IMPORT_USER_MESSAGES.importTemporaryFailure, kind: 'network' };
  }

  // Schema drift: unknown column often surfaces as undefined_column
  if (m.includes('column') && m.includes('does not exist')) {
    return { userMessage: IMPORT_USER_MESSAGES.importTemporaryFailure, kind: 'unknown' };
  }

  return { userMessage: IMPORT_USER_MESSAGES.importTemporaryFailure, kind: 'unknown' };
}
