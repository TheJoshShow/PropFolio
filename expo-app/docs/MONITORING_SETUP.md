# Monitoring setup — Firebase Crashlytics (PropFolio)

Single reference for **crash and error reporting** in the Expo app. Read this before changing dependencies or adding instrumentation.

---

## What we use now

- **Firebase Crashlytics** on **iOS native** builds, via **`@react-native-firebase/app`** and **`@react-native-firebase/crashlytics`**.
- All app code goes through the **`src/services/monitoring`** facade (`initMonitoring`, `recordError`, `recordNonFatal`, `recordMessage`, `setMonitoringAttributes`, session helpers). The adapter in `monitoring/crashlytics.ts` lazy-loads the native module so Jest and non-iOS bundles do not require Firebase at import time.

---

## Why Sentry was removed

The app previously used **`@sentry/react-native`**. It was removed to:

- Align with a **single** Google/Firebase toolchain for iOS (Crashlytics + existing Firebase docs).
- Drop **Sentry-specific** env vars, plugins, and `Sentry.wrap` / navigation integrations from the root layout.
- Reduce vendor surface area and simplify EAS configuration.

**Historical detail** (pre-removal file inventory, env names): repo root **`MIGRATION_SENTRY_TO_CRASHLYTICS_AUDIT.md`**. Do **not** reintroduce Sentry DSNs or packages without an explicit product decision.

---

## Architecture overview

```mermaid
flowchart LR
  subgraph app [App code]
    A[Features / services]
  end
  subgraph facade [monitoring/]
    B[index.ts]
    C[crashlytics.ts]
    D[globalHandlers.ts]
    E[sessionContext / attributes]
  end
  subgraph native [iOS only]
    F[@react-native-firebase/crashlytics]
  end
  A --> B
  B --> C
  B --> D
  B --> E
  C --> F
```

- **`app/_layout.tsx`** calls **`initMonitoring()`** once at startup.
- **`MonitoringAttributesSync`** (under auth/subscription providers) updates user id and custom keys (route, subscription tier, portfolio count) with sanitization.
- **Flow / funnel** helpers live in `monitoring/flowInstrumentation.ts` (see **`FLOW_MONITORING.md`**).

---

## How monitoring works in the app

| Concern | Where |
|--------|--------|
| Init + global handlers | `initMonitoring()` in `monitoring/index.ts` → `initCrashlytics`, `installGlobalErrorHandlers`, `applyStartupMonitoringAttributes` |
| Record JS error | `recordError` / `recordNonFatal` (adapter → `recordError` on native) |
| Breadcrumb-style log | `recordMessage` → native `log()` |
| Custom keys | `setMonitoringAttributes` / `MonitoringAttr` keys in `attributeKeys.ts`; values sanitized in `attributeSanitizer.ts` |
| User id | Opaque id via `setUserContext` / session helpers — **not** email |
| Debug vs production | `crashlytics.ts` disables automatic collection in **`__DEV__`** to limit noise; verification can re-enable for a session (see **MONITORING_VERIFICATION.md**) |

---

## Initialize Firebase Crashlytics for iOS

**Expo / EAS specifics (prebuild, plugins, plist, EAS file vars):** **`EXPO_EAS_FIREBASE_IOS.md`** in this folder.

**Crashlytics SDK + automatic dSYM upload:** already integrated via npm packages and `app.config.ts` plugins; dSYM upload is handled by the **Crashlytics Xcode Run Script** injected at prebuild. See **`EXPO_EAS_FIREBASE_IOS.md` §5** for the inventory and how to verify in Xcode after `expo prebuild`.

1. **Firebase Console:** Create or select a project → add an **iOS** app with bundle id **`com.propfolio.mobile`** (must match `app.config.ts`).
2. **Download `GoogleService-Info.plist`** from Project settings → Your apps.
3. **Place the plist** in **`expo-app/GoogleService-Info.plist`**, **or** inject via EAS file env **`GOOGLE_SERVICES_INFO_PLIST`** (see repo root **`FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`**).
4. **Expo config** (`app.config.ts`) already includes:
   - `ios.googleServicesFile` → `./GoogleService-Info.plist` or `process.env.GOOGLE_SERVICES_INFO_PLIST`
   - Plugins: **`@react-native-firebase/app`**, **`@react-native-firebase/crashlytics`** (order fixed: app before crashlytics)
5. **Rebuild** the native app after changing plugins or plist (EAS build or `expo prebuild` + run).

---

## Required files and references

| File / variable | Role |
|-----------------|------|
| `expo-app/app.config.ts` | `googleServicesFile`, Firebase plugins |
| `expo-app/GoogleService-Info.plist` | Firebase iOS app config (local or CI/EAS-injected) |
| `GOOGLE_SERVICES_INFO_PLIST` | Optional EAS **file** env pointing at plist for cloud builds |
| `expo-app/src/services/monitoring/**` | Facade + Crashlytics adapter |
| `FIREBASE_CRASHLYTICS_MANUAL_STEPS.md` (repo root) | Step-by-step Firebase + EAS |
| `FIREBASE_CRASHLYTICS_SETUP_PLAN.md` (repo root) | Broader rollout notes |

There are **no `EXPO_PUBLIC_*` keys** for Crashlytics — the plist is the client identifier. Do not paste server secrets or service account JSON into the app.

---

## Test non-fatal and fatal reports

Use the internal **Stability checks** on **Settings** (visible only in dev or when **`EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS=true`**). Full steps, Firebase console confirmation, and removal instructions: **`MONITORING_VERIFICATION.md`**.

Summary:

- **Non-fatal:** sends a fixed message + error + key `pf_verify`; in **`__DEV__`**, upload is enabled for that session before recording.
- **Fatal (debug only):** optional native crash button — **`__DEV__` only**, never in App Store production binaries as shipped.

---

## Avoid logging sensitive data

- **Never** send passwords, tokens, refresh tokens, full street addresses, payment card data, or freeform user notes to Crashlytics.
- Use **opaque user ids** only (already handled in session helpers).
- Prefer **counts, enums, and short sanitized strings** for custom keys (`attributeSanitizer.ts`, `MonitoringAttr`).
- **`recordMessage` / `recordError`:** keep context strings short and non-identifying (see `flowInstrumentation` patterns).

---

## Where to add future instrumentation

1. **Prefer** the facade: `import { recordNonFatal, recordMessage, setMonitoringAttributes } from '@/services/monitoring'` (or relative path from `src/`).
2. **Funnel / product flows:** extend **`flowInstrumentation.ts`** and **`FLOW_MONITORING.md`** so naming stays consistent.
3. **New custom keys:** add to **`attributeKeys.ts`** as named constants; never hardcode long strings in many files.
4. **Do not** import `@react-native-firebase/crashlytics` outside **`monitoring/crashlytics.ts`** (see below).

---

## Troubleshooting

| Symptom | Things to check |
|--------|------------------|
| No reports in Firebase (debug) | Collection is **off** in `__DEV__` by default. Use **Stability checks → Send test signal** (enables upload for that session) or test on a **Release / TestFlight** build. |
| No reports after sending test | Wait **several minutes**; confirm correct Firebase **project** and iOS app; confirm **`GoogleService-Info.plist`** matches bundle id `com.propfolio.mobile`. |
| Native crash test missing | Xcode **debugger** can intercept crashes — disconnect or disable “break on all exceptions”; see **MONITORING_VERIFICATION.md**. |
| `getCrashlytics()` returns null | Expected on **web** and **Android** in current wiring; adapter no-ops safely. |
| Build fails on `googleServicesFile` | Ensure plist path exists locally, or set **`GOOGLE_SERVICES_INFO_PLIST`** in EAS; see **FIREBASE_CRASHLYTICS_MANUAL_STEPS.md**. |
| Jest failures related to Firebase | Native module is not loaded in tests; monitoring calls should remain defensive (no throw). |

---

## Do not do this

1. **Do not** import **`@react-native-firebase/crashlytics`** (or Sentry, or other vendors) **outside** `src/services/monitoring/` — keep one adapter.
2. **Do not** log **secrets or personal data** (tokens, passwords, full addresses, card numbers, raw PII).
3. **Do not** add **`recordError` / `setAttribute` in tight loops** or per-frame handlers — causes noise, cost, and poor signal.
4. **Do not** let monitoring **throw** or **block startup** — `initMonitoring` and record functions must stay best-effort (try/catch, no await on critical path for init).
5. **Do not** re-enable **Sentry** or duplicate crash SDKs without removing Firebase Crashlytics and updating Privacy Policy / data disclosures.

---

## Related docs

| Doc | Content |
|-----|---------|
| Repo root `CRASHLYTICS_RELEASE_VERIFICATION.md` | TestFlight / production verification (founder-friendly) |
| `MONITORING_VERIFICATION.md` | In-app test signals, Firebase console checks |
| `MONITORING_CONTEXT.md` | Custom keys, auth/session sync |
| `FLOW_MONITORING.md` | Flow / funnel instrumentation |
| `EXPO_EAS_FIREBASE_IOS.md` | Expo prebuild, EAS, plugins, plist (canonical for this repo) |
| Repo root `FIREBASE_CRASHLYTICS_MANUAL_STEPS.md` | Plist + EAS file env (step-by-step) |
| Repo root `MIGRATION_SENTRY_TO_CRASHLYTICS_AUDIT.md` | **Historical** Sentry removal audit only |

---

## CI / scripts

- **`package.json`:** `validate` = `typecheck` + `test`. No separate Crashlytics script — builds pick up Firebase via native config and EAS env.
- **EAS:** Ensure production iOS builds have access to **`GoogleService-Info.plist`** (committed path or **`GOOGLE_SERVICES_INFO_PLIST`** file variable).
