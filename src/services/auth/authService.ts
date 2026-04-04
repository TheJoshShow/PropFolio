import type { SupabaseClient } from '@supabase/supabase-js';

import { getEmailConfirmationRedirectUrl, getPasswordResetRedirectUrl } from '@/config/authRedirects';

import { mapAuthError } from './mapAuthError';
import { parseAuthTokensFromUrl } from './parseAuthCallbackUrl';
import type { ServiceResult } from './types';

export type SignInResult = ServiceResult<{ sessionCreated: true }>;

export type SignUpResult = ServiceResult<{
  /** False when email confirmation is required and no session is returned */
  sessionActive: boolean;
  email: string;
}>;

export async function signInWithEmail(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<SignInResult> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    const low = error.message.toLowerCase();
    if (low.includes('email not confirmed')) {
      return {
        ok: false,
        message: mapAuthError(error, 'Please confirm your email before signing in.'),
        code: 'email_not_confirmed',
      };
    }
    return { ok: false, message: mapAuthError(error, 'Could not sign you in.'), code: error.code };
  }
  if (!data.session) {
    return {
      ok: false,
      message: 'Please confirm your email before signing in.',
      code: 'email_not_confirmed',
    };
  }
  return { ok: true, data: { sessionCreated: true } };
}

export async function signUpWithEmail(
  client: SupabaseClient,
  email: string,
  password: string,
  fullName: string,
): Promise<SignUpResult> {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailConfirmationRedirectUrl(),
      data: { full_name: fullName },
    },
  });
  if (error) {
    return { ok: false, message: mapAuthError(error, 'Could not create your account.') };
  }
  const sessionActive = Boolean(data.session);
  return {
    ok: true,
    data: { sessionActive, email },
  };
}

export async function requestPasswordReset(
  client: SupabaseClient,
  email: string,
): Promise<ServiceResult<{ sent: true }>> {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl(),
  });
  if (error) {
    return { ok: false, message: mapAuthError(error, 'Could not send reset email.') };
  }
  return { ok: true, data: { sent: true } };
}

export async function updatePassword(
  client: SupabaseClient,
  newPassword: string,
): Promise<ServiceResult<{ updated: true }>> {
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, message: mapAuthError(error, 'Could not update password.') };
  }
  return { ok: true, data: { updated: true } };
}

export async function resendSignupConfirmation(
  client: SupabaseClient,
  email: string,
): Promise<ServiceResult<{ sent: true }>> {
  const { error } = await client.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: getEmailConfirmationRedirectUrl() },
  });
  if (error) {
    return { ok: false, message: mapAuthError(error, 'Could not resend confirmation email.') };
  }
  return { ok: true, data: { sent: true } };
}

export async function applySessionFromUrl(
  client: SupabaseClient,
  url: string,
): Promise<ServiceResult<{ applied: boolean }>> {
  const { access_token, refresh_token } = parseAuthTokensFromUrl(url);
  if (!access_token || !refresh_token) {
    return { ok: true, data: { applied: false } };
  }
  const { error } = await client.auth.setSession({ access_token, refresh_token });
  if (error) {
    return { ok: false, message: mapAuthError(error, 'This sign-in link is invalid or expired.') };
  }
  return { ok: true, data: { applied: true } };
}
