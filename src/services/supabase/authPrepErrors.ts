/**
 * Structured errors for import-time session preparation and Edge JWT recovery.
 * Lets UI distinguish “slow network” vs “session dead” vs generic failures.
 */
export type AuthPrepCode =
  | 'invalid_refresh'
  | 'refresh_timeout'
  | 'get_session_timeout'
  | 'no_session';

export class AuthPrepError extends Error {
  readonly code: AuthPrepCode;

  constructor(code: AuthPrepCode, message: string) {
    super(message);
    this.name = 'AuthPrepError';
    this.code = code;
  }
}

/** GoTrue / SupabaseAuthError shapes vary by version — match common refresh failure strings. */
export function isInvalidRefreshTokenError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase();
  return (
    m.includes('invalid_grant') ||
    m.includes('invalid refresh token') ||
    m.includes('invalid_refresh_token') ||
    m.includes('refresh token not found') ||
    m.includes('already used') ||
    (m.includes('jwt') && m.includes('refresh') && m.includes('expired'))
  );
}
