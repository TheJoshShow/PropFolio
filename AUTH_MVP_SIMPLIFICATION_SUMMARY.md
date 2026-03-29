# PropFolio — Auth MVP simplification summary

This document explains how PropFolio’s **sign-in experience was simplified** so the first public version (MVP) uses **only email and password** (plus normal email links from Supabase for things like “confirm your email” and “reset your password”).

You do **not** need to be an engineer to use this page. It is meant for founders, product, and anyone checking that auth is set up correctly.

---

## 1. What auth methods were removed

From the **app screens** and **client code**, we removed:

- **Sign in with Apple**
- **Sign in with Google**
- **Magic link** / **“email me a link to sign in”** (one-tap email link login without a password)

We also removed the **extra code paths** that existed only to support those flows (for example, opening a browser to finish a social login, and handling old-style login tokens in the URL that were mainly used for OAuth-style returns).

**Important:** Users still get **emails from Supabase** when they sign up or reset a password. Those emails contain **links** that open the app or browser so the account can be confirmed or the password updated. That is **not** “magic link login” in the product sense — it is the **standard email confirmation and password reset** flow, and we **kept** what’s needed for that.

---

## 2. What auth methods remain

Today, the MVP supports:

| What | What it means for users |
|------|-------------------------|
| **Sign up** | Create an account with **email + password** and name (no phone number on the sign-up screen). |
| **Sign in** | Log in with **email + password**. |
| **Forgot password** | User enters email; Supabase sends a **reset link** (if your project is configured for it). |
| **Email confirmation** | If your Supabase project requires it, new users confirm by **clicking a link in email** before they can sign in. |

All of this still runs through **Supabase Auth** behind the scenes. Nothing here replaces your backend — it only simplifies **what the app shows** and **what the app tries to do** on the phone.

---

## 3. Why this simplification helps the MVP

- **Faster to ship:** Fewer login paths means fewer things to build, test, and fix before launch.
- **Easier for users to understand:** One clear story — “email and password” — instead of many buttons and explanations.
- **Less dependency on other companies’ setups:** Apple and Google sign-in need extra configuration (developer accounts, keys, App Store review notes, etc.). Email/password works as soon as Supabase is configured.
- **Easier support:** When someone can’t log in, the answer is usually “reset password” or “check your email,” not “which provider did you use?”

You can always **add** Apple or Google sign-in later if the product needs them.

---

## 4. Files changed (high level)

Most work lives in the **Expo app** folder (`expo-app/`). Examples of what was touched:

- **Welcome, login, sign up, forgot password screens** — UI and copy updated; social and magic-link options removed; layout polished for a focused MVP.
- **Auth “brain”** (`AuthContext` and related helpers) — Removed sign-in helpers that only existed for Google/Apple/magic link. Kept email/password, sign-up, sign-out, password reset, and the **minimum** logic to complete sessions when users open **email confirmation / password reset** links (using industry-standard **PKCE** `code` links, not old token-in-the-URL styles).
- **Redirect / deep link helpers** — Renamed and narrowed so they describe **email flows** (confirm / reset), not “OAuth.”
- **Error messages** — Adjusted so users don’t see confusing “provider” wording.
- **Tests and some docs** — Updated so they match the new behavior.

Exact file lists evolved over several commits; if you need a **full git history**, use:

`git log --oneline -- expo-app/app/(auth) expo-app/src/contexts/AuthContext.tsx expo-app/src/utils/authRedirect.ts expo-app/src/utils/authErrors.ts`

---

## 5. Packages, config, and env vars

### Packages

- The app **did not** rely on separate npm packages like `expo-apple-authentication` or Google sign-in SDKs for this MVP — so there was **often nothing to uninstall** for social login.
- **`expo-web-browser`** stays in the project because other features use it (for example, opening **Terms** or **Privacy** in a browser). It is **not** there for social login anymore.

### Environment variables

- There were **no** `EXPO_PUBLIC_*` variables in this repo that were **only** for Apple or Google login. Your `.env.example` style setup still centers on **Supabase** and (separately) things like **RevenueCat** and **maps**.
- **Do not** add fake “Google client ID” or “Apple service ID” entries to the client `.env` for auth — the MVP does not use them in the app.

### App config

- **`scheme: 'propfolio'`** (in Expo config) is still important so links like **`propfolio://auth/callback`** can open the app when users tap **confirm** or **reset** emails on a phone.

---

## 6. Manual cleanup you may still want to do

These are **outside** the codebase — your accounts and dashboards.

### Supabase (recommended)

1. Open **Supabase Dashboard** → your project → **Authentication** → **Providers**.
2. If you are **not** using them for MVP, you can **turn off** (or leave disabled) **Apple**, **Google**, and any **magic link / OTP** style options you don’t want.
3. Under **URL configuration**, keep **redirect URLs** aligned with what the app uses (for example, your **`propfolio://auth/callback`** URL and your **web** site URL if you test on web). Wrong URLs are the #1 reason “email link didn’t open the app” happens.

### Apple Developer

- You do **not** need **Sign in with Apple** capability for this MVP if you are **only** using email/password.
- If you had started Apple sign-in setup (keys, Service IDs, etc.), you can **pause** that work until you decide to add it later.
- **In-App Purchase / subscriptions** are separate — you may still use Apple for **payments** even if you don’t use Apple for **login**.

### Google Cloud

- **Google Maps / Places** keys (used by your backend or native maps) are **unrelated** to “Google sign-in.” Keep those if you use maps.
- You do **not** need OAuth “Web client ID” style setup in Google Cloud **for this MVP’s login**, unless you add Google sign-in again later.

### EAS / Expo environment variables

- Keep **`EXPO_PUBLIC_SUPABASE_URL`** and **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** set for real builds.
- You do **not** need new EAS secrets specifically for Apple/Google **login** for this MVP.
- **`IOS_GOOGLE_MAPS_API_KEY`** (if you use it) is for **maps**, not login.

---

## 7. Beginner-friendly test checklist (on your real phone)

Do this with a **TestFlight or development build** that points at your **real Supabase** project (not an empty demo).

**Before you start**

- [ ] You know a **test email** you can receive mail at.
- [ ] Supabase auth email templates are enabled (or you can at least see errors in the Supabase logs).

**Sign up**

- [ ] Open the app → go to **Create account** (or equivalent).
- [ ] Fill in the form with **valid** details and a **strong password** → submit.
- [ ] If the app says to **check your email**, open the email and **tap the link** → app should open (or browser) and you should end up able to **sign in**.
- [ ] If sign-up logs you in **without** email confirmation (depends on your Supabase settings), you should land in the **main app** (tabs).

**Validation (sign up)**

- [ ] Try an **obviously bad email** (like `notanemail`) — the app should **not** accept it or should show a clear message.
- [ ] Try **mismatched passwords** — you should see a clear message.
- [ ] Try signing up again with an email you **already used** — you should see a message that the email is **already in use** (or similar), not a crash.

**Sign in**

- [ ] Sign out (usually in **Settings**).
- [ ] Sign in with the **correct** email and password → you should reach the **main app**.
- [ ] Try a **wrong password** → stay on the sign-in screen with a **clear error** (no jump to the wrong screen).
- [ ] Try an email that **never registered** (if Supabase returns a generic “wrong email or password,” that is normal for security).

**Session persistence**

- [ ] While signed in, **force-close** the app completely and open it again → you should still be **signed in** (or briefly see loading, then signed in).

**Forgot password** (if you use it)

- [ ] From sign-in, open **Forgot password**, enter your email, send.
- [ ] Check email, tap the **reset** link, set a new password if prompted, then **sign in** with the new password.

**What you should *not* see**

- [ ] No **Continue with Apple** or **Continue with Google** buttons.
- [ ] No **“magic link”** or **“email me a sign-in link”** for day-to-day login.
- [ ] No error text about **“this provider”** or **“sign in with this provider failed.”**

---

## Questions?

If something in this checklist fails, the first places to check are:

1. **Supabase** — Auth settings, email provider, redirect URLs.  
2. **Expo** — Correct `EXPO_PUBLIC_SUPABASE_*` on the EAS build profile you used.  
3. **Deep link** — iOS opens `propfolio://` links for your app (bundle ID + scheme).

This MVP choice is **intentional**: ship a clear, trustworthy login story now; expand methods later if the product needs them.
