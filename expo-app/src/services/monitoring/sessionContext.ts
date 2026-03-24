/**
 * Auth session ↔ Crashlytics user id + safe auth_state attribute.
 * Does not send email, tokens, or display names.
 */

import { MonitoringAttr } from './attributeKeys';
import { clearUserContext, setCrashlyticsAttributes, setUserContext } from './crashlytics';

export function applyMonitoringSessionSignedIn(userId: string): void {
  const id = typeof userId === 'string' ? userId.trim() : '';
  if (!id) {
    applyMonitoringSessionSignedOut();
    return;
  }
  setUserContext({ id });
  setCrashlyticsAttributes({
    [MonitoringAttr.authState]: 'signed_in',
  });
  if (__DEV__) {
    console.log('[PropFolio][Monitoring] user context set (signed in, opaque id only)');
  }
}

export function applyMonitoringSessionSignedOut(): void {
  clearUserContext();
  setCrashlyticsAttributes({
    [MonitoringAttr.authState]: 'signed_out',
    [MonitoringAttr.subscriptionTier]: 'unknown',
    [MonitoringAttr.portfolioCount]: '0',
  });
  if (__DEV__) {
    console.log('[PropFolio][Monitoring] user context cleared (signed out)');
  }
}

/** Portfolio list length only (no addresses or IDs). Debounced by caller. */
export function setMonitoringPortfolioPropertyCount(count: number): void {
  if (!Number.isFinite(count) || count < 0) return;
  setCrashlyticsAttributes({
    [MonitoringAttr.portfolioCount]: String(Math.min(9999, Math.floor(count))),
  });
}
