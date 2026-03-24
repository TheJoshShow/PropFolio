/**
 * Syncs Crashlytics custom attributes from runtime state (debounced to limit churn).
 * Must render inside AuthProvider + SubscriptionProvider.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';

import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { MonitoringAttr } from '../services/monitoring/attributeKeys';
import { sanitizeRouteForMonitoring } from '../services/monitoring/attributeSanitizer';
import { setCrashlyticsAttributes } from '../services/monitoring/crashlytics';
import {
  applyMonitoringSessionSignedIn,
  applyMonitoringSessionSignedOut,
} from '../services/monitoring/sessionContext';

const DEBOUNCE_MS = 450;
const ROUTE_DEBOUNCE_MS = 350;

export function MonitoringAttributesSync() {
  const { session, isLoading } = useAuth();
  const { hasProAccess } = useSubscription();
  const pathname = usePathname() ?? '';
  const lastAuthKey = useRef<string | null>(null);

  // Auth: only when loading settles (avoid signed_out flash during bootstrap).
  useEffect(() => {
    if (isLoading) return;
    const key = session?.id ?? 'out';
    if (lastAuthKey.current === key) return;
    lastAuthKey.current = key;
    if (session?.id) {
      applyMonitoringSessionSignedIn(session.id);
    } else {
      applyMonitoringSessionSignedOut();
    }
  }, [session?.id, isLoading]);

  // Subscription tier (signed-in only).
  useEffect(() => {
    if (isLoading || !session?.id) return;
    const t = setTimeout(() => {
      setCrashlyticsAttributes({
        [MonitoringAttr.subscriptionTier]: hasProAccess ? 'pro' : 'free',
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [session?.id, isLoading, hasProAccess]);

  // Route (UUIDs masked; no query strings from pathname in Expo Router file routes).
  useEffect(() => {
    const t = setTimeout(() => {
      const safe = sanitizeRouteForMonitoring(pathname);
      setCrashlyticsAttributes({
        [MonitoringAttr.routePath]: safe.length > 0 ? safe : 'unknown',
      });
    }, ROUTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
