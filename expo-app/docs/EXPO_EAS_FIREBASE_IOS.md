# Expo + EAS + Firebase Crashlytics (iOS) — architecture for PropFolio

This describes **how this repo is wired** (`expo-app/`), not generic Firebase tutorials. PropFolio ships as an **Expo managed** app with **native code generated at build time** (Continuous Native Generation, **CNG**), **iOS-first**; Crashlytics runs only in **native iOS** code paths (`src/services/monitoring/crashlytics.ts`).

---

## 1. Is `expo prebuild` required?

| Workflow | Prebuild? |
|----------|-----------|
| **EAS Build** (development / preview / production) | **Yes, implicitly.** EAS runs **`expo prebuild`** (or equivalent) to produce the native `ios/` project on the build server. You do **not** commit `ios/`. |
| **Local `npx expo run:ios`** | **Yes.** Generates `ios/` if missing, then builds and runs the dev client. |
| **`npx expo start` + dev client already installed** | **No** for JS-only iteration — but any change to **plugins**, **native deps**, or **`GoogleService-Info.plist` handling** requires a **new native build** (prebuild + compile). |

**Summary:** Crashlytics is a **native module**. Any machine that builds iOS must go through **prebuild** at least once per native change. Day-to-day JS edits do not require prebuild.

---

## 2. Are React Native Firebase **config plugins** required?

**Yes.** In Expo managed workflow, **`@react-native-firebase/app`** and **`@react-native-firebase/crashlytics`** must appear in **`app.config.ts` → `plugins`**.

They:

- Copy / reference **`GoogleService-Info.plist`** into the Xcode project.
- Link **Firebase** and **Crashlytics** native SDKs via CocoaPods.
- Add **Crashlytics** build phases (e.g. symbol upload scripts) to the generated Xcode project.

Without these plugins, JS `require('@react-native-firebase/crashlytics')` would have nothing native to bind to.

**Order in this repo (intentional):**

1. `expo-dev-client`, `expo-router`, `expo-web-browser` — Expo / navigation.
2. `react-native-maps` — native maps.
3. **`@react-native-firebase/app`** — must run **before** Crashlytics (Firebase Core).
4. **`@react-native-firebase/crashlytics`** — depends on the app plugin.
5. **`expo-build-properties`** — `ios.useFrameworks: 'static'` (required by **Firebase iOS SDK** / `use_frameworks`; without it, **`pod install` often fails** on EAS). Listed **last** per [RN Firebase Expo](https://rnfirebase.io/) docs.

Do **not** remove or swap the order of the two Firebase plugins.

---

## 3. Are iOS native files generated or committed?

| | |
|--|--|
| **`expo-app/ios/`** | **Generated**, **not committed** — see **`expo-app/.gitignore`** (`/ios`). |
| **Source of truth** | **`app.config.ts`** + **npm dependencies** + **`GoogleService-Info.plist`** (path below). |
| **EAS Build** | Creates a clean `ios/` tree on each build from config + plugins. |

You **do not** hand-edit `Podfile` / `AppDelegate` in-repo for Firebase; the **config plugins** apply changes during prebuild.

---

## 4. How should `GoogleService-Info.plist` be supplied for EAS builds?

**Two supported patterns** (see also **`docs/monitoring/FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`**).

### A. Committed file (simplest)

- Place **`expo-app/GoogleService-Info.plist`** (real download from Firebase Console for bundle id **`com.propfolio.mobile`**).
- **`app.config.ts`** uses `ios.googleServicesFile: process.env.GOOGLE_SERVICES_INFO_PLIST ?? './GoogleService-Info.plist'`.
- If the env var is **unset**, the **local path** `./GoogleService-Info.plist` is used — works on EAS if the file **exists in the repo** at build time.

### B. Not in Git — EAS **file** environment variable

1. In **[Expo dashboard](https://expo.dev)** → project → **Environment variables**, create a variable:
   - **Name:** `GOOGLE_SERVICES_INFO_PLIST` (must match `app.config.ts`).
   - **Type:** **File** — upload the plist.
   - **Environment:** attach to **development** / **preview** / **production** as needed.
2. **`eas.json`** profiles set `"environment": "development" | "preview" | "production"` so the matching dashboard variables apply. The **`env`** block in `eas.json` only needs **`EXPO_PUBLIC_*`** (and similar) substitutions you choose to forward — **file-type variables** like `GOOGLE_SERVICES_INFO_PLIST` are **not** duplicated there; they are resolved when the build runs in that environment (see [Expo EAS env docs](https://docs.expo.dev/eas/environment-variables/)).
3. During the build, **`process.env.GOOGLE_SERVICES_INFO_PLIST`** resolves to the path of the uploaded file, and **`ios.googleServicesFile`** points at it.

**If config resolution fails locally** (e.g. file var not visible in some CLI flows), keep a **local** `./GoogleService-Info.plist` for `expo prebuild` / `expo run:ios`, and rely on EAS file var only on the server.

### Recommended production pattern (use this by default)

- **Production EAS builds:** use **Option B** (Expo file variable `GOOGLE_SERVICES_INFO_PLIST`) as the source of truth.
- **Local iOS development:** keep a local `expo-app/GoogleService-Info.plist` so `expo run:ios` and local verification still work.
- Keep `app.config.ts` fallback exactly as-is:
  `process.env.GOOGLE_SERVICES_INFO_PLIST ?? './GoogleService-Info.plist'`
- Before every release build, run:
  - `npm run verify:firebase-config`
  - `npm run verify:firebase-config:strict`

---

## 5. Crashlytics SDK + automatic dSYM upload (already wired)

### 5.1 Crashlytics SDK — what is already in the app

You do **not** need to add another native SDK package. The repo already includes:

| Layer | Location |
|--------|----------|
| **NPM** | `expo-app/package.json` → **`@react-native-firebase/app`**, **`@react-native-firebase/crashlytics`**. |
| **Expo config plugins** | `expo-app/app.config.ts` → `plugins`: **`@react-native-firebase/app`** then **`@react-native-firebase/crashlytics`** (order fixed: Core before Crashlytics). |
| **JS init** | `expo-app/app/_layout.tsx` → **`initMonitoring()`** → `src/services/monitoring/crashlytics.ts` (lazy native Crashlytics on iOS only). |

**Expo Go:** Crashlytics does **not** run in Expo Go; use a **development build** or **EAS** build.

### 5.2 Automatic dSYM upload — how it works (no hand-edited `ios/` in git)

This app uses **CNG** (`ios/` is **generated**, not committed). The **`@react-native-firebase/crashlytics`** config plugin runs at **`expo prebuild`** (and on **EAS Build**) and injects the Firebase Crashlytics Xcode integration, including a **Run Script** build phase that uploads **dSYM** / symbols during **Release** builds and **archives** so crashes are symbolicated in the Firebase Console.

- **EAS production / internal builds:** Use a **Release**-style iOS build (e.g. `eas.json` **production** profile). The Xcode build EAS runs will execute the Crashlytics script as part of the archive; you normally do **not** manually upload dSYMs unless you are debugging upload failures.
- **Verify in Xcode (after prebuild):** To confirm the script exists or troubleshoot missing symbols:

  1. From **`expo-app`**: `npx expo prebuild --platform ios` (creates **`expo-app/ios/`**, gitignored).
  2. Open **`expo-app/ios/*.xcworkspace`** in Xcode.
  3. Select the **app target** → **Build Phases**.
  4. Find a **Run Script** phase for **Firebase Crashlytics** (wording may include “Crashlytics”, “upload symbols”, or **`FirebaseCrashlytics`** / **`run`**).
  5. In **Build Settings** → **Debug Information Format**, ensure **Release** is **DWARF with dSYM File** (Xcode default for Release).

### 5.3 If stack traces are still unsymbolicated

- Confirm crashes are from a **Release** / TestFlight build, not a mismatched dev build.
- Re-run prebuild and confirm the **Crashlytics** Run Script phase is still present (`app.config.ts` plugin order unchanged).
- See **`docs/monitoring/FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`** §5 and Firebase Console hints.

### 5.4 Summary table

| Item | Handled by |
|------|------------|
| Firebase iOS SDK / Crashlytics pods | **`@react-native-firebase/app`** + **`@react-native-firebase/crashlytics`** plugins |
| Plist in Xcode | **`ios.googleServicesFile`** in **`app.config.ts`** |
| dSYM generation (Release) | Xcode **DWARF with dSYM** (default for Release) |
| dSYM **upload** to Firebase | Crashlytics **Run Script** phase added by the plugin; runs during **archive** (EAS builds included) |
| Manual `Podfile` edits | **Not required** for standard RN Firebase + Expo |

---

## 6. Plugin conflicts with existing Expo setup?

| Plugin | Notes |
|--------|--------|
| **`expo-dev-client`** | Required for dev builds with native modules; **compatible** with Firebase. |
| **`expo-router`** | No conflict. |
| **`expo-web-browser`** | No conflict. |
| **`react-native-maps`** | Uses its own native setup; **does not** replace or collide with Firebase plist handling. |
| **`@react-native-firebase/app` / `crashlytics`** | Must stay **paired** and **ordered** (app → crashlytics). |

There is **no** second Firebase initializer in app code beyond **`initMonitoring()`** → native Crashlytics adapter.

**Expo Go:** Firebase Crashlytics **does not** run in Expo Go; use a **development build** (`expo-dev-client`) or EAS internal/TestFlight builds.

---

## 7. Manual checklist (release engineer)

- [ ] Firebase Console: iOS app **`com.propfolio.mobile`**, Crashlytics enabled.
- [ ] **`expo-app/GoogleService-Info.plist`** real file **or** EAS **`GOOGLE_SERVICES_INFO_PLIST`** file variable for each EAS environment you ship.
- [ ] **`app.config.ts`** includes both Firebase plugins and **`ios.googleServicesFile`** as today.
- [ ] **`npm run expo:config`** (from `expo-app`) shows `ios.googleServicesFile` resolving to a plist path.
- [ ] After plugin/plist changes: **new** EAS iOS build (not only OTA JS).
- [ ] Optional: run **`npx expo prebuild --platform ios`**, open **`ios/*.xcworkspace`**, confirm **Build Phases** includes the **Crashlytics** Run Script (§5.2).
- [ ] Verify Crashlytics on a **Release** / TestFlight build (`__DEV__` disables collection in app code).

---

## Related docs

| Doc | Purpose |
|-----|---------|
| **`FIREBASE_SETUP_CHECKLIST.md`** | Short **finish setup** steps (Console → plist → verify → test) |
| **`FIREBASE_CONSOLE_PLIST.md`** | **Download + overwrite** `GoogleService-Info.plist` (requires Firebase login) |
| **`docs/monitoring/FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`** | Deeper Firebase + plist + EAS file var + dSYM notes |
| **`MONITORING_SETUP.md`** | JS monitoring facade, privacy, troubleshooting |
| **`docs/monitoring/CRASHLYTICS_RELEASE_VERIFICATION.md`** | TestFlight / production verification |
