/**
 * Targeted flow signals for Crashlytics: concise codes + safe attributes (no PII/tokens).
 * Uses short dedupe windows to avoid duplicate reports when the same failure bubbles.
 */

import Constants from 'expo-constants';

import { classifyClientError } from './clientErrorClassification';
import { recordMessage } from './crashlytics';
import { reportCapturedError } from './capturedError';

function envLabel(): string {
  return __DEV__ ? 'dev' : 'prod';
}

function appVersion(): string {
  try {
    const v = Constants.expoConfig?.version ?? (Constants as { nativeAppVersion?: string }).nativeAppVersion;
    return typeof v === 'string' && v.length > 0 ? v : 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Serialize safe detail map; string values truncated. */
export function serializeFlowDetail(detail?: Record<string, string | number | boolean | undefined>): string {
  if (!detail || Object.keys(detail).length === 0) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(detail)) {
    if (v === undefined) continue;
    if (typeof v === 'string') {
      parts.push(`${k}=${v.slice(0, 80)}`);
    } else {
      parts.push(`${k}=${String(v)}`);
    }
  }
  return parts.join(';').slice(0, 320);
}

let lastMsgKey = '';
let lastMsgAt = 0;
const MSG_DEDUP_MS = 2500;

/**
 * Non-exception flow signal (e.g. parse failed, empty offerings). Deduped by full line.
 */
export function recordFlowIssue(
  eventCode: string,
  detail?: Record<string, string | number | boolean | undefined>
): void {
  try {
    const base: Record<string, string | number | boolean | undefined> = {
      env: envLabel(),
      v: appVersion(),
      ...detail,
    };
    const serialized = serializeFlowDetail(base);
    const line = `flow:${eventCode}:${serialized}`;
    const key = line.slice(0, 500);
    const now = Date.now();
    if (key === lastMsgKey && now - lastMsgAt < MSG_DEDUP_MS) {
      return;
    }
    lastMsgKey = key;
    lastMsgAt = now;
    recordMessage(line, 'flow');
  } catch {
    /* noop */
  }
}

/**
 * Exception with flow code; uses global duplicate suppression for identical errors.
 * Adds **client_kind** + **recoverable** from {@link classifyClientError} unless overridden in `detail`.
 */
export function recordFlowException(
  eventCode: string,
  error: unknown,
  detail?: Record<string, string | number | boolean | undefined>
): void {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const classified = classifyClientError(error);
    const merged: Record<string, string | number | boolean | undefined> = {
      env: envLabel(),
      v: appVersion(),
      ...(detail ?? {}),
    };
    if (merged.client_kind === undefined) merged.client_kind = classified.kind;
    if (merged.recoverable === undefined) merged.recoverable = classified.recoverable;
    const ctx = `flow:${eventCode}:${serializeFlowDetail(merged)}`.slice(0, 260);
    reportCapturedError(err, ctx);
  } catch {
    /* noop */
  }
}
