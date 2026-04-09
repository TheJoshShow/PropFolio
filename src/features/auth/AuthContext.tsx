import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { isSupabaseConfigured } from '@/config';
import { applySessionFromUrl, fetchProfileByUserId, type ProfileRow } from '@/services/auth';
import { getSupabaseClient, tryGetSupabaseClient } from '@/services/supabase';
import { syncSessionMirrorFromSession } from '@/services/supabase/sessionMirrorForEdge';

type AuthContextState = {
  phase: 'loading' | 'ready';
  isConfigured: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  isPasswordRecovery: boolean;
};

const initial: AuthContextState = {
  phase: 'loading',
  isConfigured: true,
  session: null,
  user: null,
  profile: null,
  isPasswordRecovery: false,
};

type AuthContextValue = AuthContextState & {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function hydrateFromSession(
  client: ReturnType<typeof getSupabaseClient>,
  session: Session | null,
): Promise<{ user: User | null; profile: ProfileRow | null }> {
  const user = session?.user ?? null;
  if (!user) {
    return { user: null, profile: null };
  }
  const profile = await fetchProfileByUserId(client, user.id);
  return { user, profile };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextState>(initial);
  const recoveryRef = useRef(false);

  const clearPasswordRecovery = useCallback(() => {
    recoveryRef.current = false;
    setState((s) => ({ ...s, isPasswordRecovery: false }));
  }, []);

  const refreshProfile = useCallback(async () => {
    const client = tryGetSupabaseClient();
    if (!client) {
      return;
    }
    const { data: { session } } = await client.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }
    const profile = await fetchProfileByUserId(client, userId);
    setState((s) => ({ ...s, profile }));
  }, []);

  const signOut = useCallback(async () => {
    const client = tryGetSupabaseClient();
    recoveryRef.current = false;
    if (client) {
      await client.auth.signOut();
    }
    setState({
      phase: 'ready',
      isConfigured: isSupabaseConfigured(),
      session: null,
      user: null,
      profile: null,
      isPasswordRecovery: false,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    let linkSub: ReturnType<typeof Linking.addEventListener> | undefined;
    let authUnsub: { unsubscribe: () => void } | undefined;

    void (async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch {
        /* splash already handled */
      }

      if (!isSupabaseConfigured()) {
        if (mounted) {
          setState({
            phase: 'ready',
            isConfigured: false,
            session: null,
            user: null,
            profile: null,
            isPasswordRecovery: false,
          });
        }
        await SplashScreen.hideAsync();
        return;
      }

      const client = getSupabaseClient();

      const handleUrl = async (url: string | null) => {
        if (!url) {
          return;
        }
        const result = await applySessionFromUrl(client, url);
        if (!result.ok) {
          console.warn('[PropFolio] deep link session:', result.message);
        }
      };

      await handleUrl(await Linking.getInitialURL());

      if (!mounted) {
        return;
      }

      linkSub = Linking.addEventListener('url', ({ url }) => {
        void handleUrl(url);
      });

      const { data: sessionData } = await client.auth.getSession();
      const session = sessionData.session;
      const hydrated = await hydrateFromSession(client, session);

      if (mounted) {
        setState({
          phase: 'ready',
          isConfigured: true,
          session,
          user: hydrated.user,
          profile: hydrated.profile,
          isPasswordRecovery: recoveryRef.current,
        });
      }

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(async (event, nextSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          recoveryRef.current = true;
        }
        if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
          recoveryRef.current = false;
        }
        if (event === 'SIGNED_OUT') {
          recoveryRef.current = false;
        }

        const h = await hydrateFromSession(client, nextSession);

        if (mounted) {
          setState((prev) => ({
            ...prev,
            phase: 'ready',
            session: nextSession,
            user: h.user,
            profile: h.profile,
            isPasswordRecovery: recoveryRef.current,
          }));
        }
      });

      authUnsub = subscription;
      await SplashScreen.hideAsync();
    })();

    return () => {
      mounted = false;
      linkSub?.remove();
      authUnsub?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!state.isConfigured) {
      syncSessionMirrorFromSession(null);
      return;
    }
    syncSessionMirrorFromSession(state.session);
  }, [state.isConfigured, state.session]);

  const value = useMemo(
    () => ({
      ...state,
      signOut,
      refreshProfile,
      clearPasswordRecovery,
    }),
    [state, signOut, refreshProfile, clearPasswordRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  const emailConfirmed = Boolean(ctx.user?.email_confirmed_at);
  const isSignedIn = Boolean(ctx.session && ctx.user);
  const needsEmailVerification = Boolean(ctx.session && ctx.user && !ctx.user.email_confirmed_at);

  return {
    ...ctx,
    isReady: ctx.phase === 'ready',
    isSignedIn,
    emailConfirmed,
    needsEmailVerification,
  };
}
