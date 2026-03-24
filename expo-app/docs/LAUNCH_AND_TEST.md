# How to Launch and Test PropFolio

Exact commands, order, demo flow, and known limitations.

---

## 1. One-time setup

Do this once (or after pulling changes that touch `package.json`).

### 1.1 Open the project

- Open the repo in your editor/terminal.
- The Expo app lives in the **`expo-app`** folder. All commands below are run from there.

### 1.2 Install dependencies

```bash
cd expo-app
npm install
```

You should see no errors. If you see peer dependency or engine warnings, the app can still run; note them only if something fails later.

### 1.3 (Optional) Supabase for real auth

To test real sign-in and session persistence:

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
3. Save. Do **not** commit `.env`.

If you skip this, the app runs in **demo mode**: you are automatically “signed in” and can still test Sign out → Login → Sign in with any email/password.

---

## 2. Validation (before first launch)

From the **`expo-app`** directory:

```bash
npm run typecheck
```

Expect: no output (success). Any TypeScript errors must be fixed before running the app.

```bash
npm run test
```

Expect: “Tests: X passed” (e.g. 8 passed). Fix any failing tests.

Optional single command:

```bash
npm run validate
```

This runs `typecheck` then `test`. Use it before committing or before a testing session.

---

## 3. Launch by platform

Always start from the **`expo-app`** directory.

### 3.1 iOS Simulator (macOS only)

**Prerequisites:** Xcode installed, an iOS simulator selected in Xcode or via `xcrun simctl list devices`.

**Commands in order:**

1. Start the dev server and open the app in the simulator:
   ```bash
   npm run ios
   ```
   - Metro bundler starts and the default simulator boots the app.
   - If multiple simulators exist, Expo usually picks the default one. To choose another, run `npm run start` first, then press `i` in the terminal and select the device when prompted.

2. When the app is open:
   - You should see the **Home** tab (or **Login** if using Supabase and not signed in).
   - Use the simulator as normal (tap, type, etc.).

**To relaunch:** Run `npm run ios` again, or in the simulator use Cmd+R to reload, or shake device → Reload.

---

### 3.2 Android Emulator

**Prerequisites:** Android Studio installed, an AVD (Android Virtual Device) created and listed in Android Studio’s Device Manager.

**Commands in order:**

1. Start the emulator (optional; Expo can start it for you):
   - Open Android Studio → Device Manager → run an AVD, **or**
   - From terminal: `emulator -avd <AVD_NAME>` (replace with your AVD name).

2. From **`expo-app`**:
   ```bash
   npm run android
   ```
   - Metro starts and the app installs/opens on the running emulator.
   - If no emulator is running, Expo may prompt you to start one.

3. When the app is open:
   - Same as iOS: **Home** (or **Login**), then test tabs and flows.

**To relaunch:** Run `npm run android` again, or in the app use device menu → Reload.

---

### 3.3 Web (local browser)

**Commands in order:**

1. From **`expo-app`**:
   ```bash
   npm run web
   ```
   - Metro starts and compiles for web.
   - A browser window usually opens to the dev URL (e.g. `http://localhost:8081`). If not, open that URL manually.

2. When the app loads:
   - You should see **Home** (or **Login**). Tabs may be at the top. Test the same flows as on native.

**To relaunch:** Run `npm run web` again, or refresh the browser (F5 / Cmd+R). Clear cache if you changed env vars.

---

## 4. Order of commands (quick reference)

**First time:**

1. `cd expo-app`
2. `npm install`
3. (Optional) copy and edit `.env` for Supabase
4. `npm run typecheck`
5. `npm run test` (or `npm run validate`)

**Every test session:**

1. `cd expo-app`
2. **iOS:** `npm run ios`  
   **Android:** `npm run android`  
   **Web:** `npm run web`

No need to run `npm install` again unless you changed dependencies.

---

## 5. Demo user flow (test every major feature)

Follow this order to hit all current features. Use **TESTING_CHECKLIST.md** for a checkbox version.

1. **Launch**  
   Start the app (iOS, Android, or web). You land on **Home** (or **Login** if Supabase + no session).

2. **Auth (if you see Login)**  
   - Enter any email and password → Sign in → you go to Home.  
   - (With Supabase: use a real account to test persistence later.)

3. **Home**  
   - Confirm: “PropFolio”, “Should I buy this property?”, “Add property” card.  
   - Tap **“Add property”** → you switch to the **Import** tab.

4. **Import — Link**  
   - Paste a Zillow or Redfin listing URL in “Paste link”.  
   - Tap **“Import from link”** → Alert with listing ID or “Unsupported link”.  
   - Dismiss the alert.

5. **Import — Address**  
   - In “Or enter address”, type e.g. `123 Main St, Austin, TX 78701`.  
   - Tap **“Use address”** → Alert “Address parsed” with components.  
   - Dismiss.

6. **Portfolio**  
   - Open **Portfolio** tab.  
   - Confirm “No properties yet” and “Add property” button.  
   - Tap “Add property” → back to Import.

7. **Settings**  
   - Open **Settings** tab.  
   - Tap **“Sign out”** → you are redirected to **Login**.

8. **Login again**  
   - Enter email/password → Sign in → back to **Home**.

9. **Web only — responsive**  
   - On web, widen the window to desktop size.  
   - Content should be centered with a max width; no full-bleed text.

That covers: **launch**, **auth**, **tabs**, **Home CTA**, **Import (link + address parsers)**, **Portfolio empty state**, **Settings and Sign out**, and **web layout**.

---

## 6. Exact commands summary

| Step | Command | Where |
|------|--------|--------|
| Go to app | `cd expo-app` | Repo root |
| Install deps | `npm install` | expo-app |
| Typecheck | `npm run typecheck` | expo-app |
| Tests | `npm run test` | expo-app |
| Validate both | `npm run validate` | expo-app |
| Start dev server (interactive) | `npm run start` | expo-app |
| iOS | `npm run ios` | expo-app |
| Android | `npm run android` | expo-app |
| Web | `npm run web` | expo-app |
| Lint | `npm run lint` | expo-app |

---

## 7. Known limitations

- **Portfolio is empty**  
  No backend/DB wired for saving properties. “No properties yet” is the only state.

- **Import does not fetch listing data**  
  Parsers only detect Zillow/Redfin URLs and parse addresses. No API calls to Zillow/Redfin or property services.

- **Analysis / What-If / Renovation screens**  
  Not implemented in this build. Underlying logic exists in `src/lib` (underwriting, scoring, simulation, etc.) but there are no UI screens for them yet.

- **RevenueCat / Stripe**  
  No subscriptions or payments. No paywall.

- **Deep links**  
  No custom URL scheme testing beyond Expo’s default. `propfolio://` is set in `app.json` for future use.

- **Supabase optional**  
  If `.env` is missing or keys are invalid, the app runs in demo mode. No error is shown; auth is local-only.

- **Lint**  
  `npm run lint` runs the local Expo CLI lint. First run may auto-install ESLint and eslint-config-expo. On Windows, if your project path contains `&`, the script uses `node node_modules/expo/bin/cli lint` to avoid shell parsing issues.

- **Path with special characters**  
  If your project path contains `&` (e.g. “Example & Holdings”), some terminal tools (e.g. `&&`) can break. Use `;` in PowerShell or run commands from `expo-app` without `cd` from a path that has `&`.

---

## 8. Where to look when something fails

- **Red screen / crash on open**  
  Run `npm run typecheck` and `npm run test`. Check terminal and (on device) any error overlay.

- **“Cannot find module”**  
  Run `npm install` from `expo-app`. Ensure `node_modules` exists inside `expo-app`.

- **Blank white/web page**  
  Check browser console (F12). For native, check Metro terminal for bundling errors.

- **Auth: always Login or always Home**  
  With Supabase: check `.env` and that both vars are set. Without Supabase: you should always start on Home (demo user). If you see Login and didn’t sign out, check that `getSupabase()` returns `null` when env is missing.

- **Import link/address does nothing**  
  Check for JavaScript errors in console/Metro. Parsers live in `src/lib/parsers`; unit tests for them can be added if needed.

For a full feature list to test, use **docs/TESTING_CHECKLIST.md**.
