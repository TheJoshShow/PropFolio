import type { ExpoConfig } from 'expo/config';

/**
 * Include expo-dev-client native plugin only when building a **development** EAS profile,
 * or for local workflows (no EAS_BUILD). Store / preview cloud builds omit it so production
 * IPAs do not embed dev-client infrastructure.
 */
function includeExpoDevClientPlugin(): boolean {
  if (process.env.EAS_BUILD === 'true') {
    return process.env.EAS_BUILD_PROFILE === 'development';
  }
  return true;
}

/**
 * Expo managed (CNG): **`ios/` is not committed** — EAS Build and `expo prebuild` / `expo run:ios`
 * generate it from this config + plugins.
 *
 * **Firebase (iOS):**
 * - `ios.googleServicesFile` → local `./GoogleService-Info.plist` OR EAS file env
 *   `GOOGLE_SERVICES_INFO_PLIST` (path at build time). See `docs/EXPO_EAS_FIREBASE_IOS.md`.
 * - **Plugins** `@react-native-firebase/app` then `@react-native-firebase/crashlytics` are required;
 *   order must not be swapped (Core before Crashlytics). They modify the prebuild output (Pods,
 *   plist copy, Crashlytics run script) — no hand-edited `ios/` in git.
 * - **`expo-build-properties`** with `ios.useFrameworks: 'static'` is required by Firebase iOS SDK
 *   (`use_frameworks`); see https://rnfirebase.io/ Expo section. With static frameworks, RN Firebase pods
 *   need `ios.forceStaticLinking` for their pod names (e.g. RNFBApp, RNFBCrashlytics) to avoid
 *   non-modular React-Core header errors; see https://github.com/invertase/react-native-firebase/issues/8657
 *   and Expo discussion. Keep **expo-build-properties** **last** in the array.
 * - Compatible with `expo-dev-client`, `expo-router`, `react-native-maps`.
 *
 * **Google Maps (iOS native SDK):** `react-native-maps` needs `IOS_GOOGLE_MAPS_API_KEY` at **prebuild**
 * (EAS secret → `eas.json` env → `iosGoogleMapsApiKey` below). This is not an `EXPO_PUBLIC_*` key and is
 * not listed in `CLIENT_EXPO_PUBLIC_ENV_KEYS`. Without it, Google-backed maps often show empty tiles.
 */
export default (): ExpoConfig => ({
  name: 'PropFolio',
  slug: 'propfolio',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'propfolio',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    bundleIdentifier: 'com.propfolio.mobile',
    googleServicesFile:
      process.env.GOOGLE_SERVICES_INFO_PLIST ?? './GoogleService-Info.plist',
    // Omit buildNumber: eas.json uses appVersionSource "remote" — local buildNumber is ignored
    // and duplicates confuse diagnostics (expo-constants vs App Store Connect).
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  plugins: [
    ...(includeExpoDevClientPlugin() ? (['expo-dev-client'] as const) : []),
    'expo-router',
    'expo-web-browser',
    [
      'react-native-maps',
      {
        iosGoogleMapsApiKey: process.env.IOS_GOOGLE_MAPS_API_KEY ?? '',
      },
    ],
    // Firebase: app plugin must run before crashlytics (native dependency order).
    '@react-native-firebase/app',
    '@react-native-firebase/crashlytics',
    // Required for firebase-ios-sdk (RN Firebase docs); must be last.
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          // Pod names from each @react-native-firebase package’s .podspec (required with static frameworks).
          forceStaticLinking: ['RNFBApp', 'RNFBCrashlytics'],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    billingRequiresPrebuild: true,
    eas: {
      projectId: 'b06b51f1-d0e7-4772-a662-6ad949feb44c',
    },
  },
});
