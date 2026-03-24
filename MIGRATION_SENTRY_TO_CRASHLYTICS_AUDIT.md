# Migration audit: Sentry → Firebase Crashlytics (iOS)

> **Current docs (post-migration):** Operational setup, architecture, and troubleshooting live in **`expo-app/docs/MONITORING_SETUP.md`**. Verification flows: **`expo-app/docs/MONITORING_VERIFICATION.md`**. Custom keys / session context: **`expo-app/docs/MONITORING_CONTEXT.md`**.  
> This file is a **historical audit** (grep may still mention “Sentry” for traceability).

## Removal completed (2025-03-19)

The following were **removed from the codebase**. Firebase Crashlytics was **added afterward** via `@react-native-firebase/app` + `@react-native-firebase/crashlytics` and `expo-app/src/services/monitoring/` (see MONITORING_SETUP.md).

| Area | Change |
|------|--------|
| **npm** | Uninstalled `@sentry/react-native` (lockfile updated). |
| **expo-app/app.json** | Removed `@sentry/react-native` from `plugins`. |
| **expo-app/eas.json** | Removed `SENTRY_DISABLE_AUTO_UPLOAD` from production `env`. |
| **expo-app/src/config/runtimeConfig.ts** | Removed `sentryDsn` / `EXPO_PUBLIC_SENTRY_DSN`. |
| **expo-app/app/_layout.tsx** | Removed `Sentry.init`, navigation integration, `Sentry.wrap`; added `initMonitoring()` from `src/services/monitoring`. |
| **expo-app/.env.example** | Removed Sentry DSN lines. |
| **expo-app/docs/** | `ENV_SETUP.md`, `IOS_LAUNCH_AUDIT.md` updated; `docs/sentry_privacy_decision.md` **deleted**. |
| **Repository docs** | Scrubbed or rewritten references; links to this file where migration context is needed. |
| **New module** | `expo-app/src/services/monitoring/index.ts` — `initMonitoring`, `recordError`, `recordMessage`, `setUserContext`, `clearUserContext`, `recordNonFatal` (dev-only console; production no-op until Crashlytics). |
| **diagnostics** | `logErrorSafe` calls `recordNonFatal` for a single future-friendly path. |

**Manual cleanup (outside repo):** Remove `EXPO_PUBLIC_SENTRY_DSN` and any Sentry-related secrets from **EAS Environment Variables** if they were set; archive or delete the **Sentry project** if no longer used.

---

**Original audit scope:** Full repository scan for Sentry usage, build pipeline hooks, and error-handling architecture. Sections below retain historical findings from before removal.

**Audit date:** 2025-03-19

---

## 1. Detected app architecture

| Item | Finding |
|------|---------|
| **Framework** | **Expo** (SDK ~55 per `expo-app/package.json`: `expo ~55.0.6`, `expo-router ~55.0.7`) |
| **Entry** | `package.json` → `"main": "expo-router/entry"` |
| **Native projects in repo** | **No** committed `ios/` or `android/` directories under `expo-app/` (workspace search: 0 matches). |
| **Workflow classification** | **Expo managed** source tree + **cloud prebuild** on EAS (typical pattern: `eas build` generates native projects on the build worker). This is often described as **managed Expo with prebuild** (not a checked-in bare React Native repo). |
| **Config** | Static **`expo-app/app.json`** (no `app.config.ts` / `app.config.js` in repo). |
| **Other packages** | Root repo contains `website/` (static legal pages; no Sentry/Firebase). No monorepo `package.json` at repo root for the app. |

**Conclusion:** The mobile app is **Expo-managed**, **router-based**, built with **EAS** without vendored native folders. Removing Sentry touches **dependencies**, **`app.json` plugins**, **`eas.json` env**, **`runtimeConfig`**, **`app/_layout.tsx`**, and **documentation**—not hand-edited Xcode projects in-repo.

---

## 2. Sentry packages and transitive references

### 2.1 Direct dependency (application)

| Package | Location | Version |
|---------|----------|---------|
| `@sentry/react-native` | `expo-app/package.json` `dependencies` | `~7.11.0` |

### 2.2 Transitive / tooling (via lockfile; not imported by app code)

The following appear under `expo-app/package-lock.json` as dependencies of `@sentry/react-native` (and its tooling), **not** as direct app dependencies:

- `@sentry/browser`, `@sentry/core`, `@sentry/react`, `@sentry/types`
- `@sentry/cli` (+ platform-specific `cli-*` packages)
- `@sentry/babel-plugin-component-annotate`
- `@sentry-internal/*` (replay, feedback, etc.)

**Bin script:** `sentry-expo-upload-sourcemaps` → `node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps.js` (this is **not** the deprecated `sentry-expo` package; it is a script **name** inside `@sentry/react-native`).

### 2.3 Packages explicitly searched — not used as direct dependencies

| Search term | Result |
|-------------|--------|
| `@sentry/browser` | Only via lockfile / `node_modules` |
| `@sentry/node` | **No** matches in app source or app `package.json` |
| `sentry-expo` (package) | **No** direct dependency; only script name string in lockfile |
| `withSentry` | **No** matches in `expo-app` source |

---

## 3. Runtime code: every Sentry use (files and roles)

### 3.1 Production TypeScript / TSX

| File | Lines (approx.) | Usage |
|------|-----------------|--------|
| `expo-app/app/_layout.tsx` | 17–22, 23–47, 73–77, 128 | Reads `sentryDsn` from runtime config; **dynamic `require('@sentry/react-native')`** on iOS when DSN present; **`Sentry.init(...)`** with navigation integration, **no** `mobileReplayIntegration` (replay rates 0); **`reactNavigationIntegration`** + `registerNavigationContainer`; **`Sentry.wrap(RootLayout)`** on default export; re-exports **`ErrorBoundary`** from `expo-router` (not Sentry’s boundary). |

**Not found in app source:** `captureException`, `captureMessage`, `withSentry`, or any other Sentry API outside `_layout.tsx`.

### 3.2 Configuration

| File | Lines | Usage |
|------|-------|--------|
| `expo-app/src/config/runtimeConfig.ts` | 14, 84 | `sentryDsn: str(process.env.EXPO_PUBLIC_SENTRY_DSN)` on `RuntimeConfig` |

### 3.3 Expo / EAS config

| File | Usage |
|------|--------|
| `expo-app/app.json` | `"plugins"` array includes **`"@sentry/react-native"`** (config plugin; resolves to package `app.plugin.js` → `./plugin/build`). |
| `expo-app/eas.json` | Production `build.production.env` sets **`SENTRY_DISABLE_AUTO_UPLOAD": "true"`** (disables automatic source map / symbol upload to Sentry during EAS builds). **`EXPO_PUBLIC_SENTRY_DSN` is not** listed in `eas.json` env interpolation (would be supplied via EAS project secrets/variables if used). |

### 3.4 Metro

| File | Usage |
|------|--------|
| `expo-app/metro.config.js` | Default `expo/metro-config` only; **no** Sentry Metro wrapper (`@sentry/react-native/metro` not used). |

### 3.5 Native iOS/Android in repo

- **No** `sentry.properties`, **no** committed `ios/` Podfile or AppDelegate edits in-repo (prebuild applies Sentry plugin on the build host).

### 3.6 CI / postbuild / hooks

- **No** `.github/workflows` or YAML in repo referencing Sentry (search: 0 files).
- **No** `eas-build-post-install` / custom EAS hooks for Sentry beyond env in `eas.json`.
- `expo-app/package.json` includes **`eas-build-pre-install`** (cleans `node_modules`); **not** Sentry-specific.

---

## 4. Environment variables (Sentry-related)

| Variable | Where referenced | Purpose |
|----------|------------------|---------|
| `EXPO_PUBLIC_SENTRY_DSN` | `expo-app/src/config/runtimeConfig.ts`; documented in `expo-app/.env.example`, `expo-app/docs/ENV_SETUP.md`, many `/docs` files | Public DSN; when empty, Sentry init is skipped in `_layout.tsx`. |
| `SENTRY_DISABLE_AUTO_UPLOAD` | `expo-app/eas.json` production profile | Disables Sentry’s automatic artifact upload during EAS build. |
| **Sentry auth / org / project** | Not in committed config | `@sentry/react-native` Expo plugin may warn if org/project unset; uploads already disabled via `SENTRY_DISABLE_AUTO_UPLOAD`. |

**Removal target (future migration):** `EXPO_PUBLIC_SENTRY_DSN` from EAS secrets, `.env.example`, `runtimeConfig`, and docs; `SENTRY_DISABLE_AUTO_UPLOAD` from `eas.json` once Sentry plugin is removed.

---

## 5. Documentation references (historical snapshot)

Before post-migration cleanup, Sentry appeared in privacy, release checklists, and env matrices. **Current engineering docs:** **`expo-app/docs/MONITORING_SETUP.md`**.

Representative paths at audit time:

- `docs/sentry_privacy_decision.md` — **deleted** (superseded by Crashlytics / Firebase privacy posture in `MONITORING_SETUP.md` and counsel-reviewed Privacy Policy)
- `docs/secret_boundary_audit.md`, `docs/production_env_matrix.md`, `docs/legal/README.md`, `docs/release/PRIVACY-DATA-INVENTORY.md`
- `expo-app/docs/IOS_LAUNCH_AUDIT.md`, `expo-app/docs/ENV_SETUP.md`
- `expo-app/RELEASE_CHECKLIST.md`, `app_store_release/release_checklist.md`, `release_management_plan.md`, `rollback_runbook.md`

**Migration follow-up (done):** Legal/engineering docs now reference **`expo-app/docs/MONITORING_SETUP.md`**. Privacy Policy should describe **Google/Firebase** crash processing where required by counsel.

---

## 6. Firebase status in this repository

**Current state:** `@react-native-firebase/app` and `@react-native-firebase/crashlytics` are **installed** in `expo-app/package.json`. Crash reporting is implemented under **`expo-app/src/services/monitoring/`**. Operational documentation: **`expo-app/docs/MONITORING_SETUP.md`**.

*Historical snapshot (audit date — before Firebase packages were added):*

| Check | Result |
|-------|--------|
| `firebase`, `@react-native-firebase`, `crashlytics` in `expo-app/package.json` | **Not present** |
| Firebase in `website/package.json` | **Not present** |
| Code imports | Only tangential doc mentions (e.g. vendor map compares Supabase to Firebase conceptually) |

**Conclusion (historical):** At audit time, **Firebase was not installed**. The following sections retain **pre-migration** findings for traceability.

---

## 7. Error handling architecture (no Sentry in call sites)

### 7.1 Global / route-level

| Mechanism | Location | Notes |
|-----------|----------|--------|
| **Expo Router `ErrorBoundary` re-export** | `expo-app/app/_layout.tsx` | Re-exported from `expo-router`; used by the router’s error boundary contract. |
| **Route error UI** | `expo-app/app/error.tsx` | User-facing “Something went wrong” + retry; **does not** call Sentry. |
| **Sentry root wrap** | `expo-app/app/_layout.tsx` | `Sentry.wrap(RootLayout)` provides Sentry’s React error instrumentation when DSN is set. |

**Not found:** explicit `ErrorUtils.setGlobalHandler`, or React Native `Promise` rejection handlers in `expo-app/src` (standard RN/Expo defaults apply unless added elsewhere).

### 7.2 Central logging (`logErrorSafe` and diagnostics)

| File | Role |
|------|------|
| `expo-app/src/services/diagnostics.ts` | **`logErrorSafe(context, error)`** — logs **message only** in `__DEV__` (`console.warn`); comment says production *can* be wired to remote logger; **currently does not send to Sentry**. Also: `logImportStep`, `logAnalysisStep`, `logAuthStep`, `logMapStep`, `reportIntegrationStatus`, purchase/restore logs — all **`__DEV__`-gated** or safe summaries. |

**Call sites using `logErrorSafe` (preserve pattern for Crashlytics optional `recordError`):**  
`AuthContext`, `SubscriptionContext`, `accountReady`, `importLimits`, `propertyImportOrchestrator`, `portfolio`, `portfolioRefresh`, `usePortfolioProperties`, `usePortfolioCoordinateBackfill`, `openLink`, and others (see grep results in audit session).

### 7.3 Domain-specific (no Sentry today)

- **Auth:** `AuthContext` — try/catch + `logErrorSafe`.
- **Import:** `propertyImportOrchestrator`, `importLimits`, `useExecutePropertyImport` + `logImportStep` / `logErrorSafe`.
- **Paywall / subscription:** `SubscriptionContext`, `usePaywallState`, `PaywallContent` (dev diagnostics UI).
- **Scoring engine:** `src/lib/scoring/dealScoringEngine.ts` — **deterministic** logic; tests in `__tests__`; **no** Sentry or `logErrorSafe` in engine core (errors surface at feature layer if at all).

**Instrumentation worth preserving:** `logErrorSafe` discipline (no full error objects in logs), `__DEV__` diagnostics funnel, route-level `error.tsx`, and Auth/Import defensive try/catch. A Crashlytics adapter could call `crashlytics().recordError(…)` **only** for non-fatal JS errors you explicitly choose—**not** for every `console` line.

---

## 8. Risks: builds, symbols, source maps, startup

| Risk | Detail |
|------|--------|
| **Startup regression** | Sentry init + `Sentry.wrap` run early in `_layout`. Firebase App + Crashlytics also add native init; must follow Expo + RN Firebase docs for SDK 55 and test **cold start** on device. |
| **Removing `Sentry.wrap`** | Replacing with plain `RootLayout` export removes Sentry’s automatic React error capture; **Crashlytics** can still get **native** crashes; **JS** non-fatals need explicit `recordError` or unhandled handler if desired. |
| **Navigation integration** | `reactNavigationIntegration` is Sentry-specific. Crashlytics has no drop-in equivalent; **custom logging** of screen names is optional (e.g. `setAttribute` / breadcrumbs). |
| **Source maps / dSYMs** | Today: **`SENTRY_DISABLE_AUTO_UPLOAD: true`** — Sentry automatic upload is **off**; symbolicated JS may be incomplete in Sentry unless manually uploaded. **Crashlytics** for RN typically uses **Firebase CLI** or **Gradle/Xcode** steps for mapping files; EAS **post-build** hooks may be needed for JS stack quality. |
| **iOS-only Crashlytics** | Repo still lists Android deps (`EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`, etc.). **Omit** `google-services.json` / Android Firebase config if truly iOS-only, or add Android later to avoid accidental misconfiguration. |
| **Privacy / legal** | `docs/sentry_privacy_decision.md` and Privacy Policy references must be revised for **Google/Firebase** data processing. |
| **Plugin ordering** | `app.json` plugins include `expo-router`, `@sentry/react-native`, `expo-web-browser`, `react-native-maps`. Replacing Sentry with `@react-native-firebase/*` plugins requires following current Expo compatibility matrix. |

---

## 9. Recommended Crashlytics integration path (this repo)

1. **Use Expo-compatible React Native Firebase** (or the Expo team–recommended approach for your exact SDK 55), with **only**:
   - `@react-native-firebase/app`
   - `@react-native-firebase/crashlytics`  
   Add the official **Expo config plugin(s)** and **`GoogleService-Info.plist`** via EAS secrets / project files (not committed if sensitive—use EAS file env pattern as per Expo docs).

2. **Initialize Firebase** as early as appropriate (often root component or dedicated `firebase/init` module) with **iOS gating** (`Platform.OS === 'ios'`) to match product scope.

3. **Replace Sentry surface area:**
   - Remove `@sentry/react-native` dependency and plugin.
   - Remove `Sentry.init`, `navigationIntegration`, `Sentry.wrap` from `app/_layout.tsx`.
   - Remove `sentryDsn` from `runtimeConfig` and `EXPO_PUBLIC_SENTRY_DSN` from env/docs.
   - Remove `SENTRY_DISABLE_AUTO_UPLOAD` from `eas.json`.

4. **Optional:** Add a thin **`services/crashReporting.ts`** that wraps `recordError` / `log` for iOS only, and call from selected `logErrorSafe` paths **if** you want parity with non-fatal reporting—keep **PII-safe** strings only.

5. **Symbolication:** Configure **Firebase Crashlytics** + **Metro** source map upload for release builds (EAS build hook or `eas.json` `postPublish` / custom script per current Expo + Firebase docs).

---

## 10. Step-by-step migration order (safe / conservative)

1. **Branch** and document current TestFlight build number baseline.
2. **Firebase console:** Create iOS app, download `GoogleService-Info.plist`; configure Crashlytics.
3. **Add RN Firebase packages** + Expo plugins; **do not** remove Sentry yet — validate **debug** build runs (or use internal distribution).
4. **Implement minimal Crashlytics** (native crashes + optional `recordError` in one test path).
5. **Remove Sentry** (dependency, plugin, `_layout.tsx`, `runtimeConfig`, `eas.json` Sentry env).
6. **Clean docs** (privacy, env matrices, checklists).
7. **EAS production build** + TestFlight; verify **symbolicated** crashes in Firebase console (trigger test crash).
8. **Rollback plan ready** (section 11).

---

## 11. Rollback plan

- **Git:** Revert migration commit(s) or restore tag from pre-migration `main`.
- **EAS:** Re-pin previous **known-good** build in App Store Connect / TestFlight if new build regresses.
- **Env:** Restore `EXPO_PUBLIC_SENTRY_DSN` and Sentry plugin in `app.json` if temporarily re-adding Sentry.
- **Firebase:** Disabling Crashlytics is possible by removing plist / plugin; prefer **feature branch** testing before production cutover.

---

## 12. Appendix: grep-oriented file inventory (Sentry in code config)

| Path | Sentry-related? |
|------|-----------------|
| `expo-app/app/_layout.tsx` | **Yes** — full integration |
| `expo-app/src/config/runtimeConfig.ts` | **Yes** — DSN |
| `expo-app/app.json` | **Yes** — plugin |
| `expo-app/eas.json` | **Yes** — `SENTRY_DISABLE_AUTO_UPLOAD` |
| `expo-app/package.json` / `package-lock.json` | **Yes** — dependency + transitive |
| `expo-app/metro.config.js` | **No** |
| `expo-app/.env.example` | **Yes** — documented DSN |
| `supabase/**` | **No** matches |
| `website/**` | **No** matches |

---

*End of audit.*
