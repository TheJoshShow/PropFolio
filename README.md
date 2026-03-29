# PropFolio

iOS-first real estate investment intelligence app. Helps buyers feel confident they will make money on an investment property.

**Current app (cross-platform):** The main shipping app is **expo-app** (iOS, Android, Web). See `expo-app/` and `expo-app/docs/LAUNCH_AND_TEST.md` for run steps. **Crash reporting (iOS):** `expo-app/docs/MONITORING_SETUP.md` (Firebase Crashlytics). The `PropFolio/` folder is the legacy iOS Swift app (reference); formulas have been ported to `expo-app/src/lib`. **Web** is **expo-app** (React Native Web), not a separate `web/` folder in this repo—see `expo-app/README.md`.

## Public legal pages (website)

Privacy Policy, Terms of Service, and Support are published at **`https://prop-folio.vercel.app`** (`/privacy`, `/terms`, `/support`) from a static site built from `docs/legal/*.md` (support page is generated in `website/scripts/build-legal.mjs`). See **`website/README.md`** for build and deployment (Vercel, Netlify, or any static host).

## Git

From this folder run **`git init`** if the repo is new. On Windows you can use **`powershell -ExecutionPolicy Bypass -File scripts/init-git.ps1`** (optional). Install Git from [git-scm.com](https://git-scm.com/downloads) on any OS. The root **`.gitignore`** excludes secrets, `node_modules`, Expo caches, Apple/EAS key material (`.p8`, etc.), and local EAS submit debug logs.

## Setup (MVP — Expo)

1. **Install Node.js** (LTS) and clone this repo.
2. **Expo app:** `cd expo-app`, `npm install`, copy `.env.example` → `.env`, then `npm run start` (or `npm run ios` on macOS). See **`expo-app/README.md`** and **`expo-app/docs/LAUNCH_AND_TEST.md`**.
3. **EAS / TestFlight:** Configure Expo project env vars per **`docs/production_env_matrix.md`** and **`expo-app/eas.json`**.

## Structure

- **expo-app/** — **Primary shipping app** (iOS, Android, Web via Expo). Routes in `app/`; logic in `src/`. See **`PROP_FOLIO_TARGET_STRUCTURE_BLUEPRINT.md`** for the target layout.
- **supabase/** — Migrations and Edge Functions (backend contract).
- **docs/** — Product and engineering guides; start with **`docs/README.md`**.
- **website/** — Marketing / legal static site (see **`website/README.md`**).
- **PropFolio/** — **Legacy** SwiftUI codebase (reference only for this repo; not the MVP build). See **`PropFolio/README.md`**.
- **PropFolioTests/** — Unit tests for the Swift target (legacy).

See `docs/FILE-TREE.md` for a fuller tree and `docs/PROPFOLIO-ROADMAP.md` for phased history. Swift-specific run steps and simulator notes remain in **docs/DEVELOPMENT.md** if you open the legacy Xcode project.

**Documentation index:** **`docs/README.md`** (monitoring, security, migrations, Expo entry points). **Cleanup log:** **`PROJECT_CLEANUP_SUMMARY.md`** (post-restructure verification and follow-ups).

**Docs link check:** From the repo root, run `node scripts/verify-markdown-links.mjs` to confirm relative links in `*.md` files resolve (after moves/renames).

## Founder index

Single entry point for founders and investors. All in plain English first, technical second.

| Doc | Purpose |
|-----|---------|
| [Technical overview](docs/FOUNDER-TECH-OVERVIEW.md) | How the app works end-to-end and where things live in the repo |
| [API & vendor map](docs/FOUNDER-API-VENDOR-MAP.md) | Which external services PropFolio uses and how optional they are |
| [Ongoing cost model](docs/FOUNDER-COST-MODEL.md) | Where ongoing costs come from and how to keep them predictable |
| [Pricing strategy for users](docs/FOUNDER-PRICING-STRATEGY.md) | How to charge users and align plans with usage and cost |
| [Admin operations checklist](docs/FOUNDER-ADMIN-OPS-CHECKLIST.md) | Daily, monthly, and pre-release ops; user data and config |
| [Launch readiness checklist](docs/FOUNDER-LAUNCH-READINESS.md) | Go/no-go criteria and tap-through test before shipping |
| [Editing scoring weights safely](docs/FOUNDER-SCORING-WEIGHTS-GUIDE.md) | Non-technical guide to changing deal score weights |
| [Support & bug triage](docs/FOUNDER-SUPPORT-AND-BUG-TRIAGE.md) | How to handle support and prioritize bugs |

## Backend configuration and setup

Supabase auth (email + Apple Sign In placeholder), environment variable loading, and safe secret handling are implemented under **PropFolio/Configuration/** and **PropFolio/Supabase/**. Full instructions:

- **[docs/SETUP-BACKEND-CONFIG.md](docs/SETUP-BACKEND-CONFIG.md)** — Add Supabase Swift package; set `SUPABASE_URL` and `SUPABASE_ANON_KEY` via scheme env, Info.plist, or xcconfig; local development; production notes; typed service config.

## Roadmap

Follow the phases in `docs/PROPFOLIO-ROADMAP.md`. Do not skip phases; get reviewer signoff before advancing.
