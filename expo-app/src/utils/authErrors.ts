/**
 * Map Supabase Auth errors to user-friendly messages.
 * Used by login and sign-up screens. Raw errors can be logged in dev.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim().toLowerCase());
}

const MIN_PASSWORD_LENGTH = 8;

export function getPasswordRequirementMessage(): string {
  return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
}

export function isPasswordLongEnough(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH;
}

export type AuthErrorContext =
  | 'signIn'
  | 'signUp'
  | 'oauth'
  | 'magicLink'
  | 'resetPassword'
  | 'updatePassword'
  | 'callback';

/**
 * Map OAuth / magic-link redirect query params when `error` is present.
 */
export function getAuthRedirectUrlErrorMessage(params: Record<string, string>): string | null {
  if (!params.error && !params.error_code) return null;
  const oauthErr = (params.error ?? '').toLowerCase();
  const desc = (params.error_description ?? params.error ?? '').trim();
  if (oauthErr === 'access_denied') {
    return 'Sign-in was cancelled or the provider denied access.';
  }
  if (desc) {
    if (desc.length > 200) return `${desc.slice(0, 197)}…`;
    return desc;
  }
  return 'Sign-in could not complete. Please try again.';
}

function logAuthDev(context: AuthErrorContext, error: unknown): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  if (!error) return;
  const err = error as { message?: string; code?: string; name?: string };
  console.warn(`[Auth ${context}]`, err.code ?? err.name ?? '', err.message ?? error);
}

/**
 * Normalize and optionally log auth error; return a safe user-facing message.
 */
export function getAuthErrorMessage(error: unknown, context: AuthErrorContext): string {
  logAuthDev(context, error);
  if (!error || typeof error !== 'object') {
    return context === 'signIn' || context === 'callback'
      ? 'Sign in failed. Please try again.'
      : 'Sign up failed. Please try again.';
  }
  const err = error as { message?: string; code?: string; status?: number };
  const msg = (err.message ?? '').toLowerCase();
  const code = (err.code ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login')) {
    return context === 'signIn' || context === 'callback'
      ? 'Incorrect email or password. Please try again.'
      : 'Invalid email or password';
  }
  if (
    code === 'email_not_confirmed' ||
    msg.includes('email not confirmed') ||
    msg.includes('not confirmed')
  ) {
    return 'Confirm your email first. Check your inbox for the verification link, then try again.';
  }
  if (code === 'user_already_registered' || msg.includes('already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Sign in or use a different email.';
  }
  if (code === 'provider_disabled' || msg.includes('provider is disabled')) {
    return 'This sign-in method is not available. Try email or another provider.';
  }
  if (code === 'otp_expired' || msg.includes('invalid token') || msg.includes('already been used')) {
    return 'This link has expired or was already used. Request a new sign-in link.';
  }
  if (msg.includes('pkce') || msg.includes('code verifier')) {
    return 'Sign-in session expired. Close the browser and try signing in again.';
  }
  if (msg.includes('email') && (msg.includes('invalid') || msg.includes('valid'))) {
    return 'Please enter a valid email address';
  }
  if (msg.includes('password') || code === 'weak_password' || msg.includes('at least')) {
    return getPasswordRequirementMessage();
  }
  if (msg.includes('network') || msg.includes('fetch') || err.status === 0) {
    return 'Network error. Check your connection and try again.';
  }
  if (msg.includes('rate') || msg.includes('too many') || code === 'over_request_quota' || err.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (code === 'signup_disabled' || msg.includes('sign up disabled')) {
    return 'Sign up is temporarily disabled. Please try again later.';
  }
  if (context === 'oauth') {
    if (msg.includes('popup') || msg.includes('closed') || code === 'auth_session_missing') {
      return 'Sign-in was cancelled or the window was closed.';
    }
    return 'Sign-in with this provider failed. Please try again.';
  }
  if (context === 'magicLink') {
    return 'Could not send the sign-in link. Check the email address and try again.';
  }
  if (context === 'resetPassword') {
    if (msg.includes('rate') || msg.includes('too many') || err.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return 'Could not send the reset link. Check the email address and try again.';
  }
  if (context === 'updatePassword') {
    if (msg.includes('password') || code === 'weak_password') return getPasswordRequirementMessage();
    return 'Password update failed. Please try again.';
  }
  if (context === 'callback') {
    return 'Could not complete sign-in. Please try again.';
  }
  return context === 'signIn' ? 'Sign in failed. Please try again.' : 'Sign up failed. Please try again.';
}
