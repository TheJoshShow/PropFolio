# Backend configuration and setup

PropFolio loads Supabase URL and anon key from **environment variables** or **Info.plist**. Secrets are never committed. This section covers local development, production, and **email/password auth** for the native Swift app path. (The **Expo** client in `expo-app/` uses `EXPO_PUBLIC_SUPABASE_*` only — no Apple/Google OAuth client IDs in the client.)

---

## 1. Add the Supabase Swift package

In Xcode:

1. **File → Add Package Dependencies**
2. URL: `https://github.com/supabase/supabase-swift`
3. Add the **Supabase** library to the PropFolio app target.

---

## 2. Environment variable loading

The app reads configuration in this order:

1. **ProcessInfo environment** (Xcode scheme or CI-injected)
2. **Info.plist** (target’s Info or custom plist)

**Keys:**

| Key | Required | Description |
|-----|----------|-------------|
| `SUPABASE_URL` | Yes | Project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Yes | Anon (public) key from Project Settings → API |
| `PROPFOLIO_ENV` | No | `development` / `staging` / `production` (for logging) |

**Safe handling:**

- Values are never logged or printed; only a redacted description is used in debug logs.
- Placeholder or missing values result in `SupabaseClientManager.instance == nil`; the app does not crash.
- Use the **anon** key only in the app; never put the **service_role** key in client code.
- If you ever put real keys in Info.plist, do not commit that file (or use a build-phase to inject from env only).

---

## 3. Local development

### Option A: Xcode scheme environment variables

1. **Edit Scheme → Run → Arguments**
2. Under **Environment Variables**, add:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = your anon key

Values are used only when you run from Xcode and are not committed.

### Option B: Info.plist

1. Open the target’s **Info** tab (or your custom plist).
2. Add rows for **SUPABASE_URL**, **SUPABASE_ANON_KEY**, and optionally **PROPFOLIO_ENV**.
3. Use real values for local runs. Do not commit production keys; use a separate plist or xcconfig for secrets.

You can merge from `PropFolio/Resources/Info-Config-Example.plist` as a template (then replace with your keys and keep that file out of version control if it contains secrets).

### Option C: xcconfig (recommended for teams)

1. Copy `PropFolio/Configuration/Config.xcconfig.example` to **Secrets.xcconfig** (or **Config-Secrets.xcconfig**).
2. Fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` in **Secrets.xcconfig**.
3. Add **Secrets.xcconfig** to **.gitignore** (already listed).
4. In Xcode: **Project → Info → Configurations**, set your configuration to use **Secrets.xcconfig**. To expose xcconfig values to the app, add to your target’s **Info** tab keys such as `SUPABASE_URL` = `$(SUPABASE_URL)` and `SUPABASE_ANON_KEY` = `$(SUPABASE_ANON_KEY)` so they are baked into Info.plist at build time from the xcconfig.

---

## 4. Production environment

- **Do not** commit production URL or anon key. Supply them at build or runtime:
  - **CI:** Inject as environment variables in the build job and map them into the app (e.g. into Info.plist via a build phase or xcconfig).
  - **App Store / TestFlight:** Use the same mechanism with secrets stored in your CI secret store (e.g. GitHub Secrets, Fastlane match).
- Set **PROPFOLIO_ENV** to `production` (or `staging`) in production builds so logs and feature flags can branch if needed.
- The anon key is safe to embed in the client; it is restricted by RLS. The **service_role** key must never be in the app binary.

---

## 5. Auth: email and password (MVP)

- **Sign up:** `SupabaseAuthProviding().signUp(email:password:)`
- **Sign in:** `SupabaseAuthProviding().signIn(email:password:)`
- **Sign out:** `SupabaseAuthProviding().signOut()`
- Session and auth state: use `currentSession` and `authStateChanges` on `SupabaseAuthProviding()`.

Use these from **Services/Sync** (or your auth VM); do not put business logic in the Supabase folder.

**Social / OAuth sign-in** is not part of the current Expo MVP (`expo-app/`). If you add Sign in with Apple or Google later, configure providers in Supabase Dashboard and add the native SDK flow — do not add provider client secrets to `EXPO_PUBLIC_*` env vars.

---

## 6. Typed service configuration

- **AppConfiguration** — Raw loading and `isSupabaseConfigured` / `safeDescription` (no secrets logged).
- **ServiceConfiguration.Supabase** — Typed `url` and `anonKey`; `current()` throws if config is missing or placeholder.
- **SupabaseClientManager** — Singleton client; `configure()` is called from `PropFolioApp.init()`.

Use `SupabaseClientManager.instance?.client` when you need the Supabase client (e.g. in Services/Sync).

---

## 7. Quick checklist

- [ ] Supabase Swift package added to the app target.
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` set via scheme, Info.plist, or Secrets.xcconfig (not committed).
- [ ] Run the app: if config is valid, `SupabaseClientManager.instance` is non-nil; otherwise check debug console for the redacted message.
- [ ] Email auth: use `SupabaseAuthProviding()` for sign-in/sign-up/sign-out.
- [ ] Optional later: social providers in Supabase + native SDKs if product requires them (not required for MVP email/password).
