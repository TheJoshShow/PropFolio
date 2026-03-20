/**
 * Subscription management: open RevenueCat or App Store URL (iOS-only production app).
 * Fallback copy for non-iOS is for type safety only; production build is iOS.
 */

import { Platform, Linking } from 'react-native';
import { getManagementUrl } from '../services/revenueCat';

const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

/** Fallback copy when the management URL cannot be opened (iOS). */
export const MANAGE_SUBSCRIPTION_FALLBACK_IOS =
  'To manage or cancel your subscription, open the Settings app, tap your name at the top, then tap Subscriptions.';

/** Fallback copy when the management URL cannot be opened (Android). */
export const MANAGE_SUBSCRIPTION_FALLBACK_ANDROID =
  'To manage or cancel your subscription, open the Google Play Store app, tap your profile, then Payments & subscriptions → Subscriptions.';

/** Fallback copy when not iOS (app is iOS-only). */
export const MANAGE_SUBSCRIPTION_FALLBACK_WEB =
  'Subscription management is available in the PropFolio app.';

/**
 * Returns helpful fallback text when direct linking to subscription management fails.
 * iOS-only: returns iOS fallback.
 */
export function getManageSubscriptionFallbackMessage(): string {
  if (Platform.OS === 'ios') return MANAGE_SUBSCRIPTION_FALLBACK_IOS;
  if (Platform.OS === 'android') return MANAGE_SUBSCRIPTION_FALLBACK_ANDROID;
  return MANAGE_SUBSCRIPTION_FALLBACK_WEB;
}

/**
 * Open the best available subscription management experience (iOS-only).
 * RevenueCat managementURL when available; otherwise App Store subscriptions URL.
 */
export async function openSubscriptionManagement(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  try {
    const managementUrl = await getManagementUrl();
    if (managementUrl) {
      const canOpen = await Linking.canOpenURL(managementUrl);
      if (canOpen) {
        await Linking.openURL(managementUrl);
        return true;
      }
    }
  } catch (e) {
    if (__DEV__) console.warn('[SubscriptionManagement] getManagementUrl or openURL failed:', e);
  }

  try {
    const canOpen = await Linking.canOpenURL(APPLE_SUBSCRIPTIONS_URL);
    if (canOpen) {
      await Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
      return true;
    }
  } catch (e) {
    if (__DEV__) console.warn('[SubscriptionManagement] iOS openURL failed:', e);
  }

  return false;
}
