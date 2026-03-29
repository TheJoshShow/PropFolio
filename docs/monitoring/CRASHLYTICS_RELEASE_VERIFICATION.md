# Crashlytics — release verification (PropFolio)

Short guide to confirm **Firebase Crashlytics** is working for the Expo app (`expo-app/`). Crash reporting is **iOS-only** in this codebase; it uses **`GoogleService-Info.plist`** and the monitoring layer in **`expo-app/src/services/monitoring/`**.

**Related:** Expo/EAS/Firebase architecture → `expo-app/docs/EXPO_EAS_FIREBASE_IOS.md` · In-app test buttons → `expo-app/docs/MONITORING_VERIFICATION.md` · Plist & EAS → [`FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`](./FIREBASE_CRASHLYTICS_MANUAL_STEPS.md).

---

## 1. Local / dev verification

Use this on a **development build** (Expo dev client) on **iPhone or Simulator**.

1. Confirm **`expo-app/GoogleService-Info.plist`** is the real file from Firebase (bundle id **`com.propfolio.mobile`**), not placeholders.
2. Open the app → **Settings** → scroll to **Release readiness diagnostics** (visible in dev, or set **`EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS=true`** for a release-style build).
3. Under **Stability checks**, tap **Send test signal**.
4. In [Firebase Console](https://console.firebase.google.com) → your project → **Crashlytics**, search for the message **`PropFolio: Crashlytics verification`** or key **`pf_verify`** (see §8).

**Note:** In **`__DEV__`**, the app turns Crashlytics **upload off** by default to reduce noise; the **Send test signal** flow temporarily enables upload for that session. If nothing appears, use a **Release** build on device (§3–4) instead.

---

## 2. Simulator limitations

| Topic | What to expect |
|--------|----------------|
| **Crashes** | Usually reported, but **less reliable** than a physical device for “did the OS kill / attach debugger?” issues. |
| **Debugger** | If Xcode is attached with **break on all exceptions**, a **native test crash** may not show up in Crashlytics. Disconnect Xcode or change breakpoints, then retry. |
| **Upload timing** | Same as device — still **not instant** (§7). |

Prefer a **real iPhone** for final confidence before TestFlight.

---

## 3. Device testing steps (before TestFlight)

On an **iPhone** with a **Release** or **Release-like** build (not Metro-attached):

1. Install the build from **Xcode** or **EAS internal distribution** (same binary type you trust for store).
2. **Do not** leave Xcode’s debugger attached for crash tests.
3. Open **Settings** → **Stability checks** (needs **QA diagnostics** if not `__DEV__`: set **`EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS=true`** in that build’s env).
4. Tap **Send test signal** → wait → confirm in Firebase (§7–8).
5. Optional: only in **`__DEV__`** builds, **Close app (test)** exists — skip for store binaries; use non-fatal for TestFlight/production checks.

---

## 4. TestFlight verification steps

1. Upload a build from **EAS** (or Xcode) that includes the correct **`GoogleService-Info.plist`** (local file or EAS **`GOOGLE_SERVICES_INFO_PLIST`** file variable — see [`FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`](./FIREBASE_CRASHLYTICS_MANUAL_STEPS.md)).
2. Install from **TestFlight** on a physical iPhone.
3. Launch the app once (cold start) — Crashlytics often flushes after **next** launch.
4. If your build has **`EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS=true`**: **Settings** → **Stability checks** → **Send test signal**.
5. Open Firebase **Crashlytics** after a few minutes (§7). Confirm a **non-fatal** or breadcrumb tied to that session/version.

**Version matching:** In Firebase, check the issue shows your app **version** and **build** (from App Store / `CFBundleVersion`) so you know it’s **this** binary.

---

## 5. Production release verification steps

After the App Store version is live:

1. Install **production** from the App Store on a device.
2. Use the app normally (sign in, open main tabs). Real user traffic generates **sessions**; optional issues appear if something fails.
3. You generally **do not** use in-app **Stability checks** on public production (those controls are hidden unless you shipped QA diagnostics — avoid that for end users).
4. In Firebase, watch **Crashlytics** for the **new version** over the **first 24–48 hours**. Compare crash-free users % and new issues vs. prior version.

---

## 6. Symbolication / dSYMs — what to verify

| Goal | What to do |
|------|------------|
| **Native stacks readable** | Apple **dSYM** upload is handled when **bitcode/symbols** are uploaded to Firebase/App Store Connect per Apple’s flow. For EAS builds, follow **Expo + Firebase** docs for your SDK; confirm **Crashlytics** shows **human-readable** native frames for crashes (not only hex). |
| **JavaScript stacks** | React Native JS errors appear as **JS errors** in Crashlytics; full JS symbolication may need **source maps** configured for your pipeline — treat **perfect** JS line mapping as a **CI/build** follow-up if stacks look minified. |
| **Practical check** | Open one **crash** and one **non-fatal** for the release: if **file/function names** show up for native code, symbolication is working at least partially. |

Detailed setup is outside day-to-day founder QA; ask engineering if stacks are unreadable blobs.

---

## 7. How long reports take to appear

| Situation | Typical wait |
|-----------|----------------|
| After sending a test signal / crash | **2–15 minutes** is common; sometimes **up to ~24 hours** in edge cases. |
| After first install | First events may appear only after **second launch** (upload batching). |
| Busy periods | Google’s processing can lag; **refresh** the console and filter by **version**. |

**Rule of thumb:** Wait **15 minutes**, then **force-quit and reopen** the app once, then check again.

---

## 8. What kinds of reports appear first

1. **Sessions / active users** (Crashlytics dashboard) — confirms the SDK is alive with that build.
2. **Non-fatal issues** (e.g. verification message **`PropFolio: Crashlytics verification`**, key **`pf_verify`**) — often easiest to spot after **Stability checks**.
3. **Fatal crashes** — only if the app actually crashed; may list **after** relaunch.

Real-user **ANRs** are less of a focus on iOS than Android; PropFolio’s integration is **iOS Crashlytics** via **`@react-native-firebase/crashlytics`**.

---

## 9. What to check if reports are missing

| Check | Action |
|-------|--------|
| **Wrong Firebase project** | Open the plist used in the build; **`GOOGLE_APP_ID`** / bundle id must match **`com.propfolio.mobile`**. |
| **Missing plist in build** | EAS: confirm **`GOOGLE_SERVICES_INFO_PLIST`** file env is set for the **same** profile you used to build. |
| **Still on `__DEV__`** | Dev builds disable upload by default; use **Send test signal** (enables session upload) or a **Release** binary. |
| **Debugger attached** | Disconnect Xcode for native crash tests. |
| **Too soon** | Wait, relaunch app, wait again (§7). |
| **Filtered view** | In Firebase, clear **version** / **time** filters; select the correct **iOS app**. |

---

## 10. Release-day checklist (quick)

- [ ] **`GoogleService-Info.plist`** is correct for **`com.propfolio.mobile`** in this build.
- [ ] EAS build profile used the right **secrets** (including plist file var if not committed).
- [ ] **TestFlight** build: someone sent **Send test signal** (with QA diagnostics) or exercised the app and saw **sessions** in Crashlytics.
- [ ] Firebase shows the **version + build** you expect.
- [ ] Privacy Policy / disclosures cover **Google/Firebase** crash data if required by counsel.

---

## Checklist — before you upload a build

- [ ] Plist present locally or via **`GOOGLE_SERVICES_INFO_PLIST`** for this upload.
- [ ] **`npm run typecheck`** and **`npm run test`** passed in `expo-app` (engineering gate).
- [ ] Bundle id in Firebase iOS app = **`com.propfolio.mobile`** (matches `expo-app/app.config.ts`).
- [ ] You know **which Firebase project** you’ll open to verify (bookmark the Console).

---

## Checklist — after installing a TestFlight build

- [ ] Open app → sign in → open **Settings** / main flows once.
- [ ] If QA diagnostics enabled: **Send test signal** → wait **15+ min** → check Firebase.
- [ ] Confirm **Crashlytics** shows activity for this **version/build** (sessions or test issue).

---

## Checklist — after production release

- [ ] Within **48 hours**, open Crashlytics → filter **latest production version**.
- [ ] Compare **crash-free users** to previous version (rough sanity).
- [ ] Open **top issues**; confirm stacks are **not** empty / obviously unsymbolicated (§6).
- [ ] If spike in crashes, note **issue title** + **version** for engineering triage.

---

*PropFolio architecture reminder: all Crashlytics calls go through **`expo-app/src/services/monitoring/`**; startup uses **`initMonitoring()`** in **`app/_layout.tsx`**. Full setup: **`expo-app/docs/MONITORING_SETUP.md`**.*
