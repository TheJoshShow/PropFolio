# PropFolio — Email/Password Auth Implementation Summary

This document lists **every file changed or added** for production-ready email/password authentication using Supabase Auth.

---

## Files added

| File | Purpose |
|------|--------|
| **`expo-app/src/config/env.ts`** | Environment variable validation for auth. Exposes `validateAuthEnv()` (returns `{ isValid, missing }` for Supabase URL and anon key) and `isAuthConfigured()`. Logs a dev warning when vars are missing. |
| **`expo-app/src/services/profile.ts`** | Profile service. `ensureProfile(supabase, userId, metadata)` upserts a row in `public.profiles` (id, display_name from metadata.first_name/last_name, updated_at). Idempotent; called after signup and on session load. |
| **`expo-app/app/(auth)/forgot-password.tsx`** | Forgot Password screen. Email input, “Send reset link” (calls `resetPassword`), loading state, error state with “Try again”, success state (“Check your email”) with “Back to Sign in” and “Send to a different email”. Handles unconfigured auth (disabled submit, message). |
| **`expo-app/docs/AUTH-IMPLEMENTATION-SUMMARY.md`** | This summary. |

---

## Files changed

| File | Changes |
|------|--------|
| **`expo-app/src/utils/authErrors.ts`** | Introduced `AuthErrorContext` type including `'resetPassword'`. `getAuthErrorMessage(error, context)` now supports `context === 'resetPassword'` (rate limit and generic reset message). |
| **`expo-app/src/contexts/AuthContext.tsx`** | (1) Import `ensureProfile`, `validateAuthEnv`, `ProfileMetadata`. (2) `ensureProfileForUser()` helper. (3) After signUp (when session exists) and in `onAuthStateChange` / email-link deep link completion, call `ensureProfileForUser(supabase, user.id, user.user_metadata)` so a profiles row exists. (4) New `resetPassword(email)` returning `Promise<ResetPasswordResult>`. (5) Context value now includes `resetPassword` and `isAuthConfigured` (from `validateAuthEnv().isValid`). |
| **`expo-app/src/services/supabase.ts`** | Trim URL and anon key when reading env. Comment updated to reference `config/env.ts` for validation. |
| **`expo-app/app/(auth)/_layout.tsx`** | Registered `Stack.Screen name="forgot-password"`. |
| **`expo-app/app/(auth)/login.tsx`** | (1) “Forgot password?” link (navigates to `/(auth)/forgot-password`). (2) On error: show error message plus “Try again” button that clears error. (3) Sign in button disabled when email or password is empty. (4) New styles: `forgotRow`, `forgotText`, `errorRow`, `error`, `retryTouchable`, `retryText`. |
| **`expo-app/app/(auth)/sign-up.tsx`** | (1) On error: wrap error text and add “Try again” button that clears error. (2) New styles: `errorRow`, `error`, `retryTouchable`, `retryText`. |
| **`expo-app/app/(tabs)/_layout.tsx`** | (1) When `isLoading && session === null`, render a full-screen auth loading state (ActivityIndicator + “Loading…”) instead of tabs. (2) When `session === null` (and not loading), return null (redirect will happen in useEffect). (3) New styles: `authLoading`, `authLoadingText`. Imports: `View`, `Text`, `StyleSheet`, `ActivityIndicator`, `spacing`, `fontSizes`. |
| **`expo-app/docs/ENV.md`** | New “Validation” section describing `validateAuthEnv()` and `isAuthConfigured()`, and that auth flows use them. Updated “Optional” table note to mention profile creation. |

---

## Behaviour summary

- **Create Account** — Existing sign-up screen; on success with session, profile is created/updated via `ensureProfile`. Email verification supported (existing “Check your email” state when `needsEmailConfirmation`).
- **Log In** — Existing login screen; “Forgot password?” link and error + retry added. Session persistence remains Supabase’s responsibility (secure storage via AsyncStorage / localStorage).
- **Forgot Password** — New screen and `resetPassword` in AuthContext; loading, error, success, and retry states; respects `isAuthConfigured`.
- **Log Out** — Unchanged; Settings “Sign out” calls `signOut()`.
- **Profiles** — After signup (when session exists) and on every session load (including after PKCE email-link completion), `ensureProfile` upserts `public.profiles` so FKs from other tables succeed.
- **Auth state** — Single app-wide `AuthProvider` in root layout; `useAuth()` exposes session, loading, and auth methods.
- **Navigation** — Unauthenticated: redirect to `/(auth)/login`; tab layout shows auth loading when `isLoading && session === null`. Authenticated: tabs. No changes to existing tab/screen content.
- **Env validation** — `validateAuthEnv()` and `isAuthConfigured` used in AuthContext and forgot-password screen; dev warning when Supabase vars are missing.

---

## Not changed (unchanged behaviour)

- **`expo-app/app/_layout.tsx`** — Still wraps app with `AuthProvider`; no change.
- **`expo-app/app/(tabs)/index.tsx`**, **`import.tsx`**, **`portfolio.tsx`**, **`settings.tsx`** — Unchanged; no breaking changes to existing screens.
- **`expo-app/src/utils/authRedirect.ts`** — Unchanged.
- **Supabase migrations** — No new migrations; profile creation is app-side upsert. A DB trigger can be added later if desired.
