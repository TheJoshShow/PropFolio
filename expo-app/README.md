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
  - **`src/config`** — **Single entry `src/config/index.ts`:** all `EXPO_PUBLIC_*` reads go through `getRuntimeConfig()` (see `runtimeConfig.ts`). Do not scatter `process.env` in feature code.
  - **`src/startup`** — Boot telemetry helpers (e.g. `startupTelemetry.ts`).
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
npm run typecheck  # TypeScript check
npm run test       # Unit tests (lib)
npm run expo:config       # Resolved Expo config
npm run expo:config:json  # JSON (CI / EAS / debugging)
```

### Expo CLI on Windows (paths with `&`, spaces, or OneDrive)

Do **not** rely on `npx expo …` from this folder if your path contains **`&`** (e.g. `Realty & Holdings`). Some shells split on `&`, which breaks the command and can make `npx` resolve the wrong `expo` binary (`Cannot find module ...\expo\bin\cli`).

**Use npm scripts** (they always invoke the local CLI via `node node_modules/expo/bin/cli`):

```bash
npm run expo:config:json
# Any other expo subcommand (script is named expo-cli to avoid clashing with node_modules/.bin/expo):
npm run expo-cli -- config --type introspect
npm run expo-cli -- customize
```

Same pattern: `npm run expo-cli -- <args>` forwards to the local Expo CLI without `npx`.

**Non-interactive / CI:** Expo no longer supports `--non-interactive`. Set `CI=1` before starting (PowerShell: `$env:CI=1; npm run start`).

From **Command Prompt** in `expo-app`, you can also run `run-expo.cmd config --json` (uses `%~dp0` so the path is not mangled by `&`).

## Portability (clone on any machine)

- **Paths:** App and tooling use repo-relative resolution (`path.join` / `import.meta.url` from `expo-app/`). Nothing in source points at a fixed `C:\` or home directory.
- **Env:** Copy `.env.example` → `.env` (gitignored). EAS builds use Expo dashboard variables (`eas.json` forwards `${EXPO_PUBLIC_*}`).
- **Firebase iOS:** Keep `GoogleService-Info.plist` in `expo-app/` for local prebuild, or supply **`GOOGLE_SERVICES_INFO_PLIST`** on EAS (see `docs/EXPO_EAS_FIREBASE_IOS.md`). Do not commit real `.p8` App Store keys; set **`ASC_API_KEY_PATH`** per machine or EAS file secret (see `docs/ENV_SETUP.md`).
- **Generated native projects:** `ios/` and `android/` are gitignored; iPhone release builds use **EAS**, not a checked-in Xcode path.

## Git and GitHub

- **Remote:** If `git remote -v` is empty, this clone has no `origin`. Add your GitHub repo when ready:  
  `git remote add origin https://github.com/<org>/<repo>.git` then `git push -u origin master` (or your default branch).
- **GitHub CLI (`gh`):** Not required for Git. Install from [cli.github.com](https://cli.github.com/) if you want `gh auth login` and PR commands.

## Environment & required setup

1. **Local:** From `expo-app/`, copy `.env.example` → `.env` and fill values you need.
2. **EAS / TestFlight / App Store:** Set the same `EXPO_PUBLIC_*` variables in the Expo project (EAS Environment variables); `eas.json` production profile forwards them into the build.
3. **Code rule:** Read client configuration only via **`import { getRuntimeConfig, … } from '~/config'`** or **`from '../config'`** (barrel: `src/config/index.ts`). The only `process.env` touches for public vars live in **`src/config/runtimeConfig.ts`** (plus `app.config.ts` for `GOOGLE_SERVICES_INFO_PLIST`).

**Minimum for a real signed-in app (typical):**

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat public SDK key (iOS) |

Optional: legal/support URLs (`EXPO_PUBLIC_PRIVACY_POLICY_URL`, etc.), `EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS`. Without Supabase/RevenueCat keys the app still **opens**; auth, sync, and purchases degrade gracefully.

Full tables: **[docs/ENV.md](docs/ENV.md)**, **[docs/ENV_SETUP.md](docs/ENV_SETUP.md)**.

## Monitoring (crash reporting)

- **[docs/EXPO_EAS_FIREBASE_IOS.md](docs/EXPO_EAS_FIREBASE_IOS.md)** — **Start here:** Expo prebuild, EAS, `GoogleService-Info.plist`, config plugins (authoritative for this repo).
- **[docs/FIREBASE_CONSOLE_PLIST.md](docs/FIREBASE_CONSOLE_PLIST.md)** — Download the real plist from Firebase and overwrite `GoogleService-Info.plist` (requires your Console login).
- **[docs/FIREBASE_SETUP_CHECKLIST.md](docs/FIREBASE_SETUP_CHECKLIST.md)** — End-to-end Firebase + Crashlytics checklist.
- **[docs/MONITORING_SETUP.md](docs/MONITORING_SETUP.md)** — JS monitoring facade, plist/EAS pointers, troubleshooting.
- **[docs/MONITORING_VERIFICATION.md](docs/MONITORING_VERIFICATION.md)** — Internal test signals (dev / QA diagnostics only).

After the real plist is in place: `npm run verify:firebase-config:strict` (from `expo-app`).

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
