# Download and install `GoogleService-Info.plist` (manual — requires your Firebase login)

The repo cannot ship your real plist: it is generated in **your** Firebase project when you register the iOS app. Follow these steps once per machine/repo checkout.

## 1. Register or open the iOS app in Firebase

1. Open [Firebase Console](https://console.firebase.google.com/) and select the project you use for PropFolio.
2. Click the **gear** next to **Project overview** → **Project settings**.
3. Under **Your apps**, find an **iOS** app whose **Bundle ID** is **`com.propfolio.mobile`**.
   - If it does not exist: click **Add app** → **iOS** → enter **`com.propfolio.mobile`** → follow the wizard (you can skip optional steps until you reach **Download**).

## 2. Download the plist

On the same **Project settings** page, in the iOS app card, click **Download GoogleService-Info.plist** (wording may vary slightly).

Do **not** hand-edit the file; use the download as-is.

## 3. Install in this repo

From the repo root, the target path is:

| Location | Action |
|----------|--------|
| **`expo-app/GoogleService-Info.plist`** | Replace the existing file **entirely** with your download (same filename). |

**Quick check:** open the plist in an editor and confirm:

- **`BUNDLE_ID`** (or `BUNDLE_ID` key) is **`com.propfolio.mobile`**.
- There are **no** strings `REPLACE_ME` or `propfolio-placeholder` (those are only in the template).

## 4. Confirm

From **`expo-app`**:

```bash
npm run verify:firebase-config
```

No template warning should appear. For CI or release gates:

```bash
npm run verify:firebase-config:strict
```

Must exit with code **0**.

## Alternative: EAS file variable only

If you **do not** commit the plist, upload it in [Expo](https://expo.dev) → Project → **Environment variables** as **`GOOGLE_SERVICES_INFO_PLIST`** (type **File**) and keep a local copy at `expo-app/GoogleService-Info.plist` for prebuild. See **`EXPO_EAS_FIREBASE_IOS.md`**.
