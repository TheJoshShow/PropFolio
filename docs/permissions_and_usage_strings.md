# PropFolio – Permissions and Usage Strings

**Purpose:** Central list of required permission strings and usage descriptions for iOS (and Android if applicable).  
**Date:** 2025-03-12.

---

## 1. iOS (Info.plist / app.json)

### 1.1 Currently used

| Key | Purpose | Status |
|-----|---------|--------|
| **NSPrivacyAccessedAPITypes** | Declare use of UserDefaults (AsyncStorage) | ✅ In `app.json` under `expo.ios.privacyManifests` with `NSPrivacyAccessedAPICategoryUserDefaults` and reason CA92.1. |

No other permission keys (e.g. location, camera, photo library) are required by current app behavior.

### 1.2 Not currently required

- **NSLocationWhenInUseUsageDescription** – Not used; no location access.
- **NSCameraUsageDescription** – Not used.
- **NSPhotoLibraryUsageDescription** – Not used.
- **NSMicrophoneUsageDescription** – Not used.
- **NSFaceIDUsageDescription** – Not used (no Face ID for auth in current flow).

### 1.3 If you add in the future

- **Location:** If you add "use my location" for address or market data, add `NSLocationWhenInUseUsageDescription` (and optionally `NSLocationAlwaysAndWhenInUseUsageDescription` if needed) with clear, user-facing text.
- **Camera / Photo:** If you add listing photo upload or document scan, add the corresponding usage description.
- **Face ID:** If you add Face ID for app lock or auth, add `NSFaceIDUsageDescription`.

---

## 2. Recommended usage description text (if needed later)

Keep text short, specific, and in plain language (Apple guidance).

- **Location (example):**  
  "PropFolio uses your location to suggest nearby addresses and market context. Location is not stored on our servers."
- **Camera (example):**  
  "PropFolio uses the camera to scan documents or take photos of properties."
- **Photo library (example):**  
  "PropFolio needs access to your photos to attach listing or property images."

---

## 3. App Store Connect – App Privacy

- **Data types to declare:** Align with **privacy_data_map.md**: identifiers (user id, device id if used), account info (email, name), purchase history (subscription state), usage data (analytics events), crash data (if crash reporting used). Do not declare location/contacts/photos if not collected.
- **Third-party SDKs:** RevenueCat and crash reporting may require declaring their data use; check their current App Privacy guidance and privacy manifests.

---

## 4. Expo / app.json reference

Current `expo-app/app.json` includes:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.propfolio.app",
  "privacyManifests": {
    "NSPrivacyAccessedAPITypes": [
      {
        "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
        "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
      }
    ]
  }
}
```

To add a usage description (e.g. for location), use Expo config plugin or `infoPlist` in app.json (depending on Expo version), for example:

```json
"ios": {
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "Your custom text here."
  }
}
```

No changes needed for current feature set.
