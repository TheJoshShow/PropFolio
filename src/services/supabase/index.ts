export { getSupabaseClient, tryGetSupabaseClient } from './client';
export { coalescedRefreshSession } from './coalescedRefreshSession';
export { AuthPrepError, isInvalidRefreshTokenError } from './authPrepErrors';
export type { AuthPrepCode } from './authPrepErrors';
export {
  getRefreshAttemptsThisVisit,
  logImportAuthEvent,
  resetImportAuthTelemetryForScreenVisit,
} from './importAuthTelemetry';
export { logAuthSessionSnapshot, readAuthSessionSnapshot } from './authSessionDiagnostics';
export { prepareSessionForEdgeInvoke, logImportScreenAuthFocus } from './prepareSessionForEdgeInvoke';
export { registerSupabaseAuthAutoRefresh } from './supabaseAutoRefresh';
export type { PropfolioSupabaseClient } from './types';
