# PropFolio — iOS Release Candidate Test Results

**Sweep type:** Final release candidate code verification + checklist for manual/E2E  
**Build:** expo-app (Expo / React Native), iOS  
**Date:** [DATE]  
**Note:** This report is based on **code path verification**. Run manual and E2E tests on a release build before launch and record results in the "Manual / E2E" column where applicable.

---

## 1. Authentication

| Area | Code verification | Manual / E2E |
|------|-------------------|--------------|
| **Sign up** | Email/password, first/last name; validation (email, password ≥8, match); Terms/Privacy links use openUrlSafe; success states (email confirm vs signed in). AuthContext.signUp → Supabase; ensureProfile on success. | ☐ Sign up with new account; confirm email flow if enabled; verify redirect to tabs. |
| **Login** | Email/password, Google, Apple, magic link; empty email/password caught; getAuthErrorMessage for auth errors; session → replace to (tabs). | ☐ Login with email/password; OAuth if configured; magic link; invalid credentials show error. |
| **Logout** | Settings → Log out with Alert confirmation; signOut() clears session. Tabs layout: session === null → replace to (auth)/login. | ☐ Log out; confirm redirect to login and session cleared. |
| **Password reset** | Forgot-password screen; email validation; resetPassword(); when !isAuthConfigured shows "Password reset is not available. Please try again later." (no dev-only message). Success: "Check your email" + Back to Sign in. | ☐ Request reset; verify email received and link works; sign in with new password. |
| **Update password** | update-password.tsx: when !isLoading && session === null → router.replace('/(auth)/login'). Form: password length, match; getAuthErrorMessage on error. | ☐ Open update-password while logged in; confirm redirect when not logged in. |
| **Delete account** | Settings → Delete account with confirmation Alert; deleteAccount() calls delete-account Edge Function (Bearer JWT); then clears session. When !getSupabase() throws "Account deletion is not available in demo mode." | ☐ Delete account; confirm user removed and redirect to login. |

---

## 2. Subscription and paywall

| Area | Code verification | Manual / E2E |
|------|-------------------|--------------|
| **Free import limit** | useImportLimit: canImport = (freeRemaining > 0) \|\| hasProAccess; server count from property_imports. At limit, handlePasteLink/handleAddress call showPaywallForBlocked(router) → Alert + "Upgrade to Pro" → router.push('/paywall'). At-limit card on Import tab with "Upgrade to Pro" CTA. | ☐ Use 2 free imports; 3rd attempt shows paywall (or alert then paywall). |
| **Paywall trigger** | Import: !canImport → showPaywallAndBlock(). Paywall screen: usePaywallState; if hasProAccess shows "You have Pro" + Manage subscription. | ☐ From Import at limit, paywall opens; plan cards and Restore visible. |
| **Purchase flow** | usePaywallState.handlePurchase → purchasePackage; loading state (purchasingId); entitlement verification and delayed message (PAYWALL_COPY.entitlementDelayedMessage); onPurchaseSuccess → router.back(). | ☐ Select plan, complete Apple IAP (sandbox); confirm Pro access and return from paywall. |
| **Restore purchases** | Settings and Paywall: restore() from SubscriptionContext; getRestoreOutcome() for success / no_purchases / failed / offline (looksOffline checks error text). Alert (Settings) or inline card (Paywall) with outcome. | ☐ Restore with no prior purchase → "No purchases found"; with subscription → "Purchases restored" (or equivalent). Offline → "Unable to restore" message. |
| **Manage subscription** | openSubscriptionManagement() → RevenueCat management URL or App Store subscriptions URL; fallback Alert with getManageSubscriptionFallbackMessage() (iOS: Settings app → Subscriptions). | ☐ Tap Manage subscription; system flow or fallback copy. |

---

## 3. Support and legal links

| Area | Code verification | Manual / E2E |
|------|-------------------|--------------|
| **Support link** | Settings → Help & support → "Contact support" → handleOpenUrl(getSupportUrl()). openUrlSafe: canOpenURL → openURL; else Alert "Cannot open link". | ☐ Tap Contact support; URL opens or Alert on failure. |
| **Legal links** | Settings → Legal: Privacy Policy, Terms of Service. Paywall footer: Terms, Privacy. Sign-up: Terms, Privacy. All use openUrlSafe (openLink.ts). | ☐ Tap Privacy Policy and Terms; URLs open or Alert. |
| **Billing help** | If EXPO_PUBLIC_BILLING_HELP_URL set, Settings shows "Billing help & FAQ" link; else inline text only. | ☐ If URL set, link works. |

---

## 4. Offline and API failure

| Area | Code verification | Manual / E2E |
|------|-------------------|--------------|
| **Import (geocode/rent)** | edgeFunctions: invokeWithTimeout with timeout and retries; "Request timed out. Please try again." on timeout/abort; Alert with error on failure. Import: geocodeRes.error, rentRes.error; "Import failed" Alert with retry where retryable. | ☐ Turn off network; attempt import; see timeout or error and retry. |
| **Paywall (offerings)** | Offerings fallback when load fails (offeringsResult.kind === 'fallback'); PaywallContent shows fallback card + Retry. Paywall auto-refresh once when fallback. restorePurchases: offline outcome from getRestoreOutcome. | ☐ Offline: paywall shows fallback message + Retry; restore shows offline message. |
| **Restore offline** | restorePurchases.ts: looksOffline(error) → status 'offline', "You appear to be offline. Check your connection and try again." | ☐ Restore while offline; confirm offline copy. |

---

## 5. Invalid input handling

| Area | Code verification | Manual / E2E |
|------|-------------------|--------------|
| **Login** | Empty email/password → setError. isValidEmail on magic link. getAuthErrorMessage for Supabase errors. | ☐ Submit empty; invalid email; wrong password. |
| **Sign up** | firstName, lastName, email, password, confirmPassword validated; password length (isPasswordLongEnough), match; getAuthErrorMessage on signUp error. | ☐ Short password; mismatch; duplicate email. |
| **Forgot password** | Empty email; invalid email; isAuthConfigured check. | ☐ Empty/invalid email. |
| **Import** | Empty address → Alert "Enter address". Empty link → no submit. Unsupported link → Alert "Unsupported link". | ☐ Submit empty address; paste non-Zillow/Redfin link. |

---

## 6. Session expiry and redirect

| Area | Code verification | Manual / E2E |
|------|-------------------|--------------|
| **Tabs when unauthenticated** | (tabs)/_layout.tsx: useEffect when !isLoading && session === null → router.replace('/(auth)/login'). While session === null, shows "Loading…" or "Redirecting…". | ☐ Invalidate session (e.g. delete in Supabase); reopen app or trigger refresh; confirm redirect to login. |
| **Update password** | useEffect when !isLoading && session === null → router.replace('/(auth)/login'); if session === null return null. | ☐ Navigate to update-password while logged out; confirm redirect. |

---

## 7. Debug UI and demo content

| Area | Code verification | Manual / E2E |
|------|-------------------|--------------|
| **Debug UI in release** | Settings: "Debug (dev only)" section (Entitlement, Usage, Can import, Log state to console) wrapped in `{__DEV__ && ( ... )}`. getSimulateBlockedImport() true only when __DEV__; subscriptionDebugOverrides getters return false when !__DEV__. | ☐ Build release (e.g. EAS production); open Settings; confirm no Debug section. |
| **Demo user** | AuthContext: DEMO_USER only when getSupabase() is null (no EXPO_PUBLIC_SUPABASE_*). Production env has Supabase set → no demo user. deleteAccount throws in demo mode. | ☐ Production build with env set; no demo account. |
| **Placeholder / demo content** | Form placeholders are input hints (e.g. "you@example.com", "••••••••"); no "coming soon" or test-only copy in production paths. PAYWALL_COPY and legal copy are production-ready. | ☐ Scan for "coming soon", "demo", "test" in release build UI. |

---

## 8. Summary

| Category | Code verification | Recommended manual |
|----------|-------------------|---------------------|
| Auth (sign up, login, logout, reset, update password, delete account) | ✅ Paths present and correct | Run full auth flow on device/simulator |
| Free limit + paywall trigger + purchase + restore + manage | ✅ Implemented and gated | Test with sandbox account and at limit |
| Support/legal links | ✅ openUrlSafe everywhere | Tap each link; confirm URL or Alert |
| Offline / API failure | ✅ Timeout, retry, fallback, offline restore copy | Test with network off / flaky |
| Invalid input | ✅ Validation and error messages | Try empty/invalid inputs |
| Session redirect | ✅ Tabs and update-password redirect when session null | Force session clear and re-open |
| No debug in release | ✅ __DEV__ gates; demo only when no Supabase | Release build + Settings |

---

*Complete manual and E2E tests on a release build before launch. Record any failures in final_release_blockers.md and re-run until clear for launch_go_no_go.md.*
