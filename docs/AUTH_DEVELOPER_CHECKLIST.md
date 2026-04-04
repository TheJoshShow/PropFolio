# PropFolio auth — developer checklist

## Where credentials live

| Item | Location |
|------|----------|
| **Supabase project URL** | `.env` → `EXPO_PUBLIC_SUPABASE_URL` (or `app.config` → `expo.extra.supabaseUrl`) |
| **Supabase anon (publishable) key** | `.env` → `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **Never in the client** | Service role key, RentCast keys, OpenAI keys |

Restart Metro after changing `.env`.

## Supabase Dashboard — manual configuration

1. **Authentication → Providers → Email**  
   - Enable Email provider.  
   - Leave Google/Apple off for this MVP.

2. **Authentication → URL configuration**  
   Add **every** redirect URL the app will emit (Expo generates different URLs per environment):

   - **Site URL** (optional for native): can be `propfolio://` or your marketing site.
   - **Redirect URLs** (allow list): add each of:
     - Output of `Linking.createURL('auth/callback')` in **Expo Go** (often `exp://…/--/auth/callback`) — changes with LAN IP.
     - Output for **dev client / production** builds with scheme `propfolio` (e.g. `propfolio://auth/callback`, `propfolio://reset-password`).
     - Same paths for **reset-password** as returned by `Linking.createURL('reset-password')`.

   Log URLs once in dev (e.g. temporary `console.log` in `src/config/authRedirects.ts`) if links from email fail with “redirect not allowed”.

3. **Authentication → Email templates** (optional)  
   Customize confirm signup / reset password copy; links use your redirect URLs above.

4. **Confirm email**  
   - **On** (recommended for production): new users get `verify-email-pending`; session may be `null` until they tap the link.  
   - **Off** (dev convenience): users are confirmed immediately; fewer redirects.

5. **Database**  
   Run `supabase/migrations/001_profiles.sql` in the SQL Editor (or your migration pipeline).  
   If `EXECUTE FUNCTION` errors on your Postgres version, replace with `EXECUTE PROCEDURE` on the two triggers.

## Edge cases to test

- [ ] Cold start with valid saved session → lands on portfolio (no welcome flicker).
- [ ] Cold start signed out → welcome.
- [ ] Sign in wrong password → friendly error, button disabled when invalid.
- [ ] Sign up with confirm email **on** → verify screen; resend; tap email link → session + portfolio.
- [ ] Sign in before confirm → routed to verify with email prefilled where possible.
- [ ] Forgot password → generic success copy; reset link opens app → `reset-password` → new password → portfolio.
- [ ] Sign out from settings → welcome; main routes redirect to `/`.
- [ ] Deep link with stale/expired tokens → error logged, user can retry.
- [ ] `profiles` row exists after signup (trigger) and RLS allows `select` for own row only.
- [ ] Import modal with signed-out session → redirected home.

## Files to know

- `src/services/supabase/client.ts` — Supabase + `AsyncStorage` session persistence.
- `src/services/auth/*` — Typed auth helpers (`signInWithEmail`, `signUpWithEmail`, `requestPasswordReset`, etc.).
- `src/features/auth/AuthContext.tsx` — Bootstraps session, deep links, splash gate.
- `src/features/auth/validation.ts` — Client-side validation rules.
- `app/(auth)/_layout.tsx` & `app/(main)/_layout.tsx` — Route guards.
- `src/config/authRedirects.ts` — Redirect URLs passed to Supabase (must match Dashboard allow list).
