# Migration validation report — Sentry → Firebase Crashlytics (PropFolio)

**Date:** 2025-03-19  
**Scope:** `expo-app/` (Expo SDK 55, React Native Firebase Crashlytics)  
**Validator:** Automated checks + static review of monitoring code paths (no full native iOS compile on this host).

---

## 1. What was validated

| Area | Method |
|------|--------|
| Sentry removal (deps, source, config) | `npm ls`, `grep` on `expo-app` source/app, `package-lock.json`, `eas.json` |
| Type safety | `npm run typecheck` (`tsc --noEmit`) |
| Unit tests | `npm test` (Jest, 116 tests) |
| Monitoring safety | Read-through: `initMonitoring`, `crashlytics.ts`, `globalHandlers.ts`, `capturedError.ts`, `sessionContext.ts`, `index.ts` |
| Crashlytics structure | `app.config.ts` / `expo config`, plugins, `ios.googleServicesFile` |
| Duplicate init | `initCrashlytics` uses `initCalled`; `installGlobalErrorHandlers` uses `installed` |
| Lint (monitoring) | `eslint src/services/monitoring/**/*.ts` (clean) |
| Docs consistency | `IOS_LAUNCH_AUDIT.md`, `release_blocker_report.md`, `diagnostics.ts` comment |

**Not validated on this machine (environment limits):**

- **Xcode / `xcodebuild` / EAS iOS cloud build** — workspace is Windows; cannot run a full native iOS compile here.
- **Simulator / device cold start** — requires macOS + Xcode or a physical device.
- **Firebase Console** — project pairing, dSYM/symbol upload, and Crashlytics dashboard end-to-end.

---

## 2. What passed

- **`tsc --noEmit`:** Exit 0.
- **Jest:** 17 suites, 116 tests, all passed.
- **Sentry package:** `npm ls @sentry/react-native` → no dependency tree (empty).
- **`package-lock.json`:** No `sentry` string (no transitive Sentry packages).
- **Runtime source:** No `sentry` / `Sentry` / `@sentry` in `expo-app/**/*.ts`, `*.tsx`, `*.js` under `app/` and typical source paths (see §5).
- **`eas.json`:** No Sentry env keys.
- **Single `initMonitoring()` call** at module scope in `app/_layout.tsx` (one startup path).
- **`initMonitoring`:** Wrapped in try/catch; inner `initCrashlytics` is idempotent; global handler install is idempotent.
- **Public monitoring APIs:** `recordError`, `recordNonFatal`, `recordMessage`, `setMonitoringAttributes`, `setUserContext`, `clearUserContext` all use try/catch in `monitoring/index.ts`.
- **Adapter:** `crashlytics.ts` functions wrap native calls in try/catch; lazy `require()` for native module documented with eslint suppression.
- **Captured errors:** `reportCapturedError` try/catch + dedupe.
- **Privacy (review):** Session uses opaque user id; routes sanitized (`MonitoringAttributesSync` + `sanitizeRouteForMonitoring`); attributes capped/sanitized in `attributeSanitizer.ts`.
- **Expo config resolution:** `expo config` shows plugins including `@react-native-firebase/app`, `@react-native-firebase/crashlytics`, and `ios.googleServicesFile: ./GoogleService-Info.plist`.
- **Monitoring-only ESLint:** `src/services/monitoring/**/*.ts` passes with `--max-warnings 0`.

---

## 3. What was fixed during validation

| Item | Change |
|------|--------|
| Stale documentation | `expo-app/docs/IOS_LAUNCH_AUDIT.md` — monitoring row + `app.config.ts` reference (was `app.json` + “stubs until Crashlytics”). |
| Stale documentation | `expo-app/release_blocker_report.md` — crash section updated for Firebase Crashlytics + link to `MONITORING_SETUP.md`. |
| Stale comment | `expo-app/src/services/diagnostics.ts` — `logErrorSafe` comment now reflects Crashlytics forwarding (not “until wired”). |
| ESLint on intentional `require()` | `expo-app/src/services/monitoring/crashlytics.ts` — `eslint-disable-next-line` with rationale for dynamic native import. |

---

## 4. Remaining manual actions for you

1. **Local `.env`:** If `EXPO_PUBLIC_SENTRY_DSN` still appears when running Expo (e.g. `env: export … EXPO_PUBLIC_SENTRY_DSN`), **remove it** from your local `.env` — it is obsolete and was already removed from `runtimeConfig` / `.env.example`.
2. **EAS / Expo dashboard:** Delete **`EXPO_PUBLIC_SENTRY_DSN`** (and any other Sentry-related variables) from project secrets if they were ever set.
3. **Sentry.io:** Archive or delete the old Sentry project if unused.
4. **Firebase:** Ensure production **`GoogleService-Info.plist`** matches bundle id `com.propfolio.mobile` and is available locally and/or via **`GOOGLE_SERVICES_INFO_PLIST`** on EAS (see `FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`).
5. **Privacy Policy:** Counsel review that Google/Firebase crash processing is disclosed as needed.

---

## 5. Search results summary — Sentry removal (proof)

Commands run from the repo (representative):

```text
# No Sentry in application TypeScript / JavaScript
# Pattern: sentry | Sentry | @sentry
# Paths: expo-app app/, src/**/*.ts, *.tsx — 0 matches

# package-lock.json (expo-app)
# Pattern: sentry (case-insensitive) — 0 matches

# npm dependency tree
npm ls @sentry/react-native
# → (empty tree at expo-app root)
```

**Documentation:** The file `MIGRATION_SENTRY_TO_CRASHLYTICS_AUDIT.md` **intentionally** retains the word “Sentry” as a **historical** migration record. Current operational docs are **`expo-app/docs/MONITORING_SETUP.md`**.

---

## 6. Recommended next steps — simulator / TestFlight

1. **Clean iOS build:** On macOS: `cd expo-app && npm install && npx expo run:ios` (or EAS `eas build --platform ios`) with a valid `GoogleService-Info.plist`.
2. **Cold launch:** Log in, open tabs (Import, Portfolio, Settings), trigger paywall path — confirm no regression vs. prior build.
3. **Crashlytics:** Use **Settings → Stability checks** (dev or `EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS`) per `MONITORING_VERIFICATION.md`; confirm events in Firebase Console within minutes.
4. **Release build:** Confirm Crashlytics collection is **on** (`!__DEV__`) and a non-fatal or test crash appears in the dashboard.

---

## 7. Residual risks and caveats

| Risk | Notes |
|------|--------|
| **iOS build not run in this validation** | Native compile and App Store pipeline were **not** executed on Windows; regressions could still exist in native linking or EAS-only issues. |
| **`npm run lint` (Expo CLI) on Windows paths with `&`** | May fail to spawn ESLint (`Cannot find module ... eslint.js`) when the project path contains `&`. This is an **environment/shell** issue, not evidence of migration failure. Direct `node node_modules/eslint/bin/eslint.js` works. |
| **Project-wide ESLint** | Full-tree ESLint reports **pre-existing** errors/warnings outside monitoring (e.g. hooks in tabs layout, quarantine file). **Not introduced by Crashlytics migration.** Monitoring subtree was cleaned to `--max-warnings 0`. |
| **`logErrorSafe` → `recordNonFatal`** | Forwards `Error` objects to Crashlytics; stacks could theoretically include embedded URLs or rare library text — keep call sites high-level; avoid attaching raw API response bodies to `Error.message`. |
| **Web / Android** | `getCrashlytics()` returns `null` off iOS; monitoring no-ops safely — no crash reporting on those platforms in current wiring. |
| **Unhandled promise rejections** | `globalHandlers` attaches `unhandledrejection` where `addEventListener` exists; Hermes behavior may differ — see `GLOBAL_ERROR_CAPTURE.md`. |

---

## 8. Conclusion

The migration is **structurally sound** in-repo: **no Sentry runtime or package**, **Crashlytics integrated behind the monitoring facade**, **startup paths guarded**, **tests and typecheck green**, **monitoring ESLint clean**. **Success of production iOS builds and Firebase dashboards** remains **your verification** on macOS/EAS and in the Firebase Console.
