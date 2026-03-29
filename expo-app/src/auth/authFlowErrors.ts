/**
 * Typed errors for auth flows so the UI can map them without relying on Supabase internals.
 */

export type ProfileSetupFailureKind = 'rls_or_permission' | 'trigger_or_constraint' | 'unknown';

/** Profile row could not be created after a session was issued; session is cleared before throw. */
export class ProfileSetupError extends Error {
  override readonly name = 'ProfileSetupError';

  readonly kind: ProfileSetupFailureKind;

  constructor(kind: ProfileSetupFailureKind = 'unknown') {
    super('PROFILE_SETUP_FAILED');
    this.kind = kind;
  }
}

/** Supabase returned success-shaped response without a user row (unexpected). */
export class SignupIncompleteResponseError extends Error {
  override readonly name = 'SignupIncompleteResponseError';

  constructor() {
    super('SIGNUP_INCOMPLETE_RESPONSE');
  }
}
