# Finish Firebase setup — step-by-step (PropFolio iOS)

Use this as a **single checklist**. **Replace the plist:** **`FIREBASE_CONSOLE_PLIST.md`** (exact Console steps). Other details: **`EXPO_EAS_FIREBASE_IOS.md`**, **`FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`** (repo root), **`MONITORING_VERIFICATION.md`**.

---

## Part A — Firebase Console (5–10 min)

1. Open [Firebase Console](https://console.firebase.google.com/) → **Create a project** (or pick an existing one).
2. **Add an iOS app** (gear → Project settings → Your apps → **Add app** → iOS):
   - **Apple bundle ID:** `com.propfolio.mobile` — **must match** `expo-app/app.config.ts`.
   - Register the app.
3. **Download** `GoogleService-Info.plist` for that iOS app.
4. Go to **Build → Crashlytics** and **complete the setup wizard** if shown (enable Crashlytics).

---

## Part B — Put the plist in the project

**Option 1 — Simplest (recommended to start)**

1. Copy the downloaded file to **`expo-app/GoogleService-Info.plist`** (overwrite the template).
2. Open it and confirm **`BUNDLE_ID`** is `com.propfolio.mobile` and values are **not** `REPLACE_ME` / `propfolio-placeholder`.
3. Commit this file if your team allows (common for client apps).

**Option 2 — Don’t commit the plist**

1. Upload the plist in [Expo](https://expo.dev) → your project → **Environment variables**.
2. Name: **`GOOGLE_SERVICES_INFO_PLIST`**, type: **File**, assign to **development** / **preview** / **production** as needed.
3. Keep a **local** copy at `expo-app/GoogleService-Info.plist` for `expo run:ios` / prebuild on your machine if the CLI can’t see the file var.

---

## Part C — Verify config resolves

From a terminal:

```bash
cd expo-app
npm run verify:firebase-config
```

This runs `expo config --json`, checks **`ios.googleServicesFile`** and **`ios.bundleIdentifier`**, and confirms the plist file exists on disk. Template plists print a **warning**; use **`npm run verify:firebase-config:strict`** for a hard fail until the real plist is in place.

To inspect the full config yourself:

```bash
npm run expo:config
# or
npm run expo:config:json
```

---

## Part D — Rebuild native iOS (required after plist / plugin changes)

- **EAS:** Run an iOS build for the profile you use (e.g. `npm run eas:build:ios` or `eas build --platform ios --profile production`).
- **Local Mac:** `npx expo run:ios` from `expo-app` (generates `ios/` and installs the dev client).

Plain `expo start` alone does **not** pick up a new plist until you install a **new** binary.

---

## Part E — Confirm Crashlytics receives data

1. Install the **new** build on a **physical iPhone** or Simulator (release-like build is best; `__DEV__` limits upload — see below).
2. In the app: **Settings** → **Release readiness diagnostics** (dev) or enable **`EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS=true`** for internal builds.
3. Under **Stability checks**, tap **Send test signal** (see **`MONITORING_VERIFICATION.md`**).
4. Open Firebase → **Crashlytics** → wait **a few minutes** → look for the verification message / `pf_verify` key.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Wrong bundle ID in Firebase | iOS app in Firebase must use **`com.propfolio.mobile`**. |
| Template plist still in repo | Replace **`expo-app/GoogleService-Info.plist`** with the real download. |
| No events in dev | App code **disables** Crashlytics upload in `__DEV__`; use **Send test signal** (temporarily enables upload) or a **Release/TestFlight** build. |
| EAS build can’t find plist | Use **file** env `GOOGLE_SERVICES_INFO_PLIST` for that **environment**, or commit the plist. |

---

## What you do **not** need for Crashlytics

- No `EXPO_PUBLIC_*` Firebase API key in `.env` for the plist (the plist **is** the client config).
- No hand-editing `ios/Podfile` in git (plugins handle it).
- No Firebase Admin / service account JSON in the app.
