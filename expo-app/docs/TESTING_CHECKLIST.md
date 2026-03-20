# PropFolio — Cross-Platform Testing Checklist

Use this checklist to manually verify every major feature on **iOS simulator**, **Android emulator**, and **web**. Run through in order for a full demo flow.

---

## Pre-flight

- [ ] **Env (optional)**  
  - No `.env` → app runs in **demo mode** (signed in as demo user).  
  - With `.env` (Supabase URL + anon key) → real auth; start on Login if no session.

- [ ] **Dependencies**  
  From `expo-app`: run `npm install`. No errors.

- [ ] **Validation**  
  From `expo-app`: run `npm run typecheck` and `npm run test`. Both pass.

---

## 1. Launch and home

- [ ] **Start dev server**  
  From `expo-app`: `npm run start` (or `npm run ios` / `android` / `web` for direct launch).

- [ ] **First screen**  
  - **Without Supabase:** You land on **Home** tab (PropFolio title, “Should I buy this property?”, “Add property” card).  
  - **With Supabase and no session:** You land on **Login** (see §2).

- [ ] **Tabs visible**  
  Bottom (or top on web) tabs: **Home**, **Import**, **Portfolio**, **Settings**. Home is selected.

- [ ] **Theme**  
  Background and text use app theme (light/dark if device is set). No white/black flash.

---

## 2. Auth (Login / Sign out)

- [ ] **Sign out**  
  Go to **Settings**. Tap “Sign out”. You are redirected to **Login** screen.

- [ ] **Login screen**  
  - Title: “PropFolio”, subtitle “Sign in to sync your portfolio”.  
  - Fields: Email, Password.  
  - Button: “Sign in”.

- [ ] **Validation**  
  - Leave email empty, tap Sign in → error “Enter your email”.  
  - Enter email only, tap Sign in → error “Enter your password”.

- [ ] **Sign in (demo or real)**  
  - **Demo mode:** Any email + any password → redirect to Home.  
  - **Supabase mode:** Valid Supabase user email + password → redirect to Home.

- [ ] **Session persistence (Supabase only)**  
  After signing in, fully close the app and reopen. You should stay on Home (session restored).

---

## 3. Home and navigation

- [ ] **Home content**  
  - “PropFolio” title.  
  - “Should I buy this property?” subtitle.  
  - Card: “Get started” with short description and “Add property” button.

- [ ] **Add property CTA**  
  Tap “Add property” on Home → navigate to **Import** tab.

- [ ] **Tab switching**  
  Tap each tab: **Import**, **Portfolio**, **Settings**. Each shows the correct screen; selection state updates.

---

## 4. Import — Paste link

- [ ] **Import screen**  
  - Title “Add property”, subtitle “Paste a listing link or enter an address.”  
  - Two cards: “Paste link” and “Or enter address”.

- [ ] **Zillow URL**  
  - Paste a Zillow listing URL (e.g. `https://www.zillow.com/homedetails/...` or with `_zpid` in path).  
  - Tap “Import from link”.  
  - Expect: Alert “Link detected” with Zillow listing ID, or “Unsupported link” if format is wrong.

- [ ] **Redfin URL**  
  - Paste a Redfin listing URL.  
  - Tap “Import from link”.  
  - Expect: Alert “Link detected” with Redfin listing ID, or “Unsupported link”.

- [ ] **Invalid URL**  
  - Paste `https://example.com`.  
  - Tap “Import from link”.  
  - Expect: “Unsupported link” or “Unsupported domain”.

---

## 5. Import — Enter address

- [ ] **Address field**  
  In “Or enter address”, type e.g. `123 Main St, Austin, TX 78701`.

- [ ] **Use address**  
  Tap “Use address”.  
  - Expect: Alert “Address parsed” with street, city, state, or ZIP as parsed.

- [ ] **Short input**  
  Type “Austin TX” or “78701”, tap “Use address”.  
  - Expect: Some parsed parts in the alert (e.g. city/state or postal code).

---

## 6. Portfolio

- [ ] **Portfolio screen**  
  - Title “Portfolio”, subtitle “Your saved properties and analyses.”  
  - Card: “No properties yet” and short explanation.  
  - Button: “Add property”.

- [ ] **Add property from Portfolio**  
  Tap “Add property” → navigate to **Import** tab.

- [ ] **Empty state**  
  No crash; list is empty (no DB persistence in current build).

---

## 7. Settings

- [ ] **Settings screen**  
  - Title “Settings”.  
  - If signed in: optional email line (demo or Supabase).  
  - “Sign out” row (red/destructive style).

- [ ] **Sign out**  
  Tap “Sign out” → redirect to Login. Repeat §2 as needed.

---

## 8. Responsive (Web only)

- [ ] **Desktop width**  
  Run `npm run web`, open in browser. Widen window to desktop size.  
  - Content (Home, Import, Portfolio, Settings) is centered with a max width (~560px).  
  - No full-bleed text across the whole screen.

- [ ] **Mobile width (web)**  
  Resize to narrow or use device toolbar. Layout stacks correctly; no horizontal scroll from content.

---

## 9. Platform-specific

### iOS Simulator

- [ ] App launches from `npm run ios` or Expo dev client.  
- [ ] Tabs, buttons, and inputs respond.  
- [ ] Keyboard opens for email/password and import fields; can dismiss.  
- [ ] No red box or “Holdings” / path errors in terminal.

### Android Emulator

- [ ] App launches from `npm run android` or Expo dev client.  
- [ ] Same flows as iOS: tabs, Home → Import → Portfolio → Settings, Sign out → Login → Sign in.  
- [ ] Keyboard and back gesture (if enabled) don’t break navigation.

### Web

- [ ] App loads at dev server URL (e.g. `http://localhost:8081`).  
- [ ] No “window is not defined” or hydration errors in console.  
- [ ] Sign in / Sign out and tab switches work.  
- [ ] Alerts (Import link/address) appear and can be dismissed.

---

## Sign-off

| Platform   | Date | Tester | Pass |
|-----------|------|--------|------|
| iOS       |      |        | [ ]  |
| Android   |      |        | [ ]  |
| Web       |      |        | [ ]  |

**Notes:**  
- If Supabase is not configured, all auth is demo (any email/password signs in).  
- Portfolio list is empty until backend/DB is wired.  
- Analysis, What-If, and Renovation screens are not in this build; only shared logic exists in `src/lib`.
