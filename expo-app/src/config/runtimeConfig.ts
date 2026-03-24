import { Platform } from 'react-native';

/**
 * All `EXPO_PUBLIC_*` keys read by `getRuntimeConfig()` (for onboarding, EAS setup, audits).
 * Server-only secrets belong in Supabase Edge secrets — never here.
 */
export const CLIENT_EXPO_PUBLIC_ENV_KEYS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID',
  'EXPO_PUBLIC_PRIVACY_POLICY_URL',
  'EXPO_PUBLIC_TERMS_URL',
  'EXPO_PUBLIC_SUPPORT_URL',
  'EXPO_PUBLIC_BILLING_HELP_URL',
  'EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS',
] as const;

export interface RuntimeConfig {
  appEnv: 'development' | 'production';
  platform: 'ios' | 'android' | 'web';
  supabaseUrl: string;
  supabaseAnonKey: string;
  revenueCatApiKeyIos: string;
  revenueCatApiKeyAndroid: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  supportUrl: string;
  billingHelpUrl: string;
  qaDiagnosticsEnabled: boolean;
  appScheme: 'propfolio';
}

export interface RuntimeConfigDiagnostics {
  environment: RuntimeConfig['appEnv'];
  platform: RuntimeConfig['platform'];
  servicesConfigured: {
    supabase: boolean;
    subscriptions: boolean;
    legalUrls: boolean;
  };
  apiBaseUrlsPresent: {
    supabaseUrl: boolean;
  };
  authRedirectConfigValid: boolean;
  subscriptionConfigValid: boolean;
  qaDiagnosticsEnabled: boolean;
  networkSafety: {
    supabaseHost: string;
    supabaseUsesLocalhost: boolean;
    supabaseUsesLanIp: boolean;
  };
}

function str(v: string | undefined): string {
  return (v ?? '').trim();
}

function bool(v: string | undefined): boolean {
  const t = (v ?? '').trim().toLowerCase();
  return t === '1' || t === 'true' || t === 'yes';
}

function getHostname(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isLanOrLoopbackHost(hostname: string): boolean {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
  const ipv4Parts = hostname.split('.').map((p) => Number(p));
  if (ipv4Parts.length === 4 && ipv4Parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = ipv4Parts;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

export function getRuntimeConfig(): RuntimeConfig {
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
  return {
    appEnv: __DEV__ ? 'development' : 'production',
    platform,
    supabaseUrl: str(process.env.EXPO_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: str(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    revenueCatApiKeyIos: str(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS),
    revenueCatApiKeyAndroid: str(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID),
    privacyPolicyUrl: str(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL),
    termsUrl: str(process.env.EXPO_PUBLIC_TERMS_URL),
    supportUrl: str(process.env.EXPO_PUBLIC_SUPPORT_URL),
    billingHelpUrl: str(process.env.EXPO_PUBLIC_BILLING_HELP_URL),
    qaDiagnosticsEnabled: bool(process.env.EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS),
    appScheme: 'propfolio',
  };
}

export function validateRuntimeConfigForDev(): { ok: boolean; missing: string[] } {
  const c = getRuntimeConfig();
  const missing: string[] = [];
  if (!c.supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!c.supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (c.platform === 'ios' && !c.revenueCatApiKeyIos) missing.push('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS');
  if (c.platform === 'android' && !c.revenueCatApiKeyAndroid) {
    missing.push('EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID');
  }
  return { ok: missing.length === 0, missing };
}

export function getRuntimeConfigDiagnostics(): RuntimeConfigDiagnostics {
  const c = getRuntimeConfig();
  const supabaseHost = getHostname(c.supabaseUrl);
  const supabaseUsesLanOrLoopback = isLanOrLoopbackHost(supabaseHost);
  const supabaseConfigured = Boolean(c.supabaseUrl && c.supabaseAnonKey);
  const subscriptionsConfigured =
    c.platform === 'ios'
      ? Boolean(c.revenueCatApiKeyIos)
      : c.platform === 'android'
        ? Boolean(c.revenueCatApiKeyAndroid)
        : false;
  const legalUrlsConfigured = Boolean(c.privacyPolicyUrl || c.termsUrl || c.supportUrl);
  const authRedirectConfigValid = c.appScheme === 'propfolio';
  return {
    environment: c.appEnv,
    platform: c.platform,
    servicesConfigured: {
      supabase: supabaseConfigured,
      subscriptions: subscriptionsConfigured,
      legalUrls: legalUrlsConfigured,
    },
    apiBaseUrlsPresent: {
      supabaseUrl: Boolean(c.supabaseUrl),
    },
    authRedirectConfigValid,
    subscriptionConfigValid: subscriptionsConfigured,
    qaDiagnosticsEnabled: c.qaDiagnosticsEnabled,
    networkSafety: {
      supabaseHost,
      supabaseUsesLocalhost: supabaseHost === 'localhost' || supabaseHost === '127.0.0.1' || supabaseHost === '::1',
      supabaseUsesLanIp: supabaseUsesLanOrLoopback && supabaseHost !== 'localhost' && supabaseHost !== '127.0.0.1' && supabaseHost !== '::1',
    },
  };
}
