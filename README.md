# PropFolio

iOS-first real estate investment intelligence app. Helps buyers feel confident they will make money on an investment property.

**Current app (cross-platform):** The main shipping app is **expo-app** (iOS, Android, Web). See `expo-app/` and `expo-app/docs/LAUNCH_AND_TEST.md` for run steps. **Crash reporting (iOS):** `expo-app/docs/MONITORING_SETUP.md` (Firebase Crashlytics). The `PropFolio/` folder is the legacy iOS Swift app (reference); formulas have been ported to `expo-app/src/lib`. **Web** is **expo-app** (React Native Web), not a separate `web/` folder in this repo—see `expo-app/README.md`.

## Public legal pages (website)

Privacy Policy and Terms of Service for **propfolio.app** (`/privacy`, `/terms`) are built as a static site from `docs/legal/*.md`. See **`website/README.md`** for build and deployment (Vercel, Netlify, or any static host).

## Git

From this folder run **`git init`** if the repo is new. On Windows you can use **`powershell -ExecutionPolicy Bypass -File scripts/init-git.ps1`** (optional). Install Git from [git-scm.com](https://git-scm.com/downloads) on any OS. The root **`.gitignore`** excludes secrets, `node_modules`, Expo caches, Apple/EAS key material (`.p8`, etc.), and local EAS submit debug logs.

## Setup

1. **Xcode:** Create a new iOS App project (SwiftUI, minimum iOS 17). Name the app target `PropFolio` and the test target `PropFolioTests`.
2. **Replace default files:** Remove Xcode’s default `ContentView` and point the app entry to the existing `PropFolio/App/PropFolioApp.swift`. Add all folders under `PropFolio/` and `PropFolioTests/` to the correct targets.
3. **Run:** Build and run on Simulator (e.g. iPhone 15). You should see “PropFolio” as the root view until Phase 1 is complete.

## Structure

- **PropFolio/** — SwiftUI app (App, Configuration, Models, Engine, Services, ViewModels, Screens, Components, DesignSystem, Extensions, Resources, Supabase).
- **PropFolioTests/** — Unit tests, Mocks, Helpers.
- **supabase/** — Backend migrations and Edge Functions (used from Phase 7).
- **docs/** — Roadmap, phase status, and **backend config setup** (see below).

See `docs/FILE-TREE.md` for the full file tree and `docs/PROPFOLIO-ROADMAP.md` for the build phases. For detailed run steps, simulator choice, demo data, and a full test checklist, see **docs/DEVELOPMENT.md**.

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
