# PropFolio — Cross-Platform App (Expo)

Single codebase for **iOS**, **Android**, and **Web**. Built with Expo, Expo Router, and TypeScript.

## Structure

- **`app/`** — Expo Router routes (tabs, stacks, modals).
- **`src/`** — Shared source:
  - **`src/lib`** — Business logic (underwriting, scoring, confidence, simulation, renovation). All formulas live here.
  - **`src/features`** — Feature modules (auth, property-import, portfolio, etc.).
  - **`src/components`** — Reusable UI (design system).
  - **`src/services`** — API and platform services (Supabase, adapters).
  - **`src/theme`** — Design tokens (spacing, radius, colors).
  - **`src/store`** — Global state.
  - **`src/hooks`** — Shared hooks.
  - **`src/types`** — Shared types.
  - **`src/utils`** — Formatting and helpers.
  - **`src/test`** — Test setup and utilities.
- **`assets/`** — Images, fonts.

## Run

From the `expo-app` directory:

```bash
npm install
npm run start      # Dev server (choose iOS / Android / Web)
npm run ios        # iOS simulator (macOS only)
npm run android    # Android emulator
npm run web        # Web browser
npm run typecheck  # TypeScript check
npm run test       # Unit tests (lib)
npm run expo:config       # Resolved Expo config (preferred on Windows paths with spaces)
npm run expo:config:json  # JSON output (handy for CI / EAS debugging)
```

On Windows, if the project path contains spaces, `npx expo config` may fail to launch Node; use the scripts above instead.

## Environment

All env vars are **optional**. Without them the app runs in demo mode. See **[docs/ENV.md](docs/ENV.md)** for the full list and setup.

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (optional)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (optional)

Copy `.env.example` to `.env` and fill in values if using Supabase.

## Testing and launch

- **[LAUNCH_AND_TEST.md](docs/LAUNCH_AND_TEST.md)** — Exact commands, order, and demo flow for iOS, Android, and web.
- **[TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md)** — Feature-by-feature checklist for manual QA.

Quick validation before running the app:

```bash
npm run typecheck
npm run test
# or
npm run validate
```

## Migration

This app is the target of the PropFolio iOS → cross-platform migration. See `docs/CROSS-PLATFORM-MIGRATION-AUDIT.md` for the full plan.
