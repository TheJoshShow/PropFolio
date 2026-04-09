import type { Session, User } from '@supabase/supabase-js';

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthPhase =
  | 'loading'
  | 'ready_signed_out'
  | 'ready_signed_in'
  | 'unconfigured';

export type AuthContextValue = {
  phase: AuthPhase;
  isReady: boolean;
  isConfigured: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  /** True after PASSWORD_RECOVERY until password is updated or user signs out */
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearPasswordRecovery: () => void;
};

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };
