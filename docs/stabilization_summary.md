# PropFolio – Stabilization Summary (iOS-Only Cleanup)

**Date:** March 2025

---

## 1. Cleanup completed

- **Deletions:** expo-app/expo-app (nested duplicate), _archive_review (archived web), expo-app/app/+html.tsx, Android and web assets (android-icon-*.png, favicon.png).
- **Config:** app.json Android and web blocks removed; package.json android and web scripts removed.
- **Code refactors:** Platform.OS and copy updated for iOS-only in _layout, (tabs)/_layout, settings, paywall, AuthContext, supabase, billing, PaywallContent, paywallCopy, subscriptionManagement, revenueCat, theme. Unused Platform imports removed where applicable.

---

## 2. Run the app

- **Command:** From `expo-app/`, run `npm run ios` or `npx expo start --ios`.
- **Blocker:** In this environment, `npm install` failed (path/postinstall), so `node_modules` may be missing or incomplete (e.g. react-native-purchases). If the app fails to start or typecheck fails, run `npm install` from a path without spaces/special characters (e.g. `C:\propfolio`) then run the app again.

---

## 3. Compile / runtime errors

| Check | Result |
|-------|--------|
| **TypeScript (npm run typecheck)** | **Fails.** Cannot find module 'react-native-purchases'. Cause: those packages are missing from node_modules (likely due to failed/corrupted npm install in this path). |
| **Tests (npm run test)** | **Pass.** 2 test suites, 8 tests (dealScoringEngine, underwritingEngine). Tests do not depend on crash reporting or react-native-purchases. |
| **Lint** | Not run (typecheck failed first). |
| **App run** | Not run (node_modules incomplete). |

**Resolution:** Run `npm install` from a directory with a short path and no spaces or `&`. After a successful install, re-run typecheck and then start the app with `npm run ios`.

---

## 4. Fixes applied

- No broken imports or path aliases were introduced; all removed files were unreferenced.
- crash reporting and RevenueCat code paths are unchanged; only Platform conditions and billing key handling were simplified for iOS.

---

## 5. Summary

| Item | Status |
|------|--------|
| File/config/code cleanup | Done. |
| Dependency removal (react-native-web) | Reverted in package.json due to failed install; remove when install succeeds from clean path. |
| Typecheck | Fails until node_modules is restored (npm install from short path). |
| Tests | Pass. |
| App run | Blocked by incomplete node_modules; run `npm install` then `npm run ios`. |

**Next steps for you:**

1. Run `npm install` from a path without spaces (e.g. clone or copy repo to `C:\propfolio` and run there).
2. If `expo-app/expo-app` still exists, remove it manually (Windows long-path can block automated delete); it is an orphan duplicate.
3. Run `npm run typecheck` and `npm run test`; fix any remaining issues.
4. Run `npm run ios` and verify auth, import, paywall, restore, and Settings.
5. Optionally remove `react-native-web` from package.json and run `npm install` again to complete iOS-only dependency cleanup.
