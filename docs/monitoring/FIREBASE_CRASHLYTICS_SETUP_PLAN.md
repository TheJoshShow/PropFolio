# Firebase Crashlytics — PropFolio setup plan (iOS only)

**Expo + EAS + Firebase (this repo):** **`expo-app/docs/EXPO_EAS_FIREBASE_IOS.md`**. **Monitoring / JS:** **`expo-app/docs/MONITORING_SETUP.md`** (testing, troubleshooting, “do not do this”).

## Implementation status (codebase)

- **Packages:** `@react-native-firebase/app` and `@react-native-firebase/crashlytics` (^23.8.8), `expo-dev-client` (~55.x), installed under `expo-app/`.
- **Expo config:** `app.config.ts` includes plugins `expo-dev-client`, `@react-native-firebase/app`, `@react-native-firebase/crashlytics`, and `ios.googleServicesFile` → `./GoogleService-Info.plist` or `process.env.GOOGLE_SERVICES_INFO_PLIST` on EAS (see `FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`).
- **Plist:** `expo-app/GoogleService-Info.plist` is a **placeholder** (`REPLACE_ME`, `propfolio-placeholder`). **Replace with the file from Firebase Console** for the real Firebase iOS app (`com.propfolio.mobile`) before relying on Crashlytics in production.
- **Monitoring:** `src/services/monitoring/` — `types.ts`, `crashlytics.ts`, `index.ts` — wraps Crashlytics with try/catch; collection **off in `__DEV__`**, **on in release** (via `setCrashlyticsCollectionEnabled(!__DEV__)`).
- **Jest:** `react-native` and `@react-native-firebase/crashlytics` are mocked in `src/test/setup.ts` / `jest.config.js` so unit tests stay in Node.

---

This document is based on the **actual** `expo-app/` tree as of the audit date below. It picks a single production-ready integration path and explains why alternatives do not fit.

**Last inspected:** `expo-app/package.json`, `expo-app/app.config.ts`, `expo-app/eas.json`, absence of `ios/` in-repo, and existing `src/services/monitoring` abstraction.

---

## 1. Recommended option: **A — Expo + React Native Firebase + config plugins + prebuild**

**Verdict:** Use **[@react-native-firebase/app](https://rnfirebase.io/)** and **[@react-native-firebase/crashlytics](https://rnfirebase.io/crashlytics/usage)** with Expo **config plugins**, relying on **`npx expo prebuild`** (locally when needed) and **EAS Build** (always runs prebuild for managed projects) to generate native iOS projects. Wire implementation into the existing **`expo-app/src/services/monitoring/index.ts`** facade.

### Why not the other options?

| Option | Verdict for PropFolio |
|--------|------------------------|
| **B — Bare React Native Firebase path** | **Does not apply.** There is **no** committed `expo-app/ios/` directory. Production iOS binaries are produced by **EAS Build** + **prebuild**, not from a checked-in bare Xcode project. You would only “go bare” if you intentionally committed `ios/` and maintained it by hand—this repo does not. |
| **C — Expo managed + prebuild** | **Same as A in practice.** “Managed” here means **no native folders in git**; **prebuild** is still required whenever native modules (Firebase, Maps, RevenueCat, etc.) change. **C is not a different SDK**—it is *how* managed Expo delivers native code (via prebuild + plugins). |
| **D — Firebase JS SDK only** | **Invalid for Crashlytics on device.** Expo’s [Using Firebase](https://docs.expo.dev/guides/using-firebase/) guide states that **Firebase JS SDK does not support Crashlytics** (and several other native-only services) for mobile; **React Native Firebase** is required for Crashlytics. |

### Official alignment

- Expo documents **React Native Firebase** for services **not** available in the Firebase JS SDK on mobile, including **Crashlytics**.
- React Native Firebase **requires custom native code** and therefore **cannot run in Expo Go**; you use **development builds** (`expo-dev-client`) and/or **EAS Build** installs.

---

## 2. Detected architecture (from codebase)

| Aspect | Finding |
|--------|---------|
| **Expo SDK** | **~55** (`expo ~55.0.6`, aligned Expo packages). |
| **React Native** | **0.83.2** (from `package.json`). |
| **Entry** | `expo-router/entry` — Expo Router. |
| **Config** | **`app.config.ts`** (dynamic `ios.googleServicesFile` for EAS file env). |
| **`ios/` in repo** | **None** — native project is **generated** at build time (EAS / `expo prebuild`). |
| **EAS** | **`eas.json`** with `production` profile (store distribution, `autoIncrement`, env forwarding). `extra.eas.projectId` set. |
| **Config plugins today** | `expo-router`, `expo-web-browser`, `react-native-maps` — already **native**-touching; **prebuild is already part of the release pipeline** (`extra.billingRequiresPrebuild: true` in `app.config.ts`). |
| **Firebase** | **Not installed**; **`src/services/monitoring`** is a stub ready to be wired. |

**Conclusion:** PropFolio is **Expo managed workflow + continuous prebuild on EAS** (and optional local prebuild). Crashlytics is **not** impossible—**it requires adding RN Firebase native modules and config plugins**, which is the same class of change as Maps/RevenueCat.

---

## 3. Exact packages (iOS-focused)

**Minimum for Crashlytics:**

| Package | Role |
|---------|------|
| `@react-native-firebase/app` | Core native Firebase; **config plugin** for `GoogleService-Info.plist` / native wiring. |
| `@react-native-firebase/crashlytics` | Crashlytics native SDK + JS API. |

**Install with Expo-aware versions (recommended):**

```bash
npx expo install @react-native-firebase/app @react-native-firebase/crashlytics
```

**Strongly recommended for this stack (Expo SDK 53+ / RN Firebase):**

| Package | Role |
|---------|------|
| `expo-dev-client` | **Development builds** so you can run native Firebase code on-device/simulator (Expo Go will not load native Firebase). |

**Contingency (if iOS build issues appear):**

| Package | Role |
|---------|------|
| `expo-build-properties` | Resolve **Pods / `use_frameworks!` / static linking** issues that sometimes appear when mixing Firebase pods with other native deps (e.g. Maps, Reanimated). Applied only if a clean EAS iOS build fails with known linker/header errors. |

**iOS-only note:** You can add Firebase iOS app + plist only; Android `google-services.json` can be omitted until you ship Android, but some RN Firebase versions still generate Android placeholders—confirm in the version’s Expo plugin docs when implementing.

---

## 4. Apple & Firebase console prerequisites

1. **Firebase project** in [Firebase Console](https://console.firebase.google.com/).
2. **Add an iOS app** with bundle ID **`com.propfolio.mobile`** (must match `apps.json` → `expo.ios.bundleIdentifier`).
3. Download **`GoogleService-Info.plist`** for that iOS app.
4. **Enable Crashlytics** in the Firebase console for the project (if not auto-enabled by adding the SDK).
5. **Apple Developer / App Store Connect** — unchanged; same bundle ID and team as today (`eas.json` submit profile already references ASC).

**Secrets / files:**

- **`GoogleService-Info.plist`** is **not** a server secret; it identifies the Firebase app. It is still often **gitignored** and supplied via **EAS file environment variables** or CI secrets so the repo stays clean—see §6.

---

## 5. Expo plugin requirements (`app.config.ts`)

Add to **`expo.plugins`** (order can matter; **Firebase app plugin often before other native modifiers**—follow RN Firebase + Expo docs for your exact versions):

1. **`@react-native-firebase/app`** — with plugin options pointing to **`iosGoogleServicesFile`** (path to `GoogleService-Info.plist` relative to project root, e.g. `./GoogleService-Info.plist` or a secrets-backed path).
2. **`@react-native-firebase/crashlytics`** — as documented for your installed version.

**Example shape (verify against current RN Firebase docs when implementing):**

```json
"plugins": [
  "expo-router",
  [
    "@react-native-firebase/app",
    {
      "iosGoogleServicesFile": "./GoogleService-Info.plist"
    }
  ],
  "@react-native-firebase/crashlytics",
  "expo-web-browser",
  "react-native-maps"
]
```

**Do not** rely on Expo Go for validation—use a **development build** or **EAS internal distribution**.

---

## 6. Native iOS files & `GoogleService-Info.plist`

| Artifact | Where it lives |
|----------|----------------|
| **`GoogleService-Info.plist`** | Typically **`expo-app/GoogleService-Info.plist`** in the working tree; **do not commit** production plist if policy requires; use **EAS Secrets** (file) or `eas secret:create` to inject at build time. |
| **Generated `ios/`** | Created under **`expo-app/ios/`** only **after** `expo prebuild` or on **EAS Build** workers—not checked into git today. |
| **Pods / Firebase** | Added by CocoaPods during prebuild; **no manual Podfile edits** in-repo unless you adopt a custom `ios/` folder later. |

**Crashlytics is impossible without native code** in the sense that **Expo Go cannot ship** the Firebase native SDKs. **Prebuild + EAS** is the **safe, standard path** for this repo—**not** a blocker.

---

## 7. dSYM upload & symbolication

### Native crashes (Objective-C / Swift / native stack)

- Firebase Crashlytics **iOS** integration typically adds a **“Run Script”** build phase that uploads **dSYM** files during **Release** archive builds.
- **EAS Build** produces archives; you must ensure:

  1. **Crashlytics** is enabled in Firebase and the app is linked.
  2. **Upload symbols** succeeds (EAS logs / Xcode build phase). If the RN Firebase plugin does not add the upload script automatically for your version, follow RN Firebase + Firebase docs for **iOS symbol upload** and optionally add an **`eas-build` hook** after `post_install` or use **Firebase CLI** `upload-symbols` with artifacts from EAS.

### JavaScript / Hermes stack traces

- **React Native** crash reporting mixes **native** and **JS** stacks.
- For **JS** errors, you typically rely on **`recordError`** / **`crash().log`** from `@react-native-firebase/crashlytics` and/or **Hermes source map** upload to Firebase (see **Firebase + React Native** docs for **Hermes** and **Metro**).
- **EAS** may expose **build artifacts**; for full JS symbolication, plan a **separate step** (CI hook or manual upload) consistent with **RN version and Hermes** settings.

**Practical note:** PropFolio’s **monitoring** layer should call **`recordError` / `recordNonFatal`** for JS; **native** crashes are automatic once Crashlytics is linked.

---

## 8. Local dev vs EAS vs TestFlight / production

| Environment | What to do |
|-------------|------------|
| **Expo Go** | **Firebase Crashlytics will not work** (native modules not in Go). |
| **Local simulator / device** | Install **`expo-dev-client`**, run **`npx expo prebuild`** (or `--clean` when changing plugins), then **`npx expo run:ios`**. Place **`GoogleService-Info.plist`** locally or use a dev-only copy. |
| **EAS `development` profile** | Use **development client** + internal install; same native Firebase as production. |
| **EAS `production` / TestFlight / App Store** | Use **production** Firebase iOS app (or same project with correct env); ensure **plist** is present at build time via **EAS secrets**; verify **dSYM upload** in Firebase Crashlytics after first release build. |

---

## 9. Wiring into PropFolio code

- **`src/services/monitoring/index.ts`** — replace stubs with **`@react-native-firebase/crashlytics`** calls (`crashlytics().recordError`, `setUserId`, etc.), gated by **`Platform.OS === 'ios'`** if you want **iOS-only** behavior at runtime.
- **`app/_layout.tsx`** — already calls **`initMonitoring()`**; extend **`initMonitoring`** to call Firebase init once (RN Firebase often auto-inits from plist; confirm docs).
- **Privacy** — update **Privacy Policy** and **App Store** privacy answers when **Firebase/Google** data processing begins.

---

## 10. Summary: choice letter

| Letter | Name | Use for PropFolio? |
|--------|------|---------------------|
| **A** | Expo + React Native Firebase + config plugin / prebuild | **Yes — primary path** |
| B | Bare RN Firebase | **No** (no bare `ios/` in repo) |
| C | Managed + prebuild | **Same pipeline as A** (descriptive, not a different SDK) |
| D | Firebase JS SDK only | **No** (Crashlytics unsupported for this use case per Expo) |

---

## 11. Rollout order (implementation checklist)

1. Create Firebase iOS app + download **`GoogleService-Info.plist`** (`com.propfolio.mobile`).
2. Add **`expo-dev-client`**; add **`@react-native-firebase/app`** + **`@react-native-firebase/crashlytics`** via **`expo install`**.
3. Register **`plugins`** in **`app.config.ts`** with **`ios.googleServicesFile`** (and Firebase plugins as listed in the plan).
4. **Gitignore** plist if needed; configure **EAS file secret** for production builds.
5. Run **`npx expo prebuild --platform ios`** locally once to verify generation; fix with **`expo-build-properties`** only if needed.
6. Implement **`monitoring`** module; **iOS-only** guards if required.
7. **EAS production build** → TestFlight → confirm **Crashlytics dashboard** and **symbolication** (native + JS as configured).
8. Update legal/docs and App Store privacy.

---

*End of plan.*
