/**
 * Firebase Crashlytics adapter (iOS native builds only).
 * All entry points are defensive: never throw to callers.
 */

import { Platform } from 'react-native';

import { sanitizeMonitoringKey, sanitizeMonitoringValue } from './attributeSanitizer';
import type { MonitoringUserContext } from './types';

const LOG_PREFIX = '[PropFolio][Crashlytics]';

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error != null && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message?: unknown }).message));
  }
  return new Error(String(error));
}

type CrashlyticsModule = {
  log(message: string): void;
  recordError(error: Error, jsErrorName?: string): void;
  crash(): void;
  setAttribute(name: string, value: string): Promise<null>;
  setUserId(userId: string): Promise<null>;
  setCrashlyticsCollectionEnabled(enabled: boolean): Promise<null>;
};

function getCrashlytics(): CrashlyticsModule | null {
  if (Platform.OS !== 'ios') {
    return null;
  }
  try {
    // Lazy require so Jest / web bundles never load native Firebase at import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional dynamic native import
    const mod = require('@react-native-firebase/crashlytics') as { default: () => CrashlyticsModule };
    return mod.default();
  } catch {
    return null;
  }
}

function devLog(...args: unknown[]): void {
  if (__DEV__) {
    console.log(LOG_PREFIX, ...args);
  }
}

function devWarn(...args: unknown[]): void {
  if (__DEV__) {
    console.warn(LOG_PREFIX, ...args);
  }
}

let initCalled = false;

export function initCrashlytics(): void {
  if (initCalled) {
    return;
  }
  initCalled = true;

  try {
    const c = getCrashlytics();
    if (!c) {
      devLog('not available (non-iOS or native module missing)');
      return;
    }

    // Reduce noise in local dev; production/TestFlight sends reports.
    void c.setCrashlyticsCollectionEnabled(!__DEV__).catch(() => {
      /* ignore */
    });

    devLog('initialized; collection', __DEV__ ? 'disabled in __DEV__' : 'enabled');
  } catch (e) {
    devWarn('init failed (non-fatal)', e);
  }
}

export function recordError(error: unknown, context?: string): void {
  try {
    const err = normalizeError(error);
    if (__DEV__) {
      devWarn('recordError', context ?? '(no context)', err.message);
    }
    const c = getCrashlytics();
    if (!c) return;
    if (context) {
      void c.setAttribute('monitoring_context', context.slice(0, 100)).catch(() => {});
    }
    c.recordError(err, context ? 'app_error' : undefined);
  } catch (e) {
    devWarn('recordError failed', e);
  }
}

export function recordNonFatal(error: unknown, context?: string): void {
  recordError(error, context ? `non_fatal:${context}` : 'non_fatal');
}

export function recordMessage(message: string, context?: string): void {
  try {
    const line = context ? `[${context}] ${message}` : message;
    if (__DEV__) {
      devLog('recordMessage', line);
    }
    const c = getCrashlytics();
    if (!c) return;
    c.log(line.slice(0, 1200));
  } catch (e) {
    devWarn('recordMessage failed', e);
  }
}

/**
 * Set multiple custom keys at once (values sanitized; empty values skipped).
 */
export function setCrashlyticsAttributes(attrs: Record<string, string>): void {
  try {
    const c = getCrashlytics();
    if (!c) return;
    for (const [rawKey, rawVal] of Object.entries(attrs)) {
      const key = sanitizeMonitoringKey(rawKey) ?? rawKey.slice(0, 32);
      const val = sanitizeMonitoringValue(rawVal);
      if (!key || !val) continue;
      void c.setAttribute(key, val).catch(() => {});
    }
  } catch (e) {
    devWarn('setCrashlyticsAttributes failed', e);
  }
}

export function setUserContext(user: MonitoringUserContext | null): void {
  try {
    const c = getCrashlytics();
    if (!c) return;

    if (!user || !user.id) {
      void c.setUserId('').catch(() => {});
      devLog('setUserContext', 'cleared (no opaque id)');
      return;
    }

    // Firebase recommends an opaque id; do not send email by default.
    void c.setUserId(user.id.slice(0, 128)).catch(() => {});
    devLog('setUserContext', `opaque user id set (len=${user.id.length})`);
    if (__DEV__ && user.username) {
      void c.setAttribute('username', user.username.slice(0, 64)).catch(() => {});
    }
  } catch (e) {
    devWarn('setUserContext failed', e);
  }
}

export function clearUserContext(): void {
  try {
    const c = getCrashlytics();
    if (!c) return;
    void c.setUserId('').catch(() => {});
  } catch (e) {
    devWarn('clearUserContext failed', e);
  }
}

/**
 * **Debug only:** `initCrashlytics()` disables upload in `__DEV__`. Call this before
 * verification sends so a test non-fatal can reach Firebase (see `crashlyticsVerification.ts`).
 * No-ops in production builds (`!__DEV__`).
 */
export async function enableCrashlyticsUploadForDebugVerification(): Promise<void> {
  if (!__DEV__) return;
  try {
    const c = getCrashlytics();
    if (!c) return;
    await c.setCrashlyticsCollectionEnabled(true).catch(() => {});
    devLog('verification: upload enabled for this session (debug)');
  } catch (e) {
    devWarn('enableCrashlyticsUploadForDebugVerification failed', e);
  }
}

/**
 * **Debug only:** Forces a native crash for Crashlytics pipeline testing.
 * Never call from production code paths — gated by `__DEV__` here.
 * Note: iOS debuggers may intercept; disconnect or disable "break on exceptions" to see the report.
 */
export function triggerNativeCrashForCrashlyticsVerification(): void {
  if (!__DEV__) return;
  try {
    const c = getCrashlytics();
    if (!c) {
      devWarn('verification native crash: Crashlytics unavailable');
      return;
    }
    void c
      .setCrashlyticsCollectionEnabled(true)
      .then(() => {
        c.log('[pf_verify] PropFolio native test (dev only)');
        c.crash();
      })
      .catch((e) => {
        devWarn('verification native crash: enable collection failed', e);
      });
  } catch (e) {
    devWarn('verification native crash failed', e);
  }
}
