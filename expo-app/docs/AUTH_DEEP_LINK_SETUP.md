# Auth + Deep Link Setup (iPhone Production)

This app uses a native callback URL for auth:

- `propfolio://auth/callback`

## Required Supabase Auth settings

In Supabase Dashboard -> Auth -> URL configuration:

1. Add the app deep link callback:
   - `propfolio://auth/callback`
2. Ensure your production site URL does not point to localhost.
3. For email confirmation and password reset, allow redirecting to the same callback above.

## App-side behavior

- Redirect URL generation is centralized in `src/utils/authRedirect.ts`.
- Auth callback token parsing + `setSession` is handled in `src/contexts/AuthContext.tsx`.
- `app/auth/callback.tsx` waits for AuthContext state and routes to tabs/login.

## Verification checklist (TestFlight)

1. Sign up with a new email from a different iPhone.
2. Tap confirmation link and confirm app opens via `propfolio://auth/callback`.
3. Verify you land in app as signed-in.
4. Trigger password reset, tap reset link, and verify callback returns to app.
5. Kill app, reopen, verify session restore.
6. Sign out, reopen app, verify no stale auto-login.

## Troubleshooting

- If links open Safari but not app: verify app scheme is `propfolio` in `app.json` and callback URL is whitelisted in Supabase.
- If callback opens app but login fails: check Auth debug logs (`[PropFolio] Auth:` events in dev builds).
