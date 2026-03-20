# Supabase (iOS integration)

**What belongs here:** **Client initialization and auth configuration only.** No business logic, no API call implementations.

- **SupabaseClient.swift** — Singleton client; configured at launch from AppConfiguration.
- **Auth/** — AuthConfiguration (email + Apple placeholder), SupabaseAuthProviding (sign in/up/out, session, auth state).
- **Configuration** in `PropFolio/Configuration/`; see **docs/SETUP-BACKEND-CONFIG.md** for env loading and secrets.

**Rule:** All auth flows, “fetch property,” portfolio CRUD, and sync logic live in **Services/Sync/**. This folder is only for creating and configuring the Supabase client. Backend (migrations, Edge Functions) lives in repo root `supabase/`.
