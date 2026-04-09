import Constants from 'expo-constants';

import { RC_DEFAULT_CREDITS_OFFERING_ID, RC_DEFAULT_SUBSCRIPTION_OFFERING_ID } from '@/services/revenuecat/productIds';

/**
 * Optional values from `app.config.ts` → `expo.extra` (e.g. EAS-injected public config).
 */
type ExpoExtra = Record<string, string | undefined>;

function readExtra(): ExpoExtra {
  return (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
}

const extra = readExtra();

/** Project ref from `https://<ref>.supabase.co` (hosted projects only). */
function projectRefFromSupabaseUrl(urlStr: string): string | null {
  try {
    const { hostname } = new URL(urlStr.trim());
    const m = /^([a-z0-9]+)\.supabase\.co$/i.exec(hostname);
    return m ? m[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/** `ref` claim in the Supabase anon JWT — identifies the project the key belongs to. */
function projectRefFromAnonJwt(anonJwt: string): string | null {
  const parts = anonJwt.trim().split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(padded)) as { ref?: string };
    return typeof json.ref === 'string' ? json.ref.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * In development, warn if URL and anon key are from different Supabase projects.
 * Edge Functions must be deployed to the same project as these two values.
 */
function warnIfSupabaseUrlAndAnonKeyMismatch(url: string, anonKey: string): void {
  if (!__DEV__) {
    return;
  }
  const fromUrl = projectRefFromSupabaseUrl(url);
  const fromJwt = projectRefFromAnonJwt(anonKey);
  if (!fromUrl || !fromJwt) {
    return;
  }
  if (fromUrl !== fromJwt) {
    console.warn(
      `[PropFolio] Supabase project mismatch: EXPO_PUBLIC_SUPABASE_URL is project "${fromUrl}" but ` +
        `EXPO_PUBLIC_SUPABASE_ANON_KEY is for "${fromJwt}". Use the URL and anon key from the same ` +
        `Dashboard → Settings → API, and deploy Edge functions with supabase link to that project.`,
    );
  }
}

/**
 * Client-exposed configuration only. Never put service-role keys or provider secrets here.
 *
 * **Supabase:** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` must both come from the
 * same project (Dashboard → Settings → API). That project must be the one where your Edge functions
 * are deployed (`npx supabase link` / `npx supabase functions deploy`).
 *
 * RevenueCat: use EXPO_PUBLIC_REVENUECAT_API_KEY_IOS = public Apple SDK key only (prefix appl_).
 * Local dev: copy `.env.example` to `.env` and restart Metro.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '';

warnIfSupabaseUrlAndAnonKeyMismatch(supabaseUrl, supabaseAnonKey);

export const env = {
  appName: 'PropFolio',
  supabaseUrl,
  supabaseAnonKey,
  /** iOS: RevenueCat *public* Apple SDK key only (appl_…). Never use a secret (sk_) key here. */
  revenueCatApiKeyIos:
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? extra.revenueCatApiKeyIos ?? '',
  revenueCatApiKeyAndroid:
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? extra.revenueCatApiKeyAndroid ?? '',
  /** RevenueCat Offering identifier for the monthly Pro subscription (must match dashboard). */
  rcSubscriptionOfferingId:
    process.env.EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID ??
    extra.rcSubscriptionOfferingId ??
    RC_DEFAULT_SUBSCRIPTION_OFFERING_ID,
  /** RevenueCat Offering identifier that contains consumable credit-pack products. */
  rcCreditsOfferingId:
    process.env.EXPO_PUBLIC_RC_CREDITS_OFFERING_ID ?? extra.rcCreditsOfferingId ?? RC_DEFAULT_CREDITS_OFFERING_ID,
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? extra.googleMapsApiKey ?? '',
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
