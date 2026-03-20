# PropFolio — Development Run Guide

Use this to build and run the app locally and verify all major features (Import, Analysis, What-If, Renovation, Portfolio, Settings).

---

## 1. Final run steps

### Prerequisites

- **Xcode 15+** (Xcode 16 recommended) with an iOS 17+ simulator.
- **macOS** (required for iOS Simulator). On Windows you cannot run the iOS simulator; use a Mac or cloud Mac (e.g. MacStadium, GitHub Actions) for running the app.

### Option A: You already have an Xcode project

If you have a `.xcodeproj` (or `.xcworkspace`) in the repo or in the same folder as the `PropFolio` app source:

1. Open the project in Xcode:
   ```bash
   open PropFolio.xcodeproj
   ```
   or
   ```bash
   open PropFolio.xcworkspace
   ```

2. Select the **PropFolio** scheme and an **iPhone 16** (or iPhone 15) simulator.

3. **Product → Run** (⌘R), or:
   ```bash
   xcodebuild -scheme PropFolio -destination 'platform=iOS Simulator,name=iPhone 16' build
   xcodebuild -scheme PropFolio -destination 'platform=iOS Simulator,name=iPhone 16' run
   ```

### Option B: No Xcode project yet (first-time setup)

1. **Create the iOS project in Xcode**
   - **File → New → Project**
   - Choose **iOS → App**
   - Product Name: **PropFolio**
   - Team: your team (or None for local only)
   - Organization Identifier: e.g. `com.yourcompany`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Uncheck **Include Tests** (we add tests from the repo)
   - Save the project in the **repo root** (the same folder that contains the `PropFolio` app source folder) so `PropFolio.xcodeproj` and the `PropFolio` source folder are side by side.

2. **Wire the app to the repo source**
   - Delete Xcode’s default `ContentView.swift` and any default app entry if it conflicts.
   - In the project navigator, **Add** the existing `PropFolio` folder (the one with `App/`, `Screens/`, etc.) to the **PropFolio** app target: **File → Add Files to "PropFolio"…** → select the `PropFolio` source folder → **Create groups** → ensure **PropFolio** target is checked.
   - Set the app entry point: in the target’s **General** tab, set **Main Interface** (if needed) or ensure the app delegate / SwiftUI lifecycle points to the existing `PropFolioApp.swift` (it’s the `@main` entry in `PropFolio/App/PropFolioApp.swift`).
   - Add the **PropFolioTests** folder to a **PropFolioTests** target if you want to run unit tests.

3. **Build and run**
   - Select scheme **PropFolio** and destination **iPhone 16** (or any iOS 17+ simulator).
   - **Product → Run** (⌘R).

### Development launcher (demo data)

- In **Debug** builds, demo data is **on by default** (see `PropFolioApp.swift`). The app **opens on the Portfolio tab** with three demo deals so you can immediately tap a deal → Analysis → What-If → Renovation.
- You can turn demo data off in **Settings → Use demo data**.

---

## 1b. Run on a physical iPhone

You need a **Mac** with Xcode and a **USB cable** (or wireless debugging). The iPhone must be on **iOS 17+**.

1. **Create or open the Xcode project**  
   Follow Option A or B above so you have a working PropFolio scheme.

2. **Connect your iPhone**
   - Plug the iPhone into the Mac with a USB cable.
   - On the iPhone, if prompted **“Trust This Computer?”** tap **Trust** and enter your passcode.

3. **Select your iPhone as the run destination**
   - In Xcode, click the **destination** menu in the toolbar (next to the **PropFolio** scheme). It usually shows a simulator name (e.g. “iPhone 16”).
   - Click it and choose your **iPhone** (e.g. “Josh’s iPhone”). It appears under “iOS Device” or with the device name.
   - If the iPhone doesn’t appear: unlock the phone, leave it on the Home Screen, and wait a few seconds; or unplug and replug the cable.

4. **Set up code signing**
   - In the project navigator, select the **PropFolio** project (blue icon), then the **PropFolio** target.
   - Open the **Signing & Capabilities** tab.
   - Check **“Automatically manage signing”**.
   - Set **Team** to your Apple ID (e.g. “Personal Team” or your organization). If no team is listed: **Xcode → Settings… → Accounts** → add your **Apple ID** → then select it as Team.
   - Xcode will create a free provisioning profile. For a free account, the app runs on your device for 7 days and then you need to run again from Xcode.

5. **Run on the device**
   - With your **iPhone** selected as the destination, press **⌘R** (or **Product → Run**).
   - The app builds and installs on the iPhone. The first time, the device may show **“Untrusted Developer”** when you open the app.

6. **Trust the developer on the iPhone (first time only)**
   - On the iPhone: **Settings → General → VPN & Device Management** (or **Device Management**).
   - Under **“Developer App”**, tap your Apple ID / team name.
   - Tap **“Trust …”** and confirm.
   - Open the PropFolio app again from the Home Screen; it should launch.

**Wireless debugging (optional):** After a successful USB run, you can use wireless debugging: **Window → Devices and Simulators** → select your iPhone → check **“Connect via network”**. Then you can unplug and still choose the iPhone as the run destination (same Mac and iPhone on the same Wi‑Fi).

---

## 2. Environment variables (optional)

For **local development** you do **not** need any environment variables to run the app. The app runs without Supabase; usage tracking and auth are no-ops or optional.

If you want to use **Supabase** (auth, usage events):

| Variable           | Required | Notes                                      |
|-------------------|----------|--------------------------------------------|
| `SUPABASE_URL`    | If using Supabase | Your project URL                    |
| `SUPABASE_ANON_KEY` | If using Supabase | Your anon/public key            |

- In Xcode: **Edit Scheme → Run → Arguments → Environment Variables**.
- Or in an xcconfig / Info.plist: see **docs/SETUP-BACKEND-CONFIG.md**.

Leave both unset to run and test everything locally with demo data only.

---

## 3. Recommended simulator

- **iPhone 16** (or **iPhone 16 Pro**) — good default for layout and speed.
- **iPhone 15** or **iPhone 15 Pro** — also fine.
- Minimum: any **iOS 17.0** simulator so all features (tabs, sheets, navigation) work as designed.

---

## 4. Tap-through checklist (verify all features)

Use this order so you hit every major flow without APIs.

| # | Where to start | Action | What you’re verifying |
|---|----------------|--------|------------------------|
| 1 | **Home** | Tap **Import property** | Switches to **Import** tab |
| 2 | **Import** | Tap **Strong 4-plex** (under Demo) | Import result with details and photos; **Edit** and **Save to portfolio** / **Done** |
| 3 | **Portfolio** | Tap any deal card (e.g. Maple Ridge 4-plex) | **Analysis** screen: score, confidence, future value, metrics, risks/opportunities |
| 4 | **Analysis** | Tap **What-if scenarios** (sticky bar or inline CTA) | **What-If** screen opens (full screen) with inputs and live metrics |
| 5 | **What-If** | Scroll to **Renovation**; tap **Edit** or **Add renovation plan** | **Renovation** planner sheet (line items, tier, contingency) |
| 6 | **What-If** | Tap **Done** | Dismisses What-If and returns to Analysis / Portfolio |
| 7 | **Portfolio** | Use **Archetype** and **Status** filters | Filter chips; empty state when no matches |
| 8 | **Settings** | Toggle **Use demo data** off/on | Portfolio shows 3 deals when ON, or your saved/mock list when OFF |

Optional:

- **Import → Type address** and **Paste link**: flow works; real lookup will fail without API keys (expected).
- **Home → Recent analyses / Portfolio snapshot**: mock data; no navigation required for this checklist.

---

## Quick reference

- **Run (with existing project):**  
  `xcodebuild -scheme PropFolio -destination 'platform=iOS Simulator,name=iPhone 16' build run`
- **Simulator target:** iPhone 16 (iOS 17+).
- **Env vars:** None required; optional `SUPABASE_URL` and `SUPABASE_ANON_KEY` for backend.
- **First screen to reach everything:** **Portfolio** (with demo data on) → tap a deal → **Analysis** → **What-if scenarios** → **Renovation** (from What-If). Then **Import** (tab) and **Settings** (tab) as above.
