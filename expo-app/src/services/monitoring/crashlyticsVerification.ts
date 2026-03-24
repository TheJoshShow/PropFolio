/**
 * In-app Crashlytics verification (internal / dev builds only).
 *
 * HOW TO USE
 * ————
 * 1. iOS device or simulator with a native build (Expo dev client or release/TestFlight).
 * 2. Settings → scroll to "Release readiness diagnostics" → **Stability checks** (same visibility rules).
 * 3. Tap "Send test signal" — sends a non-fatal + log line searchable in Firebase.
 * 4. Optional (debug builds only): "Close app (test)" — native crash; app stops immediately.
 *
 * HOW TO REMOVE LATER
 * ————
 * - Set `ENABLE_CRASHLYTICS_IN_APP_VERIFICATION` below to `false`, or
 * - Delete this file, remove exports from `monitoring/index.ts`, and remove the "Stability checks"
 *   block from `app/(tabs)/settings.tsx`.
 *
 * See docs/MONITORING_VERIFICATION.md for Firebase console steps.
 */

import { Platform } from 'react-native';

import { getRuntimeConfig } from '../../config';
import {
  enableCrashlyticsUploadForDebugVerification,
  recordMessage,
  recordNonFatal,
  setCrashlyticsAttributes,
  triggerNativeCrashForCrashlyticsVerification,
} from './crashlytics';

/** Flip to `false` to hide all verification UI without deleting code. */
export const ENABLE_CRASHLYTICS_IN_APP_VERIFICATION = true;

const SENTINEL_MESSAGE = 'PropFolio: Crashlytics verification (non-fatal)';
const VERIFY_KEY = 'pf_verify';

export function isCrashlyticsVerificationUiEnabled(): boolean {
  if (!ENABLE_CRASHLYTICS_IN_APP_VERIFICATION) return false;
  if (Platform.OS !== 'ios') return false;
  const c = getRuntimeConfig();
  return __DEV__ || c.qaDiagnosticsEnabled;
}

/** Native crash button: `__DEV__` only — never shown in production release builds. */
export function isCrashlyticsNativeCrashTestUiEnabled(): boolean {
  return (
    ENABLE_CRASHLYTICS_IN_APP_VERIFICATION &&
    Platform.OS === 'ios' &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__
  );
}

/**
 * Sends a searchable non-fatal + custom key via the Crashlytics adapter.
 * In `__DEV__`, temporarily enables upload (normally off in debug) so the event can reach Firebase.
 */
export async function sendCrashlyticsVerificationNonFatal(): Promise<void> {
  if (!isCrashlyticsVerificationUiEnabled()) return;
  try {
    if (__DEV__) {
      await enableCrashlyticsUploadForDebugVerification();
    }
    recordMessage(SENTINEL_MESSAGE, VERIFY_KEY);
    recordNonFatal(new Error(SENTINEL_MESSAGE), 'pf_crashlytics_verification');
    setCrashlyticsAttributes({ [VERIFY_KEY]: 'non_fatal' });
    if (__DEV__) {
      console.log(
        '[PropFolio][Monitoring] Crashlytics verification: non-fatal queued (check Firebase console)'
      );
    }
  } catch {
    /* never throw — verification must not break the app */
  }
}

/**
 * **Debug only.** No-ops unless `__DEV__` (enforced in `crashlytics.ts` as well).
 */
export function requestCrashlyticsNativeTestCrash(): void {
  if (!isCrashlyticsNativeCrashTestUiEnabled()) return;
  triggerNativeCrashForCrashlyticsVerification();
}
