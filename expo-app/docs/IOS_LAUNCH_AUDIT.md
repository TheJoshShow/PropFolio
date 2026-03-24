# iOS launch / TestFlight crash audit (PropFolio)

## Configuration surface

| Area | Location | Notes |
|------|-----------|--------|
| Expo config | `app.config.ts` | `scheme: propfolio`, splash, iOS bundle id, Firebase plugins |
| EAS | `eas.json` | Production env var substitution; `ASC_API_KEY_PATH` for submit |
| Entry | `package.json` → `expo-router/entry` | `app/_layout.tsx` imports `react-native-gesture-handler` first, before other app code (RNGH + Expo Router pattern) |
| Deep links / auth | `src/utils/authRedirect.ts` | `propfolio://auth/callback`; must match Supabase redirect allowlist |
| RevenueCat | `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`, `src/config/billing.ts` | Missing key → graceful degradation (no native crash) |
| Maps | `react-native-maps`, `PortfolioPropertyMap` | Default **Apple Maps** on iOS (no Google Maps API key in app); `showsUserLocation={false}` → no Core Location permission string required |
| Reanimated | `import 'react-native-reanimated'` in `app/_layout.tsx` | Babel plugin comes from `babel-preset-expo` default |
| Monitoring | `src/services/monitoring` + `initMonitoring()` in `_layout.tsx` | Firebase Crashlytics on iOS via adapter; see `docs/MONITORING_SETUP.md` |

## EAS / prebuild assumptions

- **Production builds** use hosted Supabase + env from EAS, not a developer machine.
- **`appVersionSource: remote`** (EAS): local `ios.buildNumber` in `app.json` is not the source of truth for store builds.

## Manual verification (iPhone / TestFlight)

1. Cold launch logged out → reaches auth or home without crash.
2. Open **Import** → map card on Home (if properties exist) → no crash when MapView mounts.
3. Complete magic-link / password reset → `propfolio://auth/callback` opens app (Supabase redirect URLs must include this scheme).
