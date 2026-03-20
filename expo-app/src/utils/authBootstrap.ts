/**
 * Maps Supabase auth events to how we hydrate React state.
 * getSession() / INITIAL_SESSION can reflect storage only — validate with getUser() unless
 * the event implies the server already produced a fresh session (e.g. TOKEN_REFRESHED).
 */

/** Events where the session was just refreshed server-side; user JWT is current. */
export function shouldTrustSessionWithoutUserFetch(event: string): boolean {
  return event === 'TOKEN_REFRESHED';
}
