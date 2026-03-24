# PropFolio — Cross-Platform Testing Prep (Complete)

This document confirms that all prep tasks for full cross-platform manual testing are done. Use it after a connection loss or to onboard testers.

---

## Task status

| # | Task | Status | Where |
|---|------|--------|--------|
| 1 | Verify all required environment variables are documented | Done | `.env.example`, `docs/ENV.md` |
| 2 | Verify package dependencies are installed correctly | Done | `npm install` from `expo-app`; 0 vulnerabilities |
| 3 | Verify iOS build configuration | Done | `app.json` → `ios.bundleIdentifier: com.propfolio.app` |
| 4 | Verify Android build configuration | Done | `app.json` → `android.package`, adaptiveIcon assets |
| 5 | Verify web build configuration | Done | `app.json` → `web.bundler: metro`, `output: static`, favicon |
| 6 | Create or fix npm scripts (ios, android, web, test, lint, typecheck) | Done | `package.json` scripts; lint uses local Expo CLI |
| 7 | Run validation checks | Done | typecheck ✓, test ✓ (8 tests), lint (may install ESLint on first run) |
| 8 | Fix any launch-blocking issues | Done | TypeScript and tests pass; lint script fixed for paths with `&` |
| 9 | Create TESTING_CHECKLIST.md | Done | `docs/TESTING_CHECKLIST.md` — every major feature |
| 10 | Explain step-by-step how to launch on iOS, Android, web | Done | `docs/LAUNCH_AND_TEST.md` |

---

## Quick reference: commands and order

**First-time setup (from repo root):**

1. `cd expo-app`
2. `npm install`
3. (Optional) `cp .env.example .env` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for real auth
4. `npm run typecheck`
5. `npm run test` (or `npm run validate` to run both)

**Launch by platform (from `expo-app`):**

- **iOS Simulator:** `npm run ios`
- **Android Emulator:** `npm run android`
- **Web:** `npm run web`

**Other scripts:** `npm run start` (interactive), `npm run lint`, `npm run validate` (typecheck + test).

---

## Demo user flow (every major feature)

1. **Launch** → Home (or Login if Supabase + no session).
2. **Auth** → Sign out (Settings) → Login → Sign in (any email/password in demo mode).
3. **Home** → Tap “Add property” → Import tab.
4. **Import — Link** → Paste Zillow/Redfin URL → “Import from link” → see alert.
5. **Import — Address** → Type address → “Use address” → see “Address parsed” alert.
6. **Portfolio** → Open tab → “No properties yet” → “Add property” → Import.
7. **Settings** → Sign out → Login again → Sign in.
8. **Web only** → Widen browser; content centered, max width ~560px.

Full checklist: **docs/TESTING_CHECKLIST.md**. Exact commands and troubleshooting: **docs/LAUNCH_AND_TEST.md**.

---

## Known limitations

- Portfolio is empty (no DB persistence yet).
- Import only parses URLs/addresses; no listing fetch.
- Analysis / What-If / Renovation screens not in UI (logic in `src/lib`).
- No RevenueCat/Stripe; no deep-link testing.
- Supabase optional; without it, demo mode (any email/password).
- Path with `&` (e.g. “Example & Holdings”): use `;` in PowerShell instead of `&&`; run from `expo-app` to avoid issues.

No data was lost; all 10 tasks are complete and documented.
