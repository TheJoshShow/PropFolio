import Constants from 'expo-constants';

/**
 * Optional values from `app.config.ts` → `expo.extra` (e.g. EAS-injected public config).
 */
type ExpoExtra = Record<string, string | undefined>;

function readExtra(): ExpoExtra {
  return (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
}

const extra = readExtra();

/**
 * Client-exposed configuration only. Never put service-role keys or provider secrets here.
 * Local dev: copy `.env.example` to `.env` and restart Metro.
 */
export const env = {
  appName: 'PropFolio',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '',
  revenueCatApiKeyIos:
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? extra.revenueCatApiKeyIos ?? '',
  revenueCatApiKeyAndroid:
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? extra.revenueCatApiKeyAndroid ?? '',
  /** RevenueCat Offering identifier for the monthly Pro subscription (must match dashboard). */
  rcSubscriptionOfferingId:
    process.env.EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID ??
    extra.rcSubscriptionOfferingId ??
    'propfolio_subscription',
  /** RevenueCat Offering identifier that contains consumable credit-pack products. */
  rcCreditsOfferingId:
    process.env.EXPO_PUBLIC_RC_CREDITS_OFFERING_ID ?? extra.rcCreditsOfferingId ?? 'propfolio_credits',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? extra.googleMapsApiKey ?? '',
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
