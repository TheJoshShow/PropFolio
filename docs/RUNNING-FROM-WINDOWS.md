# Running PropFolio from Windows

PropFolio’s main app is **iOS (Swift/SwiftUI)** and needs **Xcode on a Mac** to build and run in the Simulator. On Windows you have two practical options.

---

## Option 1: Use a Mac in the cloud (run the real iOS app)

Rent a remote Mac and run Xcode there, then view the Simulator over screen share:

| Service | Notes |
|--------|--------|
| [MacinCloud](https://www.macincloud.com/) | Pay‑per‑use or monthly; RDP/Connect to open Xcode and Simulator. |
| [MacStadium](https://www.macstadium.com/) | Dedicated or shared Macs; good for ongoing dev. |
| [AWS EC2 Mac](https://aws.amazon.com/ec2/instance-types/mac/) | macOS EC2 instances; bring your own Xcode/Simulator setup. |

**Steps (high level):**  
1. Copy or clone the PropFolio repo onto the Mac (e.g. via Git, zip, or shared drive).  
2. Open the project in Xcode (`.xcodeproj` or `.xcworkspace`).  
3. Build and run on an iPhone Simulator.  
4. Use the Mac’s screen share / remote desktop to see and use the app.

This is the only way to run the **actual** iOS build from Windows.

---

## Option 2: Run the Expo web target in your browser (recommended on Windows)

The cross-platform app lives in **`expo-app/`** (React Native Web). There is **no** separate root `web/` folder in this repo.

### Prerequisites

- **Node.js 18+**  
  Download: [https://nodejs.org/](https://nodejs.org/) (LTS).  
  Check: `node -v` and `npm -v` in a terminal.

### Run the web dev server

1. Open a terminal and go to **`expo-app`** (folder that contains `package.json` for the Expo app).
2. Install dependencies (once):

   ```bash
   cd expo-app
   npm install
   ```

3. Start Expo and open **web**:

   ```bash
   npm run start
   ```

   Then press **`w`** in the terminal to open in the browser, **or** run:

   ```bash
   npm run expo-cli -- start --web
   ```

   (On Windows paths with `&`, prefer **`npm run expo-cli -- …`** over `npx expo …`—see `expo-app/README.md`.)

4. Open the URL shown (often **http://localhost:8081** or similar) in Chrome / Edge or Cursor’s Simple Browser.

This is the same **expo-app** codebase as iOS/Android; it is not the legacy Swift iOS binary.

### Production web build

Use Expo / EAS web export when you add a web production pipeline, or follow `expo-app/docs/LAUNCH_AND_TEST.md`. Do not expect a root-level `web/dist` from an old Vite app—this repo uses Expo for web.

---

## Summary

| Goal | What to do |
|------|------------|
| Run the **real iOS app** from Windows | Use a cloud Mac (Option 1) and run Xcode + Simulator there. |
| See the **PropFolio UI** on your Windows PC quickly | Use the **web app** (Option 2): `cd web && npm install && npm run dev`, then open the URL in your browser. |

The iOS app remains the primary product; **expo-app** web is a way to develop and preview the experience when you don’t have a Mac.
