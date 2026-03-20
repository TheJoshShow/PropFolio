# PropFolio iOS App Store — Release Blocker Report

**Sweep date:** [DATE]  
**Build:** expo-app (React Native / Expo), iOS target  
**Scope:** Authentication, signup, password reset, logout, account deletion, property import, scoring, analysis, subscription, paywall, links, crash/analytics, loading/empty/offline/API failure, invalid input, session expiry, placeholders, navigation, secrets, debug exposure, dead routes.

---

## Executive summary

| Severity | Count | Status |
|----------|--------|--------|
| **1 – Blocker** | 0 | None identified |
| **2 – Should fix before launch** | 4 | Documented; fixes applied |
| **3 – Nice to have** | 2 | Documented |

The codebase is in good shape for an iOS App Store candidate: auth flows are implemented with validation and error handling, subscription/paywall/restore are wired, account deletion and legal/support links are present, and debug UI is correctly gated by `__DEV__`. No hardcoded secrets or test credentials are used in production code paths. Four Severity 2 items were identified and addressed below.

---

## Verification summary by area

### Authentication
- **Login:** Email/password, Google, Apple, magic link; invalid input and auth errors surfaced; redirect to tabs on success.
- **Signup:** Email/password, name fields; validation (email, password length, match); email-confirmation and signed-in flows; Terms/Privacy links present.
- **Password reset:** Forgot-password screen; success and error states; link to login. *S2: Dev-oriented message when auth not configured — fixed.*
- **Logout:** Sign out from Settings with confirmation; session cleared.
- **Account deletion:** Settings → Delete account with confirmation; calls `delete-account` Edge Function; session cleared. Compliant with in-app account deletion requirement.

### Property import
- **Flow:** Paste link or enter address; geocode + rent estimate (with timeout/retry); import gated by free limit; paywall when blocked.
- **Paywall gating:** At limit, "Import from link" / "Use address" show upgrade CTA and open paywall; resume after purchase supported.
- **Placeholder copy:** Zillow/Redfin link paste showed "Full import from link coming soon." *S2: Replaced with actionable copy — fixed.*

### Scoring and analysis
- **Current state:** Property import writes to Supabase (RPC + property record). Portfolio tab shows an **empty state only** ("No properties yet" + CTA to Import). There is no property detail screen or in-app confidence/deal score UI in the current build.
- **Recommendation:** If the App Store or marketing promises "confidence score" or "deal score," either ship a minimal property-detail/score view before launch or soften store copy to match MVP (e.g. "Add and save properties; scoring coming soon").

### Subscription and paywall
- **Purchase:** RevenueCat; plan selection, loading, and error states; entitlement verification and delayed-activation messaging.
- **Restore purchases:** Settings and paywall; outcome messaging (success, no purchases, failed, offline).
- **Paywall gating:** Free limit enforced; upgrade CTA and navigation to paywall verified.
- **Legal links on paywall:** Terms and Privacy open via `Linking.openURL`. *S2: No error handling if URL fails — fixed with try/catch and user feedback.*

### Support and legal links
- **Settings:** Contact support, Billing help (if URL set), Privacy Policy, Terms of Service; all use a shared `handleOpenUrl` with `canOpenURL` and Alert on failure.
- **Paywall:** Terms and Privacy now use the same safe-open pattern (fix applied).

### Crash reporting and analytics
- **Sentry:** Initialized only when `EXPO_PUBLIC_SENTRY_DSN` is set and platform is iOS; `__DEV__` vs production environment set; no PII in default config.
- **Analytics:** Funnel events (signup, login, import, paywall, purchase, restore) via `trackEvent`; Supabase `usage_events` when authenticated; `__DEV__` logs sanitized (no PII).

### Loading, empty, and error states
- **Auth:** Loading/redirect state while resolving session; button loading on sign-in/sign-up/reset.
- **Import:** Loading for geocode, rent estimate, autocomplete, and submit; disabled buttons and "Looking up…" / "Saving…"; error Alerts with retry where appropriate.
- **Paywall:** Loading plans, activating, restore in progress; error and fallback (offline/unavailable) with Retry.
- **Portfolio:** Empty state with clear CTA to Add property.
- **Settings:** Subscription/import limit loading; retry on error.

### Offline and API failure
- **Edge functions:** Timeout and retry (e.g. geocode, places, rent estimate); user-facing timeout message on failure.
- **Restore purchases:** Offline outcome detected and specific message shown.
- **Paywall:** Offerings fallback when unavailable; retry and refresh.

### Invalid input handling
- **Auth:** Email format, password length, match; auth error messages mapped via `getAuthErrorMessage`.
- **Import:** Empty address/link validated; unsupported link type surfaced.

### Session expiry
- **Supabase:** `autoRefreshToken` and `onAuthStateChange`; when session becomes null, tabs layout redirects to login. No explicit 401 handler in app code; reliance on auth state is sufficient.

### Placeholders, navigation, secrets, debug
- **Placeholders:** Input placeholders are appropriate (e.g. "you@example.com", "••••••••"). Only user-facing "coming soon" was the Zillow/Redfin link message — fixed.
- **Navigation:** Tabs (Home, Import, Portfolio, Settings); auth stack (login, sign-up, forgot-password); paywall and update-password. No dead routes found; +not-found links to "/".
- **Test credentials:** None in code. Demo user used only when Supabase env is unset (`getSupabase()` null); production must set env.
- **Debug menus:** Settings "Debug (dev only)" section and "Log state to console" are wrapped in `__DEV__`; not rendered in production.
- **Console:** All `console.log`/`console.warn` in app code are either `__DEV__`-only or safe (no PII/secrets).
- **Secrets:** Supabase and RevenueCat keys from env only; no hardcoded secrets.

### Update password screen
- **Issue:** Screen is reachable without a session (e.g. direct route). Form submit would fail with auth error. *S2: Redirect to login when no session — fixed.*

---

## Severity 2 items (fixed)

1. **Update-password without session** — Redirect to `/(auth)/login` when `!session` so the screen is not usable when logged out.
2. **Import: "Coming soon" for Zillow/Redfin link** — Replaced with copy that directs users to "Or enter address" to add the property now.
3. **Paywall: Legal link error handling** — Terms/Privacy links now use safe open (try/catch + Alert) consistent with Settings.
4. **Forgot-password: Dev-oriented message** — When auth is not configured, show a generic "Password reset is not available. Please try again later." instead of "Configure Supabase in your environment."

---

## Severity 3 (nice to have)

1. **Settings:** Unused state `simulateBlocked` and handler `handleSimulateBlockedChange` (no UI toggle in Debug section). Safe to remove for cleanliness.
2. **Portfolio:** When Phase 6 is implemented, add property list and detail with confidence/deal score and ensure store copy matches.

---

## Recommended pre-submission checks

- [ ] Set production env: `EXPO_PUBLIC_SUPABASE_*`, `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_SUPPORT_URL`.
- [ ] Confirm Privacy Policy and Terms URLs load in Safari.
- [ ] Confirm Support URL matches App Store Connect.
- [ ] Test account deletion end-to-end (auth user and any profile data removed).
- [ ] Test restore purchases on a test account with existing subscription.
- [ ] Verify no `__DEV__`-only UI or debug menus in release build.

---

*This report is a snapshot of a release-blocker sweep. It is not legal or compliance advice. For App Store and privacy compliance, use the app store launch governance checklist and privacy documentation.*
