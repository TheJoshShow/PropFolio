# Phases 8–10 — Testing, runnable setup, polish

## Phase 8 — Testing and validation

- **Unit tests** — Jest + ts-jest for `src/lib` (underwriting, scoring). Run: `npm run test` from expo-app.
- **Manual checklist** — See Phase 5 and Phase 6 summaries for per-phase test steps. Full platform checklist:
  - **iOS**: Tabs, Home → Import → Portfolio → Settings, Sign out → Login → Sign in, Import link/address.
  - **Android**: Same as iOS.
  - **Web**: Same + desktop width (content centered), no hydration errors.

## Phase 9 — Runnable dev setup

- **Scripts** — `package.json`: `start`, `ios`, `android`, `web`, `test`, `test:watch`, `typecheck`.
- **README** — Run commands and env vars documented; run from `expo-app` directory.
- **Env** — `.env.example` lists optional Supabase vars. Without them, app runs in demo mode.

## Phase 10 — Final polish

- **Consistency** — All tab screens use theme colors, design system components, and responsive container.
- **No dead code** — Removed `(tabs)/two.tsx`; modal route kept for future use.
- **Risk** — Supabase/AsyncStorage must be installed (`npm install` in expo-app) for auth to work when env is set. If install fails, comment out Supabase in `AuthContext` and `services/supabase.ts` to keep demo-only auth.
