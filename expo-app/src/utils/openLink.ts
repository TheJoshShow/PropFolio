/**
 * Safe external link opening for App Store compliance.
 * Validates URLs, uses Linking.canOpenURL before openURL, and surfaces clear alerts on failure.
 *
 * Legal documents (`openLegalDocument`): try the system browser via Linking first; if that cannot
 * open the URL, fall back to `expo-web-browser` (in-app Safari / Chrome Custom Tabs).
 */

import { Linking, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { logErrorSafe } from '../services/diagnostics';
import { getPrivacyPolicyUrl, getTermsUrl } from '../config/legalUrls';

const DEFAULT_FAILURE_TITLE = 'Cannot open link';
const DEFAULT_FAILURE_MESSAGE = 'The link could not be opened.';

/** User-facing copy when a legal document cannot be opened (Settings / Paywall / Sign-up). */
export const LEGAL_DOCUMENT_OPEN_FAILURE_MESSAGE =
  "We couldn't open that page right now. Please try again.";

/**
 * Returns true for non-empty http(s) or mailto URLs.
 */
export function isValidExternalUrl(url: string): boolean {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:';
  } catch {
    return false;
  }
}

export interface OpenUrlSafeOptions {
  /** Alert title when open fails (invalid URL, canOpenURL false, or exception). */
  failureTitle?: string;
  /** Alert message when open fails. */
  failureMessage?: string;
  /** Included in developer logs on failure. */
  logContext?: string;
}

/**
 * Open a URL (e.g. support, billing). Validates scheme; shows an alert if the URL cannot be opened.
 */
export async function openUrlSafe(url: string, options?: OpenUrlSafeOptions): Promise<void> {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  const title = options?.failureTitle ?? DEFAULT_FAILURE_TITLE;
  const message = options?.failureMessage ?? DEFAULT_FAILURE_MESSAGE;
  const logCtx = options?.logContext ?? 'openUrlSafe';

  if (!isValidExternalUrl(trimmed)) {
    logErrorSafe(`${logCtx}: invalid URL`, new Error(trimmed || '(empty)'));
    Alert.alert(title, message);
    return;
  }

  try {
    const can = await Linking.canOpenURL(trimmed);
    if (can) {
      await Linking.openURL(trimmed);
    } else {
      logErrorSafe(`${logCtx}: canOpenURL false`, new Error(trimmed));
      Alert.alert(title, message);
    }
  } catch (e) {
    logErrorSafe(logCtx, e instanceof Error ? e : new Error(String(e)));
    Alert.alert(title, message);
  }
}

/**
 * Try in-app browser (SFSafariViewController on iOS, Chrome Custom Tabs on Android).
 * Returns false if opening fails so callers can show an alert.
 */
async function tryOpenInAppBrowser(url: string, logCtx: string): Promise<boolean> {
  try {
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch (e) {
    logErrorSafe(`${logCtx} in-app browser`, e instanceof Error ? e : new Error(String(e)));
    return false;
  }
}

/**
 * Open Privacy Policy or Terms of Service.
 * 1) Prefer opening in the system browser (`Linking.openURL`).
 * 2) If that is unavailable or throws, fall back to an in-app browser (`WebBrowser.openBrowserAsync`).
 * 3) If both fail, show a single user-facing alert.
 *
 * Uses centralized URLs from `legalUrls` only.
 */
export async function openLegalDocument(kind: 'privacy' | 'terms'): Promise<void> {
  const url = kind === 'privacy' ? getPrivacyPolicyUrl() : getTermsUrl();
  const logCtx = kind === 'privacy' ? 'openLegalDocument:privacy' : 'openLegalDocument:terms';

  if (!isValidExternalUrl(url)) {
    logErrorSafe(`${logCtx} invalid URL`, new Error(url || '(empty)'));
    Alert.alert(LEGAL_DOCUMENT_OPEN_FAILURE_MESSAGE);
    return;
  }

  // Web: same-origin / window behavior is fine with Linking; fall back to in-app browser if needed.
  if (Platform.OS === 'web') {
    try {
      await Linking.openURL(url);
      return;
    } catch (e) {
      logErrorSafe(`${logCtx} Linking (web)`, e instanceof Error ? e : new Error(String(e)));
    }
    const inAppOk = await tryOpenInAppBrowser(url, logCtx);
    if (!inAppOk) {
      Alert.alert(LEGAL_DOCUMENT_OPEN_FAILURE_MESSAGE);
    }
    return;
  }

  // Native: external browser first
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
    logErrorSafe(`${logCtx} canOpenURL false`, new Error(url));
  } catch (e) {
    logErrorSafe(`${logCtx} Linking`, e instanceof Error ? e : new Error(String(e)));
  }

  const inAppOk = await tryOpenInAppBrowser(url, logCtx);
  if (!inAppOk) {
    Alert.alert(LEGAL_DOCUMENT_OPEN_FAILURE_MESSAGE);
  }
}
