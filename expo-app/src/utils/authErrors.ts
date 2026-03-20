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

export type AuthErrorContext = 'signIn' | 'signUp' | 'oauth' | 'magicLink' | 'resetPassword' | 'updatePassword';

/**
 * Normalize and optionally log auth error; return a safe user-facing message.
 */
export function getAuthErrorMessage(error: unknown, context: AuthErrorContext): string {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && error) {
    console.warn(`[Auth ${context}]`, error);
  }
  if (!error || typeof error !== 'object') return context === 'signIn' ? 'Sign in failed' : 'Sign up failed';
  const err = error as { message?: string; code?: string; status?: number };
  const msg = (err.message ?? '').toLowerCase();
  const code = (err.code ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login')) {
    return context === 'signIn'
      ? 'Incorrect email or password. Please try again.'
      : 'Invalid email or password';
  }
  if (code === 'user_already_registered' || msg.includes('already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Sign in or use a different email.';
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
  return context === 'signIn' ? 'Sign in failed. Please try again.' : 'Sign up failed. Please try again.';
}
