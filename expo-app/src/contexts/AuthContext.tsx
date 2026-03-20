/**
 * Auth context: single source of truth for session and sign-in/out.
 * Production/TestFlight requires Supabase to be configured (EXPO_PUBLIC_SUPABASE_*).
 * Supports email/password, OAuth (Google, Apple), magic link, and forgot password.
 * Ensures a profiles row exists after signup and on session load.
 * Protected routes (e.g. tabs) read session here to gate access.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSupabase } from '../services/supabase';
import { ensureProfileWithFallback } from '../services/profile';
import { logErrorSafe } from '../services/diagnostics';
import { deleteAccount as deleteAccountApi } from '../services/edgeFunctions';
import { validateAuthEnv } from '../config/env';
import {
  getAuthRedirectUrl,
  getSessionParamsFromUrl,
  isAuthCallbackUrl,
} from '../utils/authRedirect';
import type { ProfileMetadata } from '../services/profile';
import { trackEvent } from '../services/analytics';
import { normalizePhoneNumber } from '../utils/phone';
import { shouldTrustSessionWithoutUserFetch } from '../utils/authBootstrap';

/** Complete any in-progress browser auth session (required for OAuth on web). iOS-only build: this block is no-op. */
if (typeof Platform !== 'undefined' && Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

/** Session shape from Supabase auth (avoids importing when types unavailable). */
interface AuthSession {
  user: { id: string; email?: string; user_metadata?: ProfileMetadata };
}

export interface User {
  id: string;
  email?: string;
  phone_number?: string;
}

export interface SignUpResult {
  needsEmailConfirmation: boolean;
}

export interface MagicLinkResult {
  sent: boolean;
}

export interface ResetPasswordResult {
  sent: boolean;
}

export type OAuthProvider = 'google' | 'apple';

interface AuthContextValue {
  session: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    /** E.164 normalized, or omit / empty when the user leaves phone blank */
    phoneNumber?: string;
  }) => Promise<SignUpResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<MagicLinkResult>;
  resetPassword: (email: string) => Promise<ResetPasswordResult>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Delete account (server deletes user); then clears session. Throws on error. */
  deleteAccount: () => Promise<void>;
  isLoading: boolean;
  isAuthConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function assertAuthConfigured(supabase: ReturnType<typeof getSupabase>): asserts supabase {
  if (!supabase) {
    throw new Error('Authentication is not configured. Please try again later.');
  }
}

function userFromSupabaseUser(u: { id: string; email?: string; user_metadata?: ProfileMetadata }): User {
  const phoneNormalized =
    typeof u.user_metadata?.phone_number === 'string' ? normalizePhoneNumber(u.user_metadata.phone_number) : null;
  return { id: u.id, email: u.email ?? undefined, phone_number: phoneNormalized ?? undefined };
}

/**
 * Single profile bootstrap path: same full→minimal fallback as import (`ensureUserReadyForImport`),
 * so sign-in/session refresh and import repair behave consistently (schema drift, RLS timing).
 */
async function ensureProfileForUser(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  metadata?: ProfileMetadata | null
): Promise<{ error: Error | null }> {
  if (!supabase) return { error: null };
  const { error } = await ensureProfileWithFallback(supabase, userId, metadata ?? null);
  if (error) logErrorSafe('AuthContext ensureProfileForUser', error);
  return { error };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authEnv = validateAuthEnv();
  const supabase = getSupabase();
  const [session, setSession] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!!supabase);

  /**
   * Hydrate React auth state from a Supabase session.
   * - Always validates with getUser() unless the auth event implies a server-fresh session (TOKEN_REFRESHED).
   * - Invalid / expired storage sessions are cleared via signOut({ scope: 'local' }).
   */
  const applySessionFromAuth = useCallback(
    async (s: AuthSession | null, event: string) => {
      if (!supabase) return;
      if (!s?.user) {
        setSession(null);
        setIsLoading(false);
        return;
      }
      if (shouldTrustSessionWithoutUserFetch(event)) {
        setSession(userFromSupabaseUser(s.user));
        return;
      }
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setIsLoading(false);
        return;
      }
      const user = userData.user as { id: string; email?: string; user_metadata?: ProfileMetadata };
      setSession(userFromSupabaseUser(user));
      setIsLoading(false);
      await ensureProfileForUser(supabase, user.id, user.user_metadata);
    },
    [supabase]
  );

  const createSessionFromUrl = useCallback(
    async (url: string) => {
      if (!supabase) return;
      const params = getSessionParamsFromUrl(url);
      if (!params?.access_token) return;
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) throw error;
        if (data.session?.user) {
          await applySessionFromAuth(data.session as AuthSession, 'OAUTH_CALLBACK');
        }
      } catch (e) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('[Auth] createSessionFromUrl', e);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, applySessionFromAuth]
  );

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    void (async () => {
      const { data: { session: stored } } = await supabase.auth.getSession();
      if (cancelled) return;
      await applySessionFromAuth(stored, 'GET_SESSION_BOOTSTRAP');
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, s: AuthSession | null) => {
      if (cancelled) return;
      // Duplicate of GET_SESSION bootstrap; skipping avoids double getUser + ensureProfile.
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsLoading(false);
        return;
      }
      await applySessionFromAuth(s, event);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, applySessionFromAuth]);

  useEffect(() => {
    if (!supabase || Platform.OS === 'web') return;
    const handleUrl = (event: { url: string }) => {
      if (isAuthCallbackUrl(event.url)) {
        setIsLoading(true);
        createSessionFromUrl(event.url);
      }
    };
    Linking.getInitialURL().then((url) => {
      if (url && isAuthCallbackUrl(url)) {
        setIsLoading(true);
        createSessionFromUrl(url);
      }
    });
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, [supabase, createSessionFromUrl]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        assertAuthConfigured(supabase);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Ensure profiles row exists immediately (prevents FK failures on first import).
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          const u = data.user as { id: string; email?: string; user_metadata?: ProfileMetadata };
          await ensureProfileForUser(supabase, u.id, (u as { user_metadata?: ProfileMetadata }).user_metadata ?? null);
        }
        trackEvent('login_completed', { metadata: {} });
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    }): Promise<SignUpResult> => {
      assertAuthConfigured(supabase);
      const redirectTo = getAuthRedirectUrl();
      setIsLoading(true);
      try {
        const rawPhone = params.phoneNumber?.trim() ?? '';
        const phoneNormalized = rawPhone.length > 0 ? normalizePhoneNumber(rawPhone) : null;
        const userMeta: Record<string, string> = {
          first_name: params.firstName.trim(),
          last_name: params.lastName.trim(),
        };
        if (phoneNormalized) {
          userMeta.phone_number = phoneNormalized;
        }
        const { data, error } = await supabase.auth.signUp({
          email: params.email.trim().toLowerCase(),
          password: params.password,
          options: {
            data: userMeta,
            // Ensures Supabase sends the user back to the app via native deep link on iOS.
            // Without this, Supabase falls back to Dashboard "Site URL" (which may be localhost in dev).
            emailRedirectTo: redirectTo,
          },
        });
        if (error) throw error;
        const hasSession = !!data.session;
        if (hasSession && data.session?.user) {
          const user = data.session.user as { id: string; email?: string; user_metadata?: ProfileMetadata };
          setSession(userFromSupabaseUser(user));
          const { error: profileEnsureError } = await ensureProfileForUser(supabase, user.id, user.user_metadata);
          if (profileEnsureError && phoneNormalized) {
            logErrorSafe(
              'AuthContext signUp: profiles upsert failed; phone remains in auth metadata until next sync',
              profileEnsureError
            );
          }
        }
        trackEvent('signup_completed', { metadata: {} });
        return { needsEmailConfirmation: !hasSession };
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<ResetPasswordResult> => {
      if (!supabase) return { sent: false };
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: getAuthRedirectUrl(),
      });
      if (error) throw error;
      return { sent: true };
    },
    [supabase]
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      assertAuthConfigured(supabase);
      const redirectTo = getAuthRedirectUrl();
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        const url = data?.url;
        if (!url) throw new Error('No OAuth URL returned');
        if (Platform.OS === 'web') {
          window.location.href = url;
          return;
        }
        const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
        setIsLoading(false);
        if (result.type === 'success' && result.url) {
          await createSessionFromUrl(result.url);
        }
      } catch (e) {
        setIsLoading(false);
        throw e;
      }
    },
    [supabase, createSessionFromUrl]
  );

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<MagicLinkResult> => {
      assertAuthConfigured(supabase);
      const redirectTo = getAuthRedirectUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      return { sent: true };
    },
    [supabase]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      assertAuthConfigured(supabase);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    setSession(null);
    setIsLoading(true);
    try {
      assertAuthConfigured(supabase);
      await supabase.auth.signOut({ scope: 'global' });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const deleteAccount = useCallback(async () => {
    assertAuthConfigured(supabase);
    const { data, error } = await deleteAccountApi();
    if (error) throw new Error(error);
    if (!data?.success) throw new Error('Account could not be deleted.');
    setSession(null);
    setIsLoading(false);
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // Session may already be invalid after user deletion; ignore.
    }
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        session,
        signIn,
        signUp,
        signInWithOAuth,
        signInWithMagicLink,
        resetPassword,
        updatePassword,
        signOut,
        deleteAccount,
        isLoading,
        isAuthConfigured: authEnv.isValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
