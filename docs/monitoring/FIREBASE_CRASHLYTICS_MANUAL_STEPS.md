# Firebase Crashlytics — manual steps (PropFolio iOS)

**Architecture (Expo + EAS + CNG, iOS-only):** read **`expo-app/docs/EXPO_EAS_FIREBASE_IOS.md`** first — it answers prebuild vs EAS, why both Firebase **config plugins** are required, whether `ios/` is committed, plist injection, Crashlytics native setup, and plugin conflicts.

This document covers what **you** must do outside the repo: Firebase Console, Apple/Xcode/EAS, plist placement, verification, and dSYM/symbolication. The app code expects **`com.propfolio.mobile`** as the iOS bundle identifier.

---

## 1. Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) and select your project (or create one).
2. Add an **iOS app** if you have not already:
   - **Bundle ID:** `com.propfolio.mobile` (must match `expo-app/app.config.ts` → `ios.bundleIdentifier`).
   - Register the app.
3. Download **`GoogleService-Info.plist`** for that iOS app (Project settings → Your apps → iOS app → **Download**).
4. In Firebase Console, open **Build** → **Crashlytics** and complete the setup wizard if prompted (enable Crashlytics for the project).
5. Optional: confirm **Google Analytics** is linked if you use Analytics features; Crashlytics can work with minimal Analytics linkage depending on project setup—follow the Console prompts.

**No server API keys or private keys belong in the plist**; do not paste Firebase Admin or service account JSON into the app.

---

## 2. Apple / Xcode / EAS

### Replace the plist in the repo (simplest path)

1. Save the downloaded file as **`expo-app/GoogleService-Info.plist`** (overwrite the template). Paths are relative to the **`expo-app`** directory.
2. Commit the real plist **only if** your team policy allows it (Google often ships this in client apps; restrict keys in Google Cloud Console as documented by Google).

### Keep the plist out of Git (EAS file environment variable)

Use this if you do **not** want `GoogleService-Info.plist` in the repository.

1. In [EAS environment variables](https://expo.dev/) for this project, create a **file** variable (Expo docs: *Environment variables* → file type):
   - **Name:** `GOOGLE_SERVICES_INFO_PLIST` (must match `expo-app/app.config.ts`).
   - **Type:** File — upload your downloaded `GoogleService-Info.plist`.
   - Assign it to the EAS **environments** you use for iOS builds (`development`, `preview`, `production` as needed).
2. Ensure `expo-app/eas.json` build profiles set `"environment": "..."` so the correct EAS env vars apply (already set for `development` / `preview` / `production`).
3. Add `expo-app/GoogleService-Info.plist` to `.gitignore` **only after** you rely on EAS-injected files for cloud builds; keep a local copy for `npx expo prebuild` / Xcode on your machine.

**Note:** Expo documents that **secret**-visibility variables may not be available when resolving config in some local CLI flows. If `eas build` fails to resolve `ios.googleServicesFile`, try **sensitive** or **plaintext** visibility for the file variable, or keep the plist committed—see [EAS environment variables FAQ](https://docs.expo.dev/eas/environment-variables/faq/).

### Local dev client / Simulator

1. From **`expo-app`**, install dependencies and generate native projects when needed:
   - `npx expo prebuild --platform ios` (creates `expo-app/ios/`; folder is gitignored).
2. Open **`expo-app/ios/*.xcworkspace`** in Xcode if you need to debug native build phases (e.g. Crashlytics run script).
3. Run the dev client with Expo as you already do; Crashlytics collection is **disabled in `__DEV__`** in code so local noise stays low.

### TestFlight / App Store

1. Use EAS **production** profile (store distribution) so release builds match what you ship.
2. After App Store Connect processing, install the build from TestFlight and perform a **non-debug** session for crash verification (see below).

---

## 3. Where to place `GoogleService-Info.plist`

| Context | Path |
|--------|------|
| Expo config (`ios.googleServicesFile`) | **`expo-app/GoogleService-Info.plist`** (relative to `expo-app`) |
| EAS file env override | Same file uploaded as `GOOGLE_SERVICES_INFO_PLIST`; build receives a **path** in that env var (see [Expo EAS env FAQ](https://docs.expo.dev/eas/environment-variables/faq/)) |
| After `expo prebuild` | The Expo config plugins copy/link the plist into the generated Xcode project; you do not hand-edit `ios/` in the repo |

The template plist in the repo uses obvious **`REPLACE_ME`** / placeholder values until you overwrite it with the Firebase download.

---

## 4. How to verify the setup worked

1. **Config resolves:** From **`expo-app`**, run `npm run expo:config` (or `npx expo config`) and confirm `ios.googleServicesFile` points to your plist path (or the EAS env path on CI).
2. **Prebuild includes Firebase:** Run `npx expo prebuild --platform ios`, open the workspace, and confirm:
   - `GoogleService-Info.plist` is present in the Xcode project / build copy phase as expected.
   - **Build Phases** includes a **Crashlytics**-related run script from `@react-native-firebase/crashlytics` (Firebase / upload symbols).
3. **Runtime (release):** Install a **release** or **TestFlight** build (not `__DEV__`). Trigger a **test crash** only in a controlled way if you add a temporary dev-only button that calls Crashlytics test crash API—**remove it before store submission**. Alternatively, force a handled non-fatal via your monitoring wrapper and confirm it appears in Crashlytics within minutes to hours.
4. **Firebase Console:** Open **Crashlytics** and confirm the app version and sessions appear.

---

## 5. dSYM and symbolication (release crashes)

- **iOS:** Release crashes need **dSYM** upload for symbolicated stack traces. React Native Firebase Crashlytics adds an Xcode **Run Script** phase that uploads symbols during archive/build when correctly configured.
- **EAS Build:** Cloud builds produce archives; the Crashlytics script typically runs as part of the Xcode build. If stack traces show as **hidden** or **unsymbolicated**:
  - Confirm the **Crashlytics** run script exists after prebuild and runs on **Release**.
  - In Firebase Console, check Crashlytics **dSYM** / missing symbols warnings and follow Firebase’s “upload dSYM” guidance for that Xcode version.
  - For local archives, Xcode **Organizer** can show whether dSYMs were generated; Firebase docs describe manual dSYM upload if automation fails.
- **Bitcode:** Modern RN/Expo stacks often do not use Bitcode; follow current Apple + Firebase guidance for your Xcode version.

---

## Structural readiness (what the repo already does)

- **Expo plugins:** `@react-native-firebase/app` and `@react-native-firebase/crashlytics` in `expo-app/app.config.ts`.
- **iOS-only runtime:** Monitoring initializes Crashlytics only on **iOS** native (`expo-app/src/services/monitoring/crashlytics.ts`).
- **No secrets in source:** Only plist path / env indirection; replace template plist with your Firebase file.

## Cannot complete without your Firebase project

- End-to-end Crashlytics reporting and symbol upload verification require **your** real `GoogleService-Info.plist` and a successful **release-class** build installed on a device or TestFlight.
- Until the template is replaced, Firebase may not associate sessions with your project correctly.
