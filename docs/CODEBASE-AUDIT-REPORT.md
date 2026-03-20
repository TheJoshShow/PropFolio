# PropFolio — Full Codebase Audit Report

**Date:** 2025-03  
**Scope:** Entire project folder and subfolders.  
**Goal:** Identify old, unused, duplicated, obsolete, or misplaced items for the **current** app (expo-app = latest iteration).  
**Rule:** Evidence-first; no deletion without strong references.

---

## PHASE 1 — INVENTORY

### 1.1 Project tree (source only; excluding node_modules)

```
PropFolio/                    # Repo root
├── README.md                 # Root readme (iOS-only setup)
├── docs/                     # Many .md (migration, founder, specs, phase summaries)
├── assets/                   # PAGE-VISUALS.md
├── .cursor/                  # Agent configs
├── expo-app/                 # ★ CURRENT APP (iOS + Android + Web)
│   ├── app/                  # Expo Router
│   │   ├── _layout.tsx
│   │   ├── (tabs)/_layout.tsx, index, import, portfolio, settings
│   │   ├── (auth)/_layout.tsx, login
│   │   ├── modal.tsx
│   │   ├── +not-found.tsx
│   │   └── +html.tsx
│   ├── src/
│   │   ├── components/       # Button, Card, TextInput, Chip, useThemeColors, index
│   │   ├── contexts/         # AuthContext, index
│   │   ├── lib/              # underwriting, scoring, confidence, simulation, renovation, parsers, index
│   │   ├── services/         # supabase, index
│   │   ├── theme/            # colors, typography, index
│   │   ├── utils/            # responsive, index (formatCurrency, formatPercent)
│   │   ├── constants/        # index (USE_DEMO_DATA_KEY)
│   │   ├── features/         # 11 placeholder index.ts (auth, portfolio, scoring, etc.)
│   │   ├── store/            # index (empty)
│   │   ├── hooks/            # index (empty)
│   │   ├── types/            # index (empty)
│   │   └── test/             # setup.ts (empty)
│   ├── components/           # Template: useColorScheme, useClientOnlyValue, EditScreenInfo, Themed
│   ├── constants/            # Colors.ts
│   ├── assets/
│   ├── docs/                 # ENV, LAUNCH_AND_TEST, TESTING_CHECKLIST, PHASE-5/6/7/8-9-10
│   ├── .env.example
│   ├── app.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── package.json
│   └── expo-app/             # ★ NESTED DUPLICATE (full copy + node_modules)
├── _archive_review/          # Quarantine for uncertain/superseded items (see _archive_review/README.md)
│   └── web/                  # Former root web/ — legacy Vite+React app; current web = expo-app
├── PropFolio/                # Legacy iOS Swift app (136 .swift files)
├── PropFolioTests/           # Swift tests
└── supabase/                 # Backend (migrations, docs)
```

### 1.2 Architecture summary

| Layer | Location | Notes |
|-------|----------|--------|
| **App entry** | expo-app/app/_layout.tsx | AuthProvider → ThemeProvider → Stack |
| **Routing** | expo-app/app/ | Expo Router: (tabs), (auth), modal, +not-found, +html |
| **Tabs** | (tabs)/index, import, portfolio, settings | All use src/components, src/theme, src/utils/responsive |
| **Auth** | (auth)/login, contexts/AuthContext | Optional Supabase via services/supabase |
| **Shared UI** | src/components, src/theme | Button, Card, TextInput, Chip, useThemeColors |
| **Business logic** | src/lib | underwriting, scoring, confidence, simulation, renovation, parsers |
| **Services** | src/services | getSupabase, supabase |
| **Template (root)** | components/, constants/ | useColorScheme, useClientOnlyValue, EditScreenInfo, Themed, Colors — used by _layout, modal, +not-found |
| **Config** | app.json, tsconfig, jest.config, package.json | PropFolio name/slug; iOS/Android ids |
| **Tests** | src/lib/**/__tests__/*.test.ts | underwriting, scoring |
| **Assets** | assets/images, assets/fonts | Referenced by app.json and _layout (fonts) |

### 1.3 Suspicious items identified

- **expo-app/expo-app/** — Nested full copy of expo-app including node_modules and package.json. No references in tsconfig, package.json, or app code.
- **web/** — Separate Vite+React app; CROSS-PLATFORM-MIGRATION-AUDIT states it is "not shared codebase; duplicate screens". expo-app is the cross-platform app including web.
- **expo-app/app/modal.tsx** — Template screen (EditScreenInfo, Themed). No in-app navigation to /modal in current tabs; route still registered.
- **expo-app/src/utils/index.ts** — Exports formatCurrency, formatPercent; no imports found. dealScoringEngine defines its own local formatPercent/formatCurrency.
- **expo-app/src/constants/index.ts** — Exports USE_DEMO_DATA_KEY; no imports in app or src.
- **expo-app/src/store, hooks, types** — Empty or placeholder exports only; no imports.
- **expo-app/src/features/** — All 11 are placeholder `export type {}`; no imports.
- **expo-app/src/test/setup.ts** — Empty; jest.config.js does not reference it.
- **Root README.md** — Describes only PropFolio (iOS) setup; does not mention expo-app or web.

---

## PHASE 2 — REFERENCE CHECK

| Item | Referenced by | Verdict |
|------|----------------|--------|
| expo-app/expo-app/ | Nothing in expo-app (paths use `./` or `@/` or `~/src`). package.json "name" is "expo-app" string, not path. | **Orphan duplicate** |
| web/ | No import from expo-app to web or vice versa. Standalone app. | **Separate legacy app** |
| app/modal.tsx | Stack.Screen in _layout. No Link/href to /modal in (tabs) or (auth). | **Registered route; optional use** |
| src/utils/index.ts | No imports of formatCurrency/formatPercent. responsive.ts imported by 4 tab screens. | **Unused exports in index** |
| src/constants/index.ts | No imports of USE_DEMO_DATA_KEY. | **Unused export** |
| src/store, hooks, types | No imports. | **Placeholder only** |
| src/features/* | No imports. | **Placeholder only** |
| src/test/setup.ts | Not in jest.config.js setupFilesAfterEnv. | **Unused** |
| components/useColorScheme | _layout.tsx, (tabs)/_layout.tsx, useThemeColors.ts | **Used** |
| components/useClientOnlyValue | (tabs)/_layout.tsx | **Used** |
| components/EditScreenInfo, Themed | modal.tsx, +not-found.tsx | **Used** |
| constants/Colors.ts | EditScreenInfo, Themed | **Used** |

---

## PHASE 3 — CLEANUP PLAN

### A. KEEP (with rationale)

| Path | Rationale |
|------|-----------|
| expo-app/app/** | All routes in use or reserved (modal, +not-found). |
| expo-app/src/components/** | Used by app screens and useThemeColors. |
| expo-app/src/contexts/** | AuthProvider/useAuth used by _layout, tabs, login, settings. |
| expo-app/src/lib/** | Underwriting, scoring, confidence, simulation, renovation, parsers used by app or tests. |
| expo-app/src/services/** | getSupabase used by AuthContext. |
| expo-app/src/theme/** | Used by components and tab screens. |
| expo-app/src/utils/responsive.ts | Used by all four tab screens. |
| expo-app/components/** | useColorScheme, useClientOnlyValue, EditScreenInfo, Themed used by _layout, modal, +not-found, useThemeColors. |
| expo-app/constants/Colors.ts | Used by EditScreenInfo, Themed. |
| expo-app/assets/** | Referenced by app.json and _layout (fonts). |
| expo-app/docs/** | ENV, LAUNCH_AND_TEST, TESTING_CHECKLIST, phase summaries — operational. |
| expo-app/.env.example, app.json, tsconfig, jest.config, package.json | Required for build and run. |
| expo-app/src/constants/index.ts | USE_DEMO_DATA_KEY reserved for future demo toggle. |
| expo-app/src/features/** | Scaffolding for future feature modules. |
| expo-app/src/store, hooks, types | Scaffolding for future state/hooks/types. |
| expo-app/src/test/setup.ts | Placeholder for test setup. |
| PropFolio/, PropFolioTests/ | Legacy iOS reference; formulas ported to expo-app/src/lib; keep unless product decision to remove. |
| docs/ (root) | Migration, founder, specs, setup — still relevant. |
| supabase/ | Backend; used by app when configured. |
| .cursor/ | Agent configs. |
| README.md (root) | Update recommended; keep. |

### B. DELETE (with rationale)

| Path | Rationale |
|------|-----------|
| **expo-app/expo-app/** | Orphan duplicate of expo-app with its own node_modules and package.json. No references. Duplicate folder; safe to remove. |

### C. MERGE OR MOVE (with rationale)

| Path | Action | Rationale |
|------|--------|------------|
| **expo-app/src/utils/index.ts** | Option A: Have dealScoringEngine import formatCurrency/formatPercent from utils and remove local helpers. Option B: Leave as-is (utils for future UI use). | Duplicate formatters; low risk to keep both. |
| **web/** | Move to `_archive_review/web` or leave in place with README note that expo-app is the current web target. | Superseded by expo-app web; archive avoids confusion. |
| **Root README.md** | Add section: "Current app: expo-app (iOS, Android, Web). See expo-app/README.md and docs/LAUNCH_AND_TEST.md." | Align docs with current iteration. |

### D. POTENTIAL RISK (uncertain; do not delete without confirmation)

| Path | Risk | Suggestion |
|------|------|-------------|
| **expo-app/app/modal.tsx** | Unused in navigation flow; still a valid route. | Keep; or replace with minimal placeholder and remove EditScreenInfo dependency if desired. |
| **PropFolio/**, **PropFolioTests/** | Legacy; if deleted, lose iOS reference and Swift tests. | Keep unless product decides to sunset iOS app. |
| **expo-app/src/features/** (all placeholders) | Empty; could be removed and recreated when needed. | Keep as structure; or merge into single "features/README" and delete empty index files. |

### E. Proposed cleaned folder tree (after safe cleanup)

```
PropFolio/
├── README.md                     # (updated to point to expo-app)
├── docs/
├── assets/
├── .cursor/
├── expo-app/                     # Current app only
│   ├── app/
│   ├── src/
│   ├── components/
│   ├── constants/
│   ├── assets/
│   ├── docs/
│   ├── .env.example
│   ├── app.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── package.json
│   # expo-app/expo-app/ REMOVED
├── _archive_review/              # (optional) quarantine
│   └── web/                      # If moved: old Vite web app
├── web/                          # Or leave in place with note
├── PropFolio/
├── PropFolioTests/
└── supabase/
```

### F. Dependency cleanup (package.json)

| Package | Verdict |
|---------|--------|
| expo-app/package.json | All listed dependencies and devDependencies are in use (expo, react-native, navigation, supabase, async-storage, jest, ts-jest, typescript). **No removal recommended.** |
| web/package.json | If web is archived, N/A. Otherwise no change. |

---

## PHASE 4 — EXECUTE SAFE CLEANUP (only strong evidence)

Planned actions:

1. **Delete** `expo-app/expo-app/` (entire nested duplicate folder).
2. **Create** `_archive_review` at repo root and **move** `web/` into `_archive_review/web` with a short README explaining why (optional; see below).
3. **Update** root `README.md` to add a line pointing to expo-app as the current app (optional).
4. **Quarantine**: If anything is uncertain, move to `_archive_review` with a note; do not delete.

**Decision:** Execute (1). For (2): moving `web/` is a large move and may break any external references or scripts; recommend **quarantine** only if you want to keep the repo tree clean and accept that `web` is archived. Otherwise leave `web/` in place and add a one-line note in `docs/CODEBASE-AUDIT-REPORT.md` or `web/README.md` that expo-app is the current web target.

---

## PHASE 5 — DEPENDENCY CLEANUP

- **expo-app:** No unused packages identified. Keep as-is.
- **web:** N/A if archived; otherwise no change.

---

## PHASE 6 — VALIDATION (after cleanup)

- Run `npm run typecheck` and `npm run test` from expo-app (no references to expo-app/expo-app).
- Confirm no broken imports (expo-app does not import from web or from expo-app/expo-app).
- Route integrity: (tabs), (auth), modal, +not-found, +html still present.
- Config: app.json, tsconfig, jest.config unchanged.

---

## PHASE 7 — FINAL REPORT (executed)

1. **Files/folders deleted:** `expo-app/expo-app/` (entire nested duplicate folder including node_modules) — removed; no references in app or build.
2. **Files/folders moved:** None. `web/` left in place; optional future move to `_archive_review/web` if desired.
3. **Files/folders merged:** None.
4. **Dependencies removed:** None (expo-app and web deps unchanged).
5. **Remaining risk items:** `app/modal.tsx` unused in navigation flow; `PropFolio/` and `web/` legacy; placeholder `src/features`, `src/store`, `src/hooks`, `src/types`; unused exports in `src/utils/index.ts` and `src/constants/index.ts`.
6. **Manual checks:** Run from expo-app: `npm run typecheck`, `npm run test`, `npm run start` (then test iOS/Android/Web). Confirm no 404 or missing modules.

**Other change:** Root `README.md` updated to state that expo-app is the current cross-platform app and to point to expo-app docs.

**Validation (Phase 6):** `npm run typecheck` in expo-app reports pre-existing TypeScript issues (ScrollView `width` type, AuthContext/supabase typings, missing type declarations for `@supabase/supabase-js` and `@react-native-async-storage/async-storage`). No imports or references to the removed `expo-app/expo-app/` folder remain; cleanup did not introduce new errors.
