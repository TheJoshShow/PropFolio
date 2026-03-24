# Crashlytics verification (internal)

**Setup and architecture:** [`MONITORING_SETUP.md`](./MONITORING_SETUP.md) · **TestFlight / App Store checks:** [`../../CRASHLYTICS_RELEASE_VERIFICATION.md`](../../CRASHLYTICS_RELEASE_VERIFICATION.md) (repo root)

PropFolio includes **optional in-app controls** to confirm Firebase Crashlytics is wired correctly. They are **not** shown to normal App Store users.

## Who can see the controls

- **Development:** any iOS native build with `__DEV__` (e.g. Expo dev client).
- **QA / internal:** production builds with `EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS=true` (same gate as “Release readiness diagnostics” on Settings).

The **“Close app (test)”** button appears only in **`__DEV__`** — never in a production release binary.

## How to open the test actions

1. Run the app on **iOS** (Crashlytics is integrated for native iOS in this project).
2. Open **Settings** (tab).
3. Scroll to **Release readiness diagnostics** (only if dev or QA diagnostics is enabled).
4. Below that, find **Stability checks**.

## What each action does

| Action | Behavior |
|--------|----------|
| **Send test signal** | Uses the shared monitoring layer to log a fixed message, record a **non-fatal** error, and set custom key `pf_verify=non_fatal`. In debug, upload is temporarily enabled for the session so events are not dropped by the default “no upload in `__DEV__`” init behavior. |
| **Close app (test)** | **Debug only.** Enables upload, logs a line, then calls the native Crashlytics test crash. The app stops immediately. |

## How to confirm in Firebase

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Crashlytics**.
2. Wait **a few minutes** after sending the signal (processing is not instant).
3. **Non-fatal:** open **Issues** (or non-fatal / errors view depending on console version) and search for:
   - Message containing `PropFolio: Crashlytics verification (non-fatal)`, or
   - Custom key **`pf_verify`** with value **`non_fatal`**.
4. **Native crash:** look for a new **crash** issue after relaunching the app (Crashlytics often processes after the next start).

**Debugger note (iOS):** If Xcode is attached with “break on all exceptions,” a native test crash may not be submitted. Disconnect the debugger or adjust breakpoints, then reproduce.

## Disable or remove

- **Quick hide:** set `ENABLE_CRASHLYTICS_IN_APP_VERIFICATION` to `false` in `src/services/monitoring/crashlyticsVerification.ts`.
- **Full removal:** delete `crashlyticsVerification.ts`, remove its exports from `src/services/monitoring/index.ts`, and remove the **Stability checks** block from `app/(tabs)/settings.tsx`.
