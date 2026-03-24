# PropFolio – Dependency Cleanup Report (iOS-Only)

**Date:** March 2025

---

## 1. Removed packages

| Package | Version (before) | Reason |
|---------|------------------|--------|
| *(none removed from tree)* | — | **react-native-web** was removed from `package.json` then **restored** because `npm install` failed in this environment (path with spaces/special chars breaks postinstall). It remains in dependencies so the existing lockfile and node_modules stay consistent. |

**Recommendation:** When running from a path without spaces (e.g. `C:\propfolio` or CI), remove `react-native-web` from `package.json` and run `npm install` to drop it from the dependency tree for iOS-only builds.

---

## 2. Retained packages

All current dependencies in `expo-app/package.json` are retained:

| Category | Packages |
|----------|----------|
| **Auth / backend** | @supabase/supabase-js |
| **Subscriptions** | react-native-purchases |
| **Crash / analytics** | `src/services/monitoring` (dev stubs until Crashlytics) |
| **Navigation** | @react-navigation/native, expo-router |
| **Expo** | expo, expo-constants, expo-font, expo-linking, expo-splash-screen, expo-status-bar, expo-symbols, expo-web-browser |
| **React** | react, react-dom, react-native |
| **UI / native** | react-native-worklets, react-native-reanimated, react-native-safe-area-context, react-native-screens |
| **Web (retained for now)** | react-native-web |

All are used for release, legal, privacy, auth, billing, analytics, crash reporting, build, or backend integration. None were removed in this pass.

---

## 3. Packages that should be upgraded later

| Package | Current | Note |
|---------|---------|------|
| **react-native-web** | ~0.21.0 | Remove entirely for iOS-only once install succeeds from a clean path; no upgrade needed if removed. |
| **Expo / React Native stack** | Expo ~55, RN 0.83 | Follow Expo SDK upgrade path when targeting new iOS versions. |
| *(none — prior crash SDK removed)* | — | Add Firebase Crashlytics when ready. |
| **react-native-purchases** | ^9.12.0 | Keep in sync with RevenueCat SDK and Expo compatibility. |

No breaking upgrades were performed in this cleanup.

---

## 4. Reinstall / lock state

- **npm install:** Failed with exit code 1 in this environment. Cause: postinstall script for `unrs-resolver` (napi-postinstall) fails when the project path contains spaces or `&` (e.g. `OneDrive - Example & Holdings LLC`). Error: `'Holdings' is not recognized as an internal or external command`.
- **package-lock.json:** Unchanged by this cleanup (no successful full install).
- **Recommendation:** Run `npm install` (or `npm ci`) from a short path without spaces/special characters to refresh node_modules and lockfile. After that, optionally remove `react-native-web` and run install again to complete dependency cleanup for iOS-only.
