/**
 * Persists last-known subscription state so we can show it on offline launch or when
 * refresh fails. Avoids revoking Pro based on uncertain client-only state (e.g. network error).
 *
 * Edge-case behavior:
 * - Offline app launch: show last-known state from cache until next successful fetch.
 * - Delayed / failed refresh: keep showing cached state; do not overwrite with null.
 * - Cache is keyed by userId so switching accounts doesn't show wrong entitlement.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@propfolio/subscription_cache';

export interface CachedSubscriptionSnapshot {
  hasProAccess: boolean;
  expirationDate: string | null;
  planName: string;
}

function cacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}_${userId}`;
}

/**
 * Load last-known subscription snapshot for the user. Returns null if none or parse error.
 */
export async function getCachedSubscription(
  userId: string
): Promise<CachedSubscriptionSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as CachedSubscriptionSnapshot).hasProAccess === 'boolean'
    ) {
      const p = parsed as CachedSubscriptionSnapshot;
      return {
        hasProAccess: p.hasProAccess,
        expirationDate: typeof p.expirationDate === 'string' ? p.expirationDate : null,
        planName: typeof p.planName === 'string' ? p.planName : 'Free',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist snapshot after a successful fetch or purchase so offline/error states can use it.
 */
export async function setCachedSubscription(
  userId: string,
  snapshot: CachedSubscriptionSnapshot
): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(snapshot));
  } catch (e) {
    if (__DEV__) console.warn('[SubscriptionCache] setItem failed:', e);
  }
}

/**
 * Clear cache for user (e.g. on sign-out so next login doesn't briefly show wrong state).
 * Optional: we could leave cache and rely on userId key; clearing is safer for shared devices.
 */
export async function clearCachedSubscription(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(cacheKey(userId));
  } catch {
    // ignore
  }
}
