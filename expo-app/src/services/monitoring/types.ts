/**
 * Shared types for crash / error monitoring (Firebase Crashlytics on iOS).
 * Avoid PII in identifiers; prefer opaque user ids from your auth system.
 */
export type MonitoringUserContext = {
  /** Opaque user id (e.g. Supabase auth user id). */
  id?: string;
  /** Not sent to Crashlytics by default; reserved for future opt-in flows. */
  email?: string;
  username?: string;
};
