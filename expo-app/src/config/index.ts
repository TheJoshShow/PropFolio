/**
 * **Single entry for client configuration.** Import from `~/config` (or `../config` from `src/`).
 *
 * - **`getRuntimeConfig()`** — all `EXPO_PUBLIC_*` values (trimmed strings / flags).
 * - **`validateAuthEnv()`** / **`validateRuntimeConfigForDev()`** — startup checks.
 * - **Billing / legal** — re-exported for convenience; prefer this barrel over deep paths in new code.
 *
 * Do not read `process.env` elsewhere for `EXPO_PUBLIC_*`; extend `runtimeConfig.ts` if a new key is needed.
 */

export {
  getRuntimeConfig,
  validateRuntimeConfigForDev,
  validateRuntimeConfigForRelease,
  getRuntimeConfigDiagnostics,
  CLIENT_EXPO_PUBLIC_ENV_KEYS,
  type RuntimeConfig,
  type RuntimeConfigDiagnostics,
  type RuntimeReleaseValidationResult,
} from './runtimeConfig';

export {
  validateAuthEnv,
  isAuthEnvConfigured,
  getAuthConfigurationUserMessage,
  type AuthEnvResult,
} from './env';

export { getAccountServicesUnavailableBannerMessage } from './accountServicesAvailability';

export * from './billing';
export * from './legalUrls';
export {
  EDGE_FUNCTION_NAMES,
  edgeFunctionToIntegrationName,
  SERVICE_BOOT_NOTES,
  type EdgeFunctionName,
} from './services';
