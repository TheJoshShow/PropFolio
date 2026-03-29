/**
 * User-facing messages for email/password auth and email-link session completion (confirm / reset).
 * Maps Supabase Auth errors to safe copy — never expose raw server errors in UI.
 */

import { ProfileSetupError } from '../auth/authFlowErrors';

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

export type AuthErrorContext = 'signIn' | 'signUp' | 'resetPassword' | 'updatePassword' | 'callback';

/**
 * Map query params when an email confirmation or password-reset link fails (e.g. `error=`).
 */
export function getEmailLinkCallbackErrorMessage(params: Record<string, string>): string | null {
  if (!params.error && !params.error_code) return null;
  const errCode = (params.error ?? '').toLowerCase();
  const desc = (params.error_description ?? params.error ?? '').trim();
  if (errCode === 'access_denied') {
    return 'This link was cancelled or is no longer valid.';
  }
  if (desc) {
    if (desc.length > 200) return `${desc.slice(0, 197)}…`;
    return desc;
  }
  return 'This email link could not be completed. Request a new confirmation or reset email.';
}

function logAuthDev(context: AuthErrorContext, error: unknown): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  if (!error) return;
  const err = error as { message?: string; code?: string; name?: string };
  console.warn(`[Auth ${context}]`, err.name ?? err.code ?? '', err.message ?? error);
}

function messageFromWeakPasswordError(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const e = error as { name?: string; reasons?: unknown; message?: string };
  if (e.name !== 'AuthWeakPasswordError') return null;
  const reasons = Array.isArray(e.reasons) ? e.reasons.filter((x): x is string => typeof x === 'string') : [];
  if (reasons.length > 0) {
    const joined = reasons.join(', ').replace(/_/g, ' ');
    return `Choose a stronger password (${joined}).`;
  }
  return getPasswordRequirementMessage();
}

function isDuplicateAccountError(code: string, msg: string): boolean {
  return (
    code === 'user_already_registered' ||
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    code === 'identity_already_exists' ||
    code === 'conflict' ||
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('user already') ||
    msg.includes('email exists')
  );
}

function isRedirectOrUrlConfigError(_code: string, msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('redirect') ||
    m.includes('redirect_to') ||
    m.includes('redirect url') ||
    (m.includes('not allowed') && (m.includes('url') || m.includes('redirect'))) ||
    m.includes('invalid url')
  );
}

/**
 * Normalize Supabase Auth errors for sign-in, sign-up, password flows, and email-link callbacks.
 */
export function getAuthErrorMessage(error: unknown, context: AuthErrorContext): string {
  logAuthDev(context, error);

  const weak = messageFromWeakPasswordError(error);
  if (weak) return weak;

  if (error instanceof ProfileSetupError) {
    if (error.kind === 'rls_or_permission') {
      return 'We could not save your profile (permissions). Contact support — the database may need a policy update.';
    }
    if (error.kind === 'trigger_or_constraint') {
      return 'We could not finish account setup due to a server rule. Try again shortly or contact support.';
    }
    return 'Your account was created, but we could not finish setup. Try signing in. If that keeps failing, contact support.';
  }

  if (typeof error === 'object' && error !== null) {
    const named = (error as { name?: string }).name;
    if (named === 'SignupIncompleteResponseError' || (error as { message?: string }).message === 'SIGNUP_INCOMPLETE_RESPONSE') {
      return 'We could not finish creating your account. Check your connection and try again.';
    }
    if (named === 'ProfileSetupError' || (error as { message?: string }).message === 'PROFILE_SETUP_FAILED') {
      return 'Your account was created, but we could not finish setup. Try signing in. If that keeps failing, contact support.';
    }
  }

  if (!error || typeof error !== 'object') {
    if (context === 'callback') return 'This email link could not be completed. Please try again.';
    if (context === 'signIn') return 'Sign in failed. Please try again.';
    if (context === 'signUp') return 'Could not create your account. Please try again.';
    return 'Something went wrong. Please try again.';
  }

  const err = error as { message?: string; code?: string; status?: number; name?: string };
  const rawMsg = err.message ?? '';
  const msg = rawMsg.toLowerCase();
  const code = (err.code ?? '').toLowerCase();

  if (msg.includes('authentication is not configured') || msg.includes('not configured')) {
    return 'Account services are not configured in this build. Update the app or contact support.';
  }

  if (msg.includes('network') || msg.includes('fetch') || err.status === 0) {
    return 'Network error. Check your connection and try again.';
  }
  if (
    msg.includes('rate') ||
    msg.includes('too many') ||
    code === 'over_request_quota' ||
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_sms_send_rate_limit' ||
    err.status === 429
  ) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (code === 'request_timeout' || code === 'hook_timeout' || code === 'hook_timeout_after_retry') {
    return 'The server took too long to respond. Try again in a moment.';
  }

  if (context === 'resetPassword') {
    return 'Could not send the reset link. Check the email address and try again.';
  }

  if (context === 'updatePassword') {
    if (msg.includes('password') || code === 'weak_password') return getPasswordRequirementMessage();
    return 'Could not update your password. Please try again.';
  }

  if (code === 'signup_disabled' || msg.includes('sign up disabled')) {
    return 'New sign-ups are temporarily unavailable. Please try again later.';
  }

  if (code === 'email_provider_disabled' || msg.includes('email signups are disabled')) {
    return 'Email sign-up is disabled for this app. Contact support.';
  }

  if (
    code === 'email_not_confirmed' ||
    msg.includes('email not confirmed') ||
    msg.includes('not confirmed')
  ) {
    return 'Confirm your email first. Check your inbox for the verification link, then try signing in.';
  }

  if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
    if (context === 'signUp') return 'Invalid email or password.';
    return 'Incorrect email or password.';
  }

  if (
    code === 'user_not_found' ||
    msg.includes('user not found') ||
    (msg.includes('no user') && msg.includes('record'))
  ) {
    if (context === 'signIn') {
      return 'No account found for this email. Check the spelling or create an account.';
    }
  }

  if (context === 'signUp' && isDuplicateAccountError(code, msg)) {
    return 'This email is already in use. Sign in or use a different email.';
  }

  if (code === 'weak_password' || (msg.includes('password') && msg.includes('at least'))) {
    return getPasswordRequirementMessage();
  }

  if (code === 'email_address_invalid' || (msg.includes('email') && (msg.includes('invalid') || msg.includes('valid')))) {
    return 'Please enter a valid email address.';
  }

  if (context === 'signUp' && isRedirectOrUrlConfigError(code, msg)) {
    return 'Sign-up could not complete (email link settings). Contact support — the app may need an authorized redirect URL in the server settings.';
  }

  if (code === 'validation_failed' && context === 'signUp') {
    return 'Some information could not be accepted. Check your details and try again.';
  }

  if (code === 'unexpected_failure' || code === 'unexpected') {
    return 'Something went wrong on our end. Please try again in a few minutes.';
  }

  if (code === 'otp_expired' || msg.includes('invalid token') || msg.includes('already been used')) {
    return 'This link has expired or was already used. Request a new confirmation or reset email.';
  }

  if (msg.includes('pkce') || msg.includes('code verifier')) {
    return 'This session expired. Open the link from your email again, or sign in with your password.';
  }

  if (context === 'callback' && (code === 'invalid_grant' || msg.includes('invalid grant'))) {
    return 'This email link has expired or was already used. Request a new confirmation or reset email.';
  }

  if (context === 'callback') {
    return 'This email link could not be completed. Please try again or sign in with your password.';
  }

  if (context === 'signIn') {
    return 'Sign in failed. Please try again.';
  }
  if (context === 'signUp') {
    return 'Could not create your account. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
