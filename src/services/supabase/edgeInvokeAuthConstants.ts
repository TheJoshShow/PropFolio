/**
 * Shared timing for Edge calls that need a user JWT — keep `prepareSessionForEdgeInvoke` and
 * `edgeInvoke` aligned so we don’t double-refresh or use mismatched buffers.
 */
export const TOKEN_REFRESH_BUFFER_SEC = 45;
/** Safeguard only — coalesced refresh should finish well under this if the network is healthy. */
export const AUTH_REFRESH_SESSION_TIMEOUT_MS = 90_000;
/** `getSession()` reads persisted storage on RN; bound wait so import never hangs silently. */
export const GET_SESSION_FOR_EDGE_BUDGET_MS = 12_000;
