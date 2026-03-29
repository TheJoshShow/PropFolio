# PropFolio — Target project structure blueprint

This document is for **founders and developers** who want the repo to **match the current MVP** (iOS-first Expo app) and stay **easy to navigate** as you add web/Android later.

It describes:

1. An **ideal target layout** (optimized for PropFolio today, not enterprise theory).
2. How the **real repo compares** today.
3. What to **keep, move, merge, archive, or delete** over time.
4. **Safe cleanup order** — *no mass deletions are prescribed here*; verify each step in git.

**Important:** The **shipping app** for MVP is **`expo-app/`** (Expo + React Native). The repo also contains **`PropFolio/`** (native Swift), **`website/`**, **`supabase/`**, and many docs — that is normal for a transitioning codebase, but it can confuse newcomers until names and docs explain the split.

---

## Part A — Recommended target structure (MVP)

Below is the **target** for the **Expo client** (`expo-app/`). Expo Router **requires** file-based routes under `app/`; do not “move screens to `src/screens/`” without adopting a different router — the blueprint keeps routes in `app/` and puts logic in `src/`.

```
PropFolio/                          ← repo root
├── README.md                       ← “Start here”: which app is MVP, where docs live
├── AUTH_MVP_SIMPLIFICATION_SUMMARY.md
├── PROP_FOLIO_TARGET_STRUCTURE_BLUEPRINT.md   ← this file
│
├── expo-app/                       ← PRIMARY MVP APPLICATION
│   ├── app/                        ← Routes only (Expo Router). Thin screens; compose hooks + features.
│   │   ├── _layout.tsx
│   │   ├── (auth)/                 ← Welcome, login, sign-up, forgot password
│   │   ├── (tabs)/                 ← Main shell: home, import, portfolio, settings
│   │   ├── auth/callback.tsx       ← Deep link completion (email confirm / reset)
│   │   ├── paywall.tsx
│   │   ├── update-password.tsx
│   │   └── …
│   ├── app.config.ts
│   ├── eas.json
│   ├── package.json
│   ├── assets/                     ← Images, fonts (committed)
│   ├── docs/                       ← App-specific technical docs only
│   ├── scripts/                    ← If needed; or use repo-root scripts/
│   └── src/
│       ├── components/             ← Shared UI: Button, TextInput, theme hooks — reusable across features
│       ├── config/                 ← Env validation, runtime config, billing IDs, legal URL defaults
│       ├── constants/              ← App-wide constants (not business rules)
│       ├── contexts/               ← React context providers (auth, subscription, import resume)
│       ├── features/               ← One folder per product area; feature UI + feature hooks colocated
│       │   ├── paywall/
│       │   ├── portfolio/
│       │   ├── property-import/
│       │   ├── property-analysis/  ← Detail analysis, what-if, scoring UI glue if screen-specific
│       │   ├── settings/
│       │   └── subscriptions/    ← Entitlement policy (+ paywall-related rules); SDK I/O stays in services/
│       ├── hooks/                  ← Cross-feature hooks (import execution, portfolio list, paywall state)
│       ├── lib/                    ← Pure logic: scoring engine, underwriting, parsers, simulation — unit-tested
│       ├── services/             ← I/O: Supabase client, edge invoke, RevenueCat, analytics, monitoring
│       ├── theme/                  ← Design tokens (colors, type, shadows)
│       ├── types/                  ← Shared TS types exported from one place
│       ├── utils/                  ← Small generic helpers (auth redirect parse, phone, openLink)
│       ├── startup/                ← Boot / telemetry wiring (optional; could live under services/)
│       └── **tests**               ← Co-located __tests__ next to modules (current pattern is fine)
│
├── supabase/                       ← Migrations + Edge Functions (backend contract)
│   ├── migrations/
│   ├── functions/
│   └── docs/
│
├── docs/                           ← Repo-wide product & engineering docs (single index README optional)
├── app_store_release/              ← Store metadata, review notes
├── founder_docs/                   ← Founder-facing checklists (or merge into docs/founder/)
├── website/                        ← Marketing/legal static site if applicable
├── scripts/                        ← Repo automation (verify env, etc.)
│
├── PropFolio/                      ← LEGACY / PARALLEL: Swift iOS app (document status in root README)
└── PropFolioTests/
```

### What belongs in each folder (and what does not)

| Folder | Belongs | Does **not** belong | Common mistakes |
|--------|---------|---------------------|-----------------|
| **`expo-app/app/`** | Route files, layouts, navigation params, thin composition | Heavy business logic, API calls, scoring math | Putting 500-line screens here — extract to `features/` or `hooks/` |
| **`expo-app/src/components/`** | Design-system pieces used in **2+** features | Screens, feature-only sections | Dumping one-off UI here — use `features/x/components/` |
| **`expo-app/src/features/`** | Feature modules: paywall content, import orchestration entrypoints, analysis UI tied to property detail | Generic `Button`, global `supabase.ts` | A `misc` or `experimental` folder — use a dated archive doc instead |
| **`expo-app/src/lib/`** | Deterministic domain logic (scoring, underwriting, parsers) with tests | React hooks, `fetch` to your API | Mixing UI strings with engine — keep copy in modules or `*Copy.ts` next to engine |
| **`expo-app/src/services/`** | Network clients, Supabase singleton, RevenueCat, Crashlytics, edge `invoke` | Score formulas | Duplicating `lib` math “for convenience” |
| **`expo-app/src/config/`** | Reading `EXPO_PUBLIC_*`, EAS-facing config, billing product IDs | Import pipeline steps | Secrets — server secrets stay in Supabase Edge |
| **`expo-app/src/utils/`** | Pure helpers reused widely | Feature-specific workflows | Second copy of the same helper under `lib/` and `utils/` |
| **`expo-app/src/contexts/`** | Global providers only | One-screen state | Too many contexts — merge related state |
| **`expo-app/src/hooks/`** | Hooks used across routes/features | One-off hook only used in one file — colocate | Empty `hooks/index.ts` exports that confuse |
| **`expo-app/assets/`** | Fonts, images, static media | TS/TSX | Generated build artifacts |
| **`supabase/`** | SQL migrations, Edge Functions, backend README | React components | Client env files |
| **`docs/`** | Cross-cutting guides, API keys doc, architecture | Day-to-day Expo-only noise duplicated in 10 places | Every audit ever — consolidate or archive |

---

## Part B — “Current vs target” gap analysis (this repository)

### B.1 What already matches the blueprint well

- **`expo-app/app/`** — Auth groups, tabs, paywall, update-password, auth callback: **good route split**.
- **`expo-app/src/services/`** — Supabase, edge functions, portfolio, import messaging, monitoring: **good “I/O layer.”**
- **`expo-app/src/lib/`** — Scoring, underwriting, parsers, property analysis builders: **good “pure logic” home.**
- **`expo-app/src/config/`** — Runtime env, billing, legal URLs: **correct separation.**
- **`expo-app/src/theme/`** — Tokens: **cohesive.**
- **`supabase/`** — Migrations + functions: **clear backend boundary.**

### B.2 Duplication or confusion to resolve over time

| Issue | What we see today | Target direction |
|--------|-------------------|------------------|
| **Two mobile codebases** | `expo-app/` (Expo) and `PropFolio/` (Swift) | Root **README** should state which is MVP. Swift either **archived**, **clearly labeled legacy**, or linked as “future native.” |
| **Subscription logic split** | ~~`src/subscription/`~~ **removed**; entitlement policy lives in `src/features/subscriptions/` | **Done:** `entitlementPolicy` + tests colocated; import via `features/subscriptions` (barrel exports `isEntitlementBootstrapPending`). |
| **Paywall vs subscriptions** | `features/paywall/` + `features/subscriptions/` | Fine if roles are clear: *paywall = UI/offerings*, *subscriptions = entitlement rules*. Document in README under `features/`. |
| **Property analysis vs lib** | Large `features/property-analysis/` and `lib/propertyAnalysis/` | Keep **engines in `lib/`**, **screen glue + types** in `features/property-analysis/`; avoid copying formulas in both. |
| **Empty / stale folders** | ~~`expo-app/src/features/auth/`~~, ~~`expo-app/src/dev/`~~ | **Done:** removed (empty). |
| **Many markdown files at repo root** | ~~`MIGRATION_*`, `secrets_audit.md`, `env_matrix.md`, `CRASHLYTICS_*`~~ | **Done:** `docs/monitoring/`, `docs/security/`, `docs/archive/migrations/`, `docs/release/` (+ **`docs/README.md`** index). |
| **Many markdown files under `expo-app/` root** | ~~`final_ios_*`, `release_blocker_report.md`, compliance matrices~~ | **Done:** `expo-app/docs/archive/ios-audit/`, `expo-app/docs/compliance/`; **`expo-app/docs/RELEASE_CHECKLIST.md`** (single canonical copy). |
| **`website/`** | Static site | Keep; document relationship to legal URLs in `config/legalUrls.ts`. |

### B.3 Files/folders that are “out of place” (candidates for move/archive)

*Do not delete without review; these are **organization** candidates.*

**Repo root (clutter for a novice):** **Done** — see `docs/monitoring/`, `docs/security/`, `docs/archive/migrations/`, `docs/release/`.

**`expo-app/` root (should mostly be config + README):** **Done** — audits under `expo-app/docs/archive/ios-audit/`, compliance under `expo-app/docs/compliance/`, release checklist at `expo-app/docs/RELEASE_CHECKLIST.md`.

**Empty directories:** **Done** — removed `expo-app/src/features/auth/`, `expo-app/src/dev/`.

---

## Part C — Cleanup / migration plan (safest order)

1. **Document, don’t move code yet**  
   - Update **root `README.md`**: “MVP app = `expo-app`”; link to `AUTH_MVP_SIMPLIFICATION_SUMMARY.md` and this blueprint.

2. **Trivial hygiene**  
   - **Done:** empty **`features/auth`** and **`src/dev`** removed; run **`npm run validate`** in `expo-app/` after future moves.

3. **Docs consolidation (low risk)**  
   - **Done:** `docs/monitoring/`, `docs/security/`, `docs/archive/migrations/`, moved root + `expo-app/` audit markdown; cross-links updated; **`docs/README.md`** added.

4. **Clarify subscription folders**  
   - **Done:** canonical path is **`src/features/subscriptions/`** (entitlement policy + barrel export).

5. **Swift `PropFolio/` decision**  
   - **`PropFolio/README.md`** added: legacy Swift tree; MVP builds use **`expo-app/`**.  
   - Long-term: archive to branch or `legacy/ios-swift/` *only* after team agreement (not automatic).

6. **Feature/module refactors (higher risk)**  
   - Split oversized route files under `app/(tabs)/` into `features/*` + `hooks/*` incrementally — one screen per PR.

7. **Never in one giant PR**  
   - Mixing doc moves + refactors + deletes causes painful review and revert.

---

## Part D — Naming recommendations

| Current | Recommendation |
|---------|------------------|
| `features/property-analysis` | Keep; optionally alias in docs as “Property detail & analysis” |
| `lib/propertyAnalysis` vs `features/property-analysis` | Keep split; naming is OK if **README** explains “lib = engines, features = product module” |
| `subscription` vs `subscriptions` | Standardize on **one** pluralization for the package path |
| Scattered `*_report.md`, `*_audit.md` | Prefix with date or move under `docs/archive/2025-03/` |
| `founder_docs/` vs `docs/` | Merge into `docs/founder/` **or** add index in root README |

---

## Part E — Where specific kinds of code should live

| Kind | Recommended location in this repo |
|------|-----------------------------------|
| **Auth logic (session, sign-in, deep link completion)** | `expo-app/src/contexts/AuthContext.tsx` + `expo-app/src/utils/authRedirect.ts` + `expo-app/src/utils/authErrors.ts` |
| **Auth screens** | `expo-app/app/(auth)/*` (routes only) |
| **Property import (orchestration, limits, messages)** | `expo-app/src/services/*` + `expo-app/src/hooks/useExecutePropertyImport.ts` + `expo-app/src/features/property-import/` |
| **Listing URL parsing** | `expo-app/src/lib/parsers/` |
| **Scoring engine (deterministic)** | `expo-app/src/lib/scoring/` |
| **Underwriting / debt / cash flow math** | `expo-app/src/lib/underwriting/` |
| **Confidence meter (deterministic)** | `expo-app/src/lib/confidence/` |
| **What-if / scenarios** | `expo-app/src/lib/simulation/` + overrides in `expo-app/src/services/propertyWhatIfOverrides.ts` (consider moving overrides next to feature later) |
| **Property detail analysis assembly** | `expo-app/src/lib/propertyAnalysis/` + `expo-app/src/features/property-analysis/` for screen-oriented orchestration |
| **Subscriptions / paywall** | RevenueCat + offerings: `expo-app/src/services/revenueCat.ts`, `contexts/SubscriptionContext.tsx`, `features/paywall/`, entitlement rules in **`features/subscriptions/`** (e.g. `entitlementPolicy.ts`) |
| **API clients / Edge invoke** | `expo-app/src/services/edgeFunctions.ts` (+ small response helpers) |
| **Supabase client singleton** | `expo-app/src/services/supabase.ts` |
| **Screen-specific components** | Next to screen under `features/<feature>/` or colocated `components/` under that feature |
| **Shared design system** | `expo-app/src/components/` + `expo-app/src/theme/` |
| **Legal / open external docs** | `expo-app/src/utils/openLink.ts` + URLs from `expo-app/src/config/legalUrls.ts`; marketing copy may live on `website/` |
| **Settings / support actions** | `expo-app/app/(tabs)/settings.tsx` + small helpers in `utils/` or `features/settings/` |
| **Environment / config access** | `expo-app/src/config/runtimeConfig.ts`, `env.ts` — do not scatter `process.env` reads |
| **Types / models** | `expo-app/src/types/index.ts` and colocated `types.ts` next to a feature when only used there |

---

## Part F — Cleanup rules (going forward)

1. **New feature?** Add a folder under `src/features/<name>/` before dropping files in `utils/` or `components/`.
2. **New API integration?** Add or extend `src/services/` — not `lib/` (unless it’s pure parsing of responses with no I/O).
3. **New formula or score?** Add under `src/lib/<domain>/` + **unit test** next to it.
4. **New screen?** Add route under `app/`; keep the file **short**; call hooks and feature modules.
5. **One-off experiment?** Use a branch or `docs/experiments/<topic>.md` — don’t create `src/experimental/` permanently.
6. **Audits and postmortems?** `docs/archive/<YYYY-MM>/` — not repo root after the week they’re written.

---

## Part G — Naming rules (short)

- **Folders:** lowercase-with-hyphens (`property-import`) *or* camelCase — **pick one**; this repo mostly uses **hyphens** in `features/`.
- **Files:** `PascalCase` for React components, `camelCase` for hooks and utils, `kebab-case` acceptable for route files (Expo Router).
- **Avoid:** `misc`, `temp`, `old`, `backup` in `src/` — use git history instead.

---

## Part H — Examples: what to move vs delete (later, with review)

| Item | Suggested action |
|------|------------------|
| Root `*_AUDIT*.md`, `*_REPORT*.md` from 2024 trials | **Move** to `docs/archive/` |
| Duplicate checklists (`RELEASE_CHECKLIST` in two places) | **Merge** to one path; grep for links |
| Empty `src/features/auth/` | **Done** — folder removed |
| Empty `src/dev/` | **Done** — folder removed |
| Swift `PropFolio/` if team abandons | **Archive** (separate repo or `legacy/` branch) — **not** automatic |

**Do not delete** without backup: `supabase/migrations`, `eas.json`, `app.config.ts`, production env docs.

---

## Part I — Expo / EAS / TestFlight compatibility note

- **Do not rename** `expo-app/app/` to `screens/` without changing the router — Expo Router expects `app/`.
- **`app.config.ts`**, **`eas.json`**, **`package.json`** should stay at **`expo-app/`** root.
- **Assets** referenced from config must stay where `app.config.ts` points (e.g. `./assets/...`).

---

## Summary

- **Target:** Thin **`app/`** routes, thick **`src/features`** + **`src/lib`** + **`src/services`**, one place for **config**, shared **components** for reuse.
- **Today:** Structure is **already close**; the biggest wins are **documentation**, **markdown housekeeping**, **resolving subscription folder duplication**, and **labeling the Swift tree** so newcomers aren’t lost.
- **Next step:** Root **README** + optional **docs/README** + trivial **empty folder** cleanup — then incremental doc moves and subscription import-path unification.

*This blueprint is based on the actual repository layout surveyed in development; re-run a quick `tree` or folder audit after major refactors.*
