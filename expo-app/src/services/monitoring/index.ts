/**
 * Crash / error monitoring facade (Firebase Crashlytics on iOS production builds).
 * Safe on all platforms; never throws to callers.
 */

import {
  initCrashlytics,
  recordError as crashlyticsRecordError,
  recordMessage as crashlyticsRecordMessage,
  recordNonFatal as crashlyticsRecordNonFatal,
  clearUserContext as crashlyticsClearUserContext,
  setUserContext as crashlyticsSetUserContext,
  setCrashlyticsAttributes,
} from './crashlytics';

import { reportCapturedError } from './capturedError';
import { installGlobalErrorHandlers } from './globalHandlers';
import { applyStartupMonitoringAttributes } from './appMonitoringContext';

import type { MonitoringUserContext } from './types';

export type { MonitoringUserContext };

export { reportCapturedError };

export { recordFlowIssue, recordFlowException, serializeFlowDetail } from './flowInstrumentation';
export { classifyClientError } from './clientErrorClassification';
export type { ClientErrorKind, ClientErrorClass } from './clientErrorClassification';

export { MonitoringAttr } from './attributeKeys';
export {
  applyMonitoringSessionSignedIn,
  applyMonitoringSessionSignedOut,
  setMonitoringPortfolioPropertyCount,
} from './sessionContext';

/**
 * Set sanitized custom keys (use MonitoringAttr names when possible).
 */
export function setMonitoringAttributes(attrs: Record<string, string>): void {
  try {
    setCrashlyticsAttributes(attrs);
  } catch {
    /* noop */
  }
}

/**
 * Call once at app startup (e.g. root layout).
 */
export function initMonitoring(): void {
  try {
    initCrashlytics();
    installGlobalErrorHandlers();
    applyStartupMonitoringAttributes();
  } catch {
    /* never crash app */
  }
}

export function recordError(error: unknown, context?: string): void {
  try {
    crashlyticsRecordError(error, context);
  } catch {
    /* noop */
  }
}

export function recordNonFatal(error: unknown, context?: string): void {
  try {
    crashlyticsRecordNonFatal(error, context);
  } catch {
    /* noop */
  }
}

export function recordMessage(message: string, context?: string): void {
  try {
    crashlyticsRecordMessage(message, context);
  } catch {
    /* noop */
  }
}

export function setUserContext(user: MonitoringUserContext | null): void {
  try {
    crashlyticsSetUserContext(user);
  } catch {
    /* noop */
  }
}

export function clearUserContext(): void {
  try {
    crashlyticsClearUserContext();
  } catch {
    /* noop */
  }
}

/**
 * Internal Crashlytics verification (dev / QA-diagnostics builds). See `crashlyticsVerification.ts`.
 * Remove exports when removing the verification UI.
 */
export {
  ENABLE_CRASHLYTICS_IN_APP_VERIFICATION,
  isCrashlyticsVerificationUiEnabled,
  isCrashlyticsNativeCrashTestUiEnabled,
  sendCrashlyticsVerificationNonFatal,
  requestCrashlyticsNativeTestCrash,
} from './crashlyticsVerification';
