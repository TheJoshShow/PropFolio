# Phase 6 — API and platform integration (complete)

## Completed items

- **Supabase client** — `src/services/supabase.ts`: `getSupabase()` and `supabase` export. Uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Returns `null` when either is missing so the app runs without config.
- **Session storage** — Auth uses AsyncStorage on native and `window.localStorage` on web; `detectSessionInUrl` only on web for OAuth/callback.
- **Auth wired to Supabase** — `AuthContext` calls `getSupabase()`: when configured, subscribes to `onAuthStateChange`, restores session from `getSession()`, `signIn` → `signInWithPassword`, `signOut` → `signOut`. When not configured, keeps demo user and stub sign-in/out.
- **Redirect only when not loading** — Tabs layout redirects to login only when `!isLoading && session === null` so Supabase session restore doesn’t flash login.
- **Dependencies** — `@supabase/supabase-js` and `@react-native-async-storage/async-storage` added to `package.json`.
- **.env.example** — Example env vars for Supabase (optional).

## Changed files

| File | Change |
|------|--------|
| `src/services/supabase.ts` | **New** — createClient with env, storage, returns null if not configured. |
| `src/services/index.ts` | Export `getSupabase`, `supabase`. |
| `src/contexts/AuthContext.tsx` | Use Supabase when available: getSession + onAuthStateChange, signIn/signOut call Supabase. |
| `app/(tabs)/_layout.tsx` | Redirect to login only when `!isLoading && session === null`. |
| `package.json` | Added `@supabase/supabase-js`, `@react-native-async-storage/async-storage`. |
| `.env.example` | **New** — EXPO_PUBLIC_SUPABASE_* example. |

## What to manually test

1. **Without .env** — Run app; confirm you see tabs with demo user. Sign out → Login screen. Sign in with any email/password → back to tabs.
2. **With .env** — Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, run `npm install` in expo-app, then start app. Confirm first load shows login (or tabs if session restored). Sign in with real Supabase user → tabs. Sign out → login. Restart app → session restored (tabs).
3. **Web** — Same with and without .env; confirm no "window is not defined" or storage errors.

## Remaining risk

- **AsyncStorage on web** — If a future build runs in SSR, AsyncStorage import may need to be conditional; currently we use `window.localStorage` on web in `getStorage()`.
- **Property data / portfolio DB** — Not wired; Phase 6 only covers auth. Portfolio list and import result persistence are for a later phase.
- **RevenueCat / Stripe** — Not added; per audit, mobile paywall and web payments are later.
