import type { AuthError } from '@supabase/supabase-js';

/**
 * Maps Supabase Auth errors to concise, user-safe copy (no internal codes leaked).
 */
export function mapAuthError(error: AuthError | null | undefined, fallback: string): string {
  if (!error?.message) {
    return fallback;
  }
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'That email or password does not match our records.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for the link.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('password') && msg.includes('least')) {
    return error.message;
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (msg.includes('network')) {
    return 'Network error. Check your connection and try again.';
  }

  return error.message;
}
