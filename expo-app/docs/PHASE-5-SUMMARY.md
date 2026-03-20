# Phase 5 — Navigation and screens (complete)

## Completed items

- **Auth context** — `AuthProvider` and `useAuth()` in `src/contexts`. Default session = demo user so app runs without Supabase. `signIn` / `signOut` stubs for Phase 6.
- **Auth gate** — When `session === null`, tabs layout redirects to `/(auth)/login`. After sign-in, login redirects to `/(tabs)`.
- **Login screen** — `app/(auth)/login.tsx`: email/password fields, Sign in button, error state. Uses design system `Button`, `TextInput`, and theme.
- **Tab layout** — Four tabs: Home, Import, Portfolio, Settings. Icons via `expo-symbols`; active tint from theme `primary`.
- **Home screen** — Title "PropFolio", subtitle, Card with "Add property" CTA linking to Import tab.
- **Import screen** — Two cards: "Paste link" (Zillow/Redfin URL input + Import from link) and "Or enter address" (address input + Use address). Uses shared parsers (`parseZillowUrl`, `parseRedfinUrl`, `parseAddress`); shows Alert for success/error.
- **Portfolio screen** — Empty state: "No properties yet" and "Add property" CTA to Import.
- **Settings screen** — Shows session email (if any), "Sign out" row that calls `signOut()` (clears session → redirect to login).
- **Removed** — `app/(tabs)/two.tsx` (replaced by Import, Portfolio, Settings).

## Changed files

| File | Change |
|------|--------|
| `app/_layout.tsx` | Wrapped with `AuthProvider`; added `Stack.Screen name="(auth)"`. |
| `app/(tabs)/_layout.tsx` | Replaced with 4-tab layout (Home, Import, Portfolio, Settings); theme tint; redirect to `/(auth)/login` when `!session`. |
| `app/(tabs)/index.tsx` | Replaced with Home screen (title, Card, Add property CTA). |
| `app/(tabs)/import.tsx` | **New** — Import screen (link + address, parsers, Alerts). |
| `app/(tabs)/portfolio.tsx` | **New** — Portfolio empty state. |
| `app/(tabs)/settings.tsx` | **New** — Settings (email, Sign out). |
| `app/(tabs)/two.tsx` | **Deleted**. |
| `app/(auth)/_layout.tsx` | **New** — Auth stack (login only). |
| `app/(auth)/login.tsx` | **New** — Login form. |
| `src/contexts/AuthContext.tsx` | **New** — Auth state and stubs. |
| `src/contexts/index.ts` | **New** — Re-exports. |

## What to manually test

1. **Tabs** — Open app; confirm four tabs (Home, Import, Portfolio, Settings) and that each tab shows the correct screen.
2. **Home** — Tap "Add property"; confirm navigation to Import tab.
3. **Import** — Paste a Zillow URL (e.g. `https://www.zillow.com/homedetails/...`), tap "Import from link"; confirm Alert with listing ID or error. Enter an address, tap "Use address"; confirm Alert with parsed parts.
4. **Portfolio** — Confirm empty state and "Add property" → Import.
5. **Settings** — Confirm demo email or "Sign out". Tap "Sign out"; confirm redirect to Login screen.
6. **Login** — Enter any email/password, tap "Sign in"; confirm redirect back to Home tab.
7. **Web** — Run `npm run web`; repeat above; confirm no hydration or route errors.
8. **iOS/Android** — Run `npm run ios` / `npm run android`; confirm tabs and navigation work.

## Remaining risk

- **Brief tab flash before redirect** — When session is null, (tabs) layout mounts then redirects; user may see tabs for a frame. Low impact; can add a "loading auth" state later.
- **No deep link to Import** — Home CTA uses `router.push('/(tabs)/import')`; no NotificationCenter-style "switch to Import" from elsewhere yet.
- **Modal route** — Existing `app/modal.tsx` still in stack; unused by new screens. Safe to leave or remove later.
- **Real auth** — Login does not call Supabase; Phase 6 will wire Supabase auth and replace demo session.
