import * as Linking from 'expo-linking';

/**
 * URLs Supabase must allow under Authentication → URL Configuration → Redirect URLs.
 * Use the exact string the app logs on first open if deep links fail.
 */
export function getEmailConfirmationRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

export function getPasswordResetRedirectUrl(): string {
  return Linking.createURL('reset-password');
}
