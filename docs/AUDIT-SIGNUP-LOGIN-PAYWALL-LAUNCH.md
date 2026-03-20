# Audit: Signup, Login, Free Tier, Paywall, Purchase, Restore, Manage Subscription

**Scope:** iOS app (Swift/SwiftUI). This repo does not contain Android or web clients; those would need a separate audit once implemented.

**Audit date:** 2025-03.

---

## 1. Current state summary

| Area | Implemented | Notes |
|------|-------------|--------|
| **Signup** | ✅ Email only | SupabaseAuthProviding.signUp; LoginScreen sign up mode. Apple Sign In is placeholder. |
| **Login** | ✅ Email | LoginScreen sign in; AuthViewModel drives session. |
| **Auth gate** | ✅ | PropFolioApp shows LoginScreen when `shouldShowLogin` (configured + no session). |
| **Free-tier limit** | ✅ Server + ✅ Client gate | DB trigger `check_property_import_limit()` on `property_imports` INSERT; client gates at "Paste link" / "Type address" via FreeTierService + PaywallView. |
| **Paywall** | ✅ UI only | PaywallView shown when at 2 imports and not entitled; Upgrade / Restore / Manage are placeholders. |
| **Purchase / Restore / Manage** | ❌ | Not wired; RevenueCat SDK not integrated. Placeholder actions in PaywallView. |
| **Persist "Save to portfolio"** | ❌ | TODO in flow; no insert into `properties` / `property_imports` yet. |
| **subscription_status** | ✅ Backend | RevenueCat webhook upserts; app reads for entitlement and paywall gate. |

---

## 2. Missing states and edge cases

### Auth

- **Sign up success message:** After sign up, the app sets `errorMessage = "Check your email to confirm..."`. This reuses the error banner for a success message; consider a dedicated success banner or inline message so it’s clear the user should check email.
- **Session race on launch:** `observeAuth()` runs in a Task; `session` is set from `currentSession` then from `authStateChanges`. There can be a brief moment where `session == nil` while configured, so LoginScreen may flash. Consider an initial “auth loading” state (e.g. show a thin progress or hold root until first session read).
- **Offline login/signup:** No explicit offline handling. Buttons stay enabled; failure shows generic error. Consider disabling submit when network is unavailable or showing “No connection” and retry.
- **Apple Sign In:** Placeholder only; not in scope for this audit.

### Paywall and import limit

- **Gate point:** Limit is enforced in two places: (1) before entering link/address input (client checks `canImportMore` and shows paywall), (2) server trigger on `property_imports` INSERT. Once “Save to portfolio” persists and inserts into `property_imports`, the trigger is the source of truth; the client gate avoids wasted effort.
- **Save to portfolio:** Currently “Save to portfolio” does not persist; it only dismisses. When you implement persist (portfolio + property + `property_imports` insert), you must:
  - Either check `canImportMore` before starting the save and show paywall if false, **or**
  - Attempt insert and catch the trigger exception (`Property import limit reached. Upgrade to import more properties.`) and then show paywall and a clear “Upgrade to import more” message.
- **No bypass:** A user cannot bypass the 2-import limit: the DB trigger rejects the third INSERT unless `subscription_status.entitlement_active` is true for that user. Client gate is a UX optimization.

### Purchase, restore, expiration

- **Purchase / Restore / Manage:** Not implemented. PaywallView has buttons that currently just dismiss. To complete:
  - Integrate RevenueCat SDK (e.g. Purchases SDK).
  - Set RevenueCat `app_user_id` to Supabase `auth.uid()` (UUID string) so webhook and client refer to the same user.
  - Wire Upgrade → purchase flow; Restore → restore purchases; Manage → open App Store subscription management (or RevenueCat customer center if used).
- **Cancellation:** RevenueCat webhook handles CANCELLATION (entitlement stays true until `expiration_at_ms`); EXPIRATION sets `entitlement_active = false`. So “cancel at period end” and “expired” downgrade correctly in the DB.
- **Restore:** After restore, RevenueCat sends events and the webhook updates `subscription_status`. The app should refetch entitlement (or listen to RevenueCat) and dismiss paywall / refresh `freeTierState` after restore.

### Loading and offline

- **Login/signup:** PrimaryButton uses `auth.isLoading`; good. No global “offline” banner.
- **Import flow:** “Importing” phase shows ImportProgressView; link/address inputs can show loading. No explicit offline message if the import request fails due to network.
- **Free-tier fetch:** FreeTierService fetches on first need; if Supabase is unreachable, `fetchFreeTierState()` returns nil and the ViewModel treats as “allow” (server will enforce at save). Optional improvement: show a short “Couldn’t check limit” and retry or block until loaded.

---

## 3. Visual bugs and race conditions addressed

- **Paywall sheet binding:** Sheet is bound to `flowVM.showPaywall` with a proper two-way Binding so swipe-to-dismiss updates the ViewModel.
- **Async gate:** `choosePasteLink()` and `chooseTypeAddress()` are async; they load free-tier state if needed then set `showPaywall` or proceed. View uses `Task { await flowVM.choosePasteLink() }` so the button doesn’t block the main actor incorrectly.

---

## 4. What was implemented in this audit

- **FreeTierService:** Fetches `property_imports` count and `subscription_status.entitlement_active` for the current user; exposes `FreeTierState` and `canImportMore`.
- **Import flow gate:** Before entering link or address input, the app checks `canImportMore`; if false, shows PaywallView (sheet). Free-tier state is loaded when the start phase appears (`.task { await flowVM.loadFreeTierStateIfNeeded() }`).
- **PaywallView:** Message “You’ve used your N free imports”, benefits, and buttons: Upgrade to Pro, Restore purchases, Manage subscription (all placeholders for RevenueCat / App Store).
- **SubscriptionStatusRow:** Model for `subscription_status` with ISO8601 date decoding for Supabase timestamptz.

---

## 5. Launch checklist (with remaining manual / console tasks)

### Backend and config (manual)

- [ ] **Supabase:** Run all migrations so `profiles`, `property_imports`, `subscription_status`, RLS, and `check_property_import_limit` trigger exist.
- [ ] **RevenueCat:** Create project and products; set `app_user_id` to Supabase user ID (UUID) when identifying users.
- [ ] **RevenueCat webhook:** Deploy `revenuecat-webhook` Edge Function; set secret `REVENUECAT_WEBHOOK_AUTHORIZATION`; in RevenueCat Dashboard set webhook URL and same Authorization header. Send a test event and confirm `subscription_status` row upserted.
- [ ] **Supabase Auth:** If using email confirmation, configure redirect URL and templates. Optionally enable Apple provider and implement Sign in with Apple.

### iOS app (manual / code)

- [ ] **Persist “Save to portfolio”:** Implement create default portfolio (if none), insert property into `properties`, insert row into `property_imports` (user_id, property_id, source). Handle trigger exception and show paywall when limit reached.
- [ ] **RevenueCat SDK:** Add Purchases SDK; configure with API key and set app user id to `auth.uid().uuidString`. Wire PaywallView “Upgrade to Pro” to purchase, “Restore purchases” to restore, “Manage subscription” to App Store subscription management URL (or customer center).
- [ ] **Refetch after purchase/restore:** After successful purchase or restore, refresh free-tier state (reload `freeTierState` or refetch from Supabase / RevenueCat) and dismiss paywall.
- [ ] **Optional:** Auth loading state to avoid brief LoginScreen flash on cold start.
- [ ] **Optional:** Sign up success message in a dedicated success state instead of reusing the error banner.

### Manual console / QA tasks

- [ ] **2-import limit:** As free user, import and “save” 2 properties (once persist is implemented); third attempt shows paywall at Paste link / Type address. Confirm server rejects third `property_imports` INSERT if client were bypassed.
- [ ] **Pro entitlement:** In DB set `subscription_status.entitlement_active = true` for test user (or complete a sandbox purchase). Confirm user can go past 2 imports and paywall does not show.
- [ ] **Expiration:** In RevenueCat or DB set `entitlement_active = false` and `expires_at` in the past; confirm app shows paywall again for 3rd import.
- [ ] **Restore:** On a second device or reinstall, restore purchases and confirm entitlement appears and paywall is dismissed.
- [ ] **Login/signup:** Test with invalid credentials, network off, and email confirmation flow if enabled.

---

## 6. Android and web

This codebase is **iOS only**. For Android and web:

- Reuse the same Supabase auth and `subscription_status` / `property_imports` schema and trigger.
- Reuse the RevenueCat webhook and `app_user_id` = Supabase user ID contract.
- Implement equivalent flows: login/signup, free-tier check (query `property_imports` count + `subscription_status` or RevenueCat client), paywall before 3rd import, purchase/restore/manage via RevenueCat (or Stripe for web if different).
- Run the same manual checks (limit, entitlement, expiration, restore) on each platform.
