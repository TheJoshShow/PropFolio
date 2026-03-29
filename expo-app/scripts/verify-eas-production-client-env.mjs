/**
 * Fail EAS **production** iOS builds when required `EXPO_PUBLIC_*` vars resolve empty.
 * Dashboard secrets that are unset become empty strings in `eas.json` substitutions — the app
 * still bundles but Supabase/RevenueCat stay dead. This hook runs after `npm install` on the worker.
 *
 * Env: `EAS_BUILD=true`, `EAS_BUILD_PROFILE=production` (set by EAS).
 *
 * Optional native build secret (not bundled into JS): `IOS_GOOGLE_MAPS_API_KEY` — warn only;
 * missing key yields blank map tiles on device. See docs/ENV_SETUP.md.
 */
const REQUIRED_EXPO_PUBLIC = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
];

function main() {
  if (process.env.EAS_BUILD !== 'true') {
    return;
  }
  const profile = (process.env.EAS_BUILD_PROFILE ?? '').trim();
  if (profile !== 'production' && profile !== 'preview' && profile !== 'development') {
    return;
  }

  const missing = [];
  for (const key of REQUIRED_EXPO_PUBLIC) {
    if (!(process.env[key] ?? '').trim()) {
      missing.push(key);
    }
  }

  if (missing.length > 0 && profile === 'production') {
    console.error(
      '[verify-eas-production-client-env] Production build aborted: these env vars are empty on the EAS worker:',
      missing.join(', '),
    );
    console.error(
      'Set them in Expo → Project → Environment variables (production) or link the correct EAS environment.',
    );
    process.exit(1);
  }

  if (missing.length > 0) {
    console.warn(
      `[verify-eas-production-client-env] ${profile} build has missing EXPO_PUBLIC_* keys: ${missing.join(', ')}. Build will continue, but auth/subscriptions may be disabled.`
    );
  } else {
    console.log(
      `[verify-eas-production-client-env] Required EXPO_PUBLIC_* keys for ${profile} are non-empty.`
    );
  }

  if (!(process.env.IOS_GOOGLE_MAPS_API_KEY ?? '').trim()) {
    console.warn(
      '[verify-eas-production-client-env] IOS_GOOGLE_MAPS_API_KEY is empty — iOS Google Maps tiles may be blank. Add an EAS secret and map it in eas.json (see docs/ENV_SETUP.md).',
    );
  }
}

main();
