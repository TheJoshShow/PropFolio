# PropFolio — Cleanup & Post-Cleanup Verification Summary

**Date:** 2025-03  
**Scope:** What was removed, archived, merged; verification results; what still needs manual review; final QA checklist.

---

## 1. What was removed

| Item | Rationale |
|------|------------|
| **expo-app/expo-app/** | Orphan duplicate of the full expo-app (including its own node_modules). No references in tsconfig, package.json, or app code. Removed during cleanup; re-removed during post-cleanup verification if it had reappeared. |

**No other files or folders were deleted.** Only items with strong evidence of being unused were removed.

---

## 2. What was archived (quarantine)

| Item | Rationale |
|------|------------|
| **web/** → **_archive_review/web/** | Legacy Vite+React app; duplicate screens and demo data relative to expo-app (React Native Web). expo-app does not import from web. Quarantined instead of deleted so it can be restored or compared. See `_archive_review/README.md`. |

---

## 3. What was merged or moved

- **No files were merged.**
- **No files were moved** other than `web/` → `_archive_review/web/`.
- **Doc updates:** Root `README.md` updated to point to expo-app as the current app and to note the archive. `docs/CODEBASE-AUDIT-REPORT.md` and `docs/CROSS-PLATFORM-MIGRATION-AUDIT.md` updated to reflect web’s new location.

---

## 4. Post-cleanup verification (what was checked)

| Check | Result |
|-------|--------|
| **Broken imports** | None. expo-app uses only `@/`, `~/`, and relative paths; no references to `web/` or `expo-app/expo-app/`. |
| **Broken exports** | None. `src/components`, `contexts`, `lib`, `services`, `theme`, `utils` index files export only existing symbols. |
| **Dead routes** | None. All routes in `app/` are registered in `_layout.tsx`: (tabs), (auth), modal, +not-found, +html. Navigation uses `router.push`/`replace` and `Link href="/"` only to valid routes. |
| **Duplicate files** | No remaining duplicates. Nested `expo-app/expo-app/` removed. |
| **Asset paths** | All referenced assets exist: `app.json` (icon, splash, android icons, favicon) and `_layout.tsx` (SpaceMono font) point to files under `expo-app/assets/`. |
| **Environment config** | `.env.example` documents `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; `supabase.ts` reads the same. Optional; app runs in demo mode when unset. |
| **iOS / Android / web config** | `app.json` has consistent `name`, `slug`, `scheme`; iOS `bundleIdentifier` and Android `package` both `com.propfolio.app`; web `bundler: "metro"`, `output: "static"`. No mismatch found. |
| **Scripts** | All `package.json` scripts are valid and in use: start, ios, android, web, test, typecheck, lint, validate. |
| **Jest** | `jest.config.js` roots and moduleNameMapper match `src/` and `~/*`; tests run: 2 suites, 8 tests passed. |

---

## 5. Fixes applied during verification

| Issue | Fix |
|-------|-----|
| **ScrollView contentContainerStyle type error** | In `src/utils/responsive.ts`, typed `width: '100%'` as `DimensionValue` so it satisfies React Native `ViewStyle`. |
| **AuthContext implicit any** | In `src/contexts/AuthContext.tsx`, introduced a local `AuthSession` interface and typed `getSession` / `onAuthStateChange` callbacks so no implicit `any`. Avoids depending on `@supabase/supabase-js` types in this file when modules are missing. |

---

## 6. What still needs manual review

| Item | Notes |
|------|--------|
| **TypeScript “cannot find module”** | If `npm run typecheck` reports missing `@supabase/supabase-js` or `@react-native-async-storage/async-storage`, run `npm install` in `expo-app`. Those packages ship types; once installed, typecheck should pass. |
| **expo-app/expo-app/** | If this folder reappears (e.g. from a template or copy), remove it again; it is an unused duplicate. |
| **Unused exports** | `src/utils/index.ts` exports `formatCurrency` and `formatPercent` (not imported elsewhere). `src/constants/index.ts` exports `USE_DEMO_DATA_KEY` (not imported). Safe to keep for future use or remove when consolidating. |
| **Placeholder modules** | `src/features/*`, `src/store`, `src/hooks`, `src/types`, `src/test/setup.ts` are empty or placeholder. Kept as scaffolding; optional to trim later. |
| **modal route** | `app/modal.tsx` is registered but has no in-app link. Optional to add a link or simplify the screen. |
| **Dependencies** | No unused dependencies were removed. All listed deps are used or are transitive/runtime (e.g. expo, react-native, navigation, supabase, async-storage). |

---

## 7. Removed dependencies

**None.** No packages were removed from `package.json`. Cleanup and verification did not change dependencies.

---

## 8. Final manual QA checklist

Use this to confirm the app still works after cleanup.

### Setup

- [ ] From repo root: `cd expo-app && npm install`
- [ ] Ensure no `expo-app/expo-app` folder exists; if it does, delete it.

### Build & typecheck

- [ ] `cd expo-app && npm run typecheck` — passes after `npm install` (or only reports the two module-not-found errors above until install).
- [ ] `cd expo-app && npm run test` — all tests pass (e.g. 2 suites, 8 tests).

### Run the app

- [ ] `cd expo-app && npm run start` — dev server starts.
- [ ] **iOS:** Run on simulator (e.g. `npm run ios` or press `i`). App loads; tabs (Home, Import, Portfolio, Settings) work; login/settings sign-out works.
- [ ] **Android:** Run on emulator (e.g. `npm run android` or press `a`). Same flows as iOS.
- [ ] **Web:** Run in browser (e.g. `npm run web` or press `w`). Same flows; no 404 or missing assets.

### Navigation & routes

- [ ] Home → “Add property” → Import tab.
- [ ] Import tab: paste link / address; no crash.
- [ ] Portfolio and Settings tabs open.
- [ ] If not signed in, redirect to (auth)/login; after sign-in, redirect to (tabs).
- [ ] Visit `/modal` directly (if desired); modal screen loads.
- [ ] Visit an unknown path; +not-found (or fallback) shows; “Go home” returns to “/”.

### Environment (optional)

- [ ] With no `.env`: app runs in demo mode (no Supabase).
- [ ] With `.env` containing valid `EXPO_PUBLIC_SUPABASE_*`: sign-in/sign-out and session persist as expected.

### Archived app (optional)

- [ ] To run legacy web app: `cd _archive_review/web && npm install && npm run dev`.
- [ ] To restore to root: move `_archive_review/web` back to `web/`.

---

**Summary:** Cleanup removed only the nested duplicate `expo-app/expo-app/` and archived the legacy `web/` app. Verification found no broken imports, exports, or routes; asset and env config are consistent; ScrollView and AuthContext type issues were fixed. Remaining follow-ups are optional (unused exports, placeholders, modal link) or environment-related (npm install for typecheck). Use the checklist above to confirm the app on iOS, Android, and web.
