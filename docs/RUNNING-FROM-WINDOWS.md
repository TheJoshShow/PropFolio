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

## Option 2: Run the web app in your browser (recommended on Windows)

A **web version** of the PropFolio shell lives in the `web/` folder. It mirrors the Home dashboard (hero, import CTA, confidence teaser, featured metrics, recent analyses, portfolio snapshot) so you can “launch” PropFolio in Chrome or Cursor’s Simple Browser from your Windows machine.

### Prerequisites

- **Node.js 18+**  
  Download: [https://nodejs.org/](https://nodejs.org/) (LTS).  
  Check: `node -v` and `npm -v` in a terminal.

### Run the web app

1. Open a terminal in the project root (where `web/` is).
2. Go into the web app and install dependencies (once):

   ```bash
   cd web
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open the URL shown (e.g. **http://localhost:5173**) in:
   - **Chrome / Edge**, or  
   - **Cursor:** *View → Simple Browser* (or Command/Ctrl+Shift+P → “Simple Browser: Show”), then paste the URL.

You should see the PropFolio home shell: tabs (Home, Import, Portfolio, Settings), hero line, import CTA, confidence teaser, metrics, recent analyses, and portfolio card. This uses the same mock data concept as the iOS app; it is not connected to the iOS binary or Simulator.

### Build for production (optional)

```bash
cd web
npm run build
```

Then serve the `web/dist` folder with any static host (e.g. `npx serve dist` or your hosting provider).

---

## Summary

| Goal | What to do |
|------|------------|
| Run the **real iOS app** from Windows | Use a cloud Mac (Option 1) and run Xcode + Simulator there. |
| See the **PropFolio UI** on your Windows PC quickly | Use the **web app** (Option 2): `cd web && npm install && npm run dev`, then open the URL in your browser. |

The iOS app remains the primary product; the web app is a way to develop and preview the experience when you don’t have a Mac.
