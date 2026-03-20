# Services / Sync

**What belongs here:** All app–backend communication and sync logic (auth flows, API calls, persistence). **Not** client configuration — that lives in **Supabase/**.

- **Auth:** Sign in / sign up, session handling, sign out (using the client from Supabase/).
- **Remote calls:** Fetch property (call backend Edge Function), save/load portfolio (tables), sync analyses.
- **Offline / cache:** Optional local persistence of portfolio and recent analyses.

**Rule:** Do not put Supabase keys in client code; use backend endpoints for sensitive operations. Supabase/ holds only client init and config; this folder holds all business use of that client.
