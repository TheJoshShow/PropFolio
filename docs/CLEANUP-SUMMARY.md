# PropFolio — Cleanup Summary (short)

**Date:** 2025-03  
**Full report:** See **docs/CLEANUP_SUMMARY.md** for post-cleanup verification, fixes applied, and the final manual QA checklist.  
**Rules applied:** Delete only with strong evidence; quarantine uncertain items to `_archive_review`; keep app runnable on all platforms; update imports/exports as needed; remove unused deps only when safe.

---

## 1. Final folder tree (after cleanup)

```
PropFolio/
├── README.md
├── docs/
│   ├── CODEBASE-AUDIT-REPORT.md
│   ├── CLEANUP-SUMMARY.md          (this file)
│   ├── CROSS-PLATFORM-MIGRATION-AUDIT.md
│   ├── ... (other docs)
├── assets/
├── .cursor/
├── _archive_review/
│   ├── README.md                   (explains why items are here)
│   └── web/                        (legacy Vite+React app; current web = expo-app)
├── expo-app/                       ★ CURRENT APP (iOS, Android, Web)
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── (tabs)/ _layout, index, import, portfolio, settings
│   │   ├── (auth)/ _layout, login
│   │   ├── modal.tsx, +not-found.tsx, +html.tsx
│   ├── src/
│   │   ├── components/, contexts/, lib/, services/, theme/, utils/, constants/
│   │   ├── features/, store/, hooks/, types/, test/
│   ├── components/, constants/, assets/, docs/
│   ├── .env.example, app.json, tsconfig.json, jest.config.js, package.json
├── PropFolio/                      (legacy iOS Swift app — reference)
├── PropFolioTests/
└── supabase/
```

---

## 2. Deleted items

| Item | Rationale |
|------|-----------|
| **expo-app/expo-app/** | Orphan duplicate of the entire expo-app (including node_modules). No references in tsconfig, package.json, or app code. Deleted in prior cleanup step. |

No additional files or folders were deleted in this pass (only quarantine moves).

---

## 3. Archived items (moved to _archive_review)

| Item | Rationale |
|------|-----------|
| **web/** → **_archive_review/web/** | Legacy Vite+React app; duplicate of screens now in expo-app (React Native Web). expo-app does not import from web. Uncertain whether to delete; quarantined so the app can be restored or compared if needed. |

---

## 4. Removed dependencies

**None.** expo-app and (archived) web package.json were left unchanged. No unused dependencies were removed.

---

## 5. What you should manually verify

1. **expo-app runs**
   - From repo root: `cd expo-app && npm install && npm run start`
   - Test iOS simulator, Android emulator, and web (Expo’s web target).

2. **No broken imports**
   - expo-app does not reference `web/` or `expo-app/expo-app/`; no import updates were required.

3. **Routes**
   - Tabs (Home, Import, Portfolio, Settings), (auth)/login, modal, +not-found should all resolve.

4. **Typecheck / tests** (pre-existing issues may remain)
   - `cd expo-app && npm run typecheck`
   - `cd expo-app && npm run test`

5. **Legacy web app (optional)**
   - To run the archived web app: `cd _archive_review/web && npm install && npm run dev`
   - To restore to root: move `_archive_review/web` back to `web/`.

6. **Docs**
   - `docs/CODEBASE-AUDIT-REPORT.md` and `docs/CROSS-PLATFORM-MIGRATION-AUDIT.md` were updated to reflect web’s move to `_archive_review/web`. Root `README.md` notes the archive.
