# PropFolio — Account Deletion Flow

End-to-end flow for in-app account deletion (App Store requirement: account deletion must be available in the app).

---

## 1. User path

1. User opens **Settings** (tabs → Settings).
2. Scrolls to **Account security**.
3. Taps **Delete account**.
4. System alert: **"Delete account"** / **"Permanently delete your account and data? You will be signed out and cannot undo this."**
   - **Cancel** → dismiss; no change.
   - **Delete account** → continues.
5. App shows in-button state **"Deleting…"** (button disabled).
6. App calls `deleteAccount()` from AuthContext → Edge Function `delete-account` with current session JWT.
7. **Success:** Alert **"Account deleted"** / **"Your account has been permanently deleted."** Session cleared; user is signed out; tabs redirect to Login.
8. **Failure:** Alert **"Could not delete account"** with error message or **"Something went wrong. Try again or contact support."** Button returns to **"Delete account"**.

---

## 2. Implementation

### Client (expo-app)

| Piece | Location | Role |
|-------|----------|------|
| UI | `app/(tabs)/settings.tsx` | "Delete account" in Account security; confirmation Alert; `handleDeleteAccount` → `deleteAccount()`. |
| Auth | `src/contexts/AuthContext.tsx` | `deleteAccount()`: calls `deleteAccountApi()`, then `setSession(null)`, then `signOut()`. Throws on API error. |
| API | `src/services/edgeFunctions.ts` | `deleteAccount()`: `supabase.functions.invoke('delete-account', {})`. JWT sent in `Authorization` by Supabase client. |

### Server (Supabase)

| Piece | Location | Role |
|-------|----------|------|
| Edge Function | `supabase/functions/delete-account/index.ts` | Reads `Authorization: Bearer <jwt>`. Uses anon client + JWT to get user id; uses service role to `auth.admin.deleteUser(userId)`. Returns `{ success: true }` or error. |

### Data removed

- **Auth:** User row in `auth.users` is deleted by `deleteUser(userId)`.
- **App-specific:** Any profile or app data keyed by `user_id` may remain unless you add deletion steps (e.g. delete from `profiles`, `property_imports`, etc.). For strict compliance, extend the Edge Function to delete or anonymize all user data before calling `deleteUser`.

---

## 3. Visibility and availability

- **When shown:** "Delete account" is only rendered when `isAuthConfigured` is true (Supabase URL + anon key set). When auth is not configured (demo mode), the button is hidden.
- **Demo mode:** If someone runs without Supabase env, account deletion is not available; `deleteAccount()` would throw **"Account deletion is not available in demo mode."**

---

## 4. Error handling

| Case | Client behavior |
|------|------------------|
| Network error / timeout | Error message in Alert; user can retry. |
| 401 Unauthorized / session expired | Edge Function returns 401; client shows error; user can sign in again and retry. |
| 503 Server configuration error | Edge Function missing env; client shows error. |
| 400 / 500 from function | Error message in Alert. |

---

## 5. Post-deletion

- Session is cleared and sign-out is called so the user is returned to Login.
- Subscription (RevenueCat / Apple) is not cancelled by the app; Apple continues billing until the user cancels in Settings → Subscriptions. Consider noting in your Terms or support docs that cancelling the subscription is separate from deleting the account.

---

## 6. Optional: extended data deletion

To delete or anonymize app data (e.g. `profiles`, `property_imports`, `usage_events`), extend `delete-account/index.ts` before `deleteUser`:

1. Get `userId` (already done).
2. Delete or anonymize rows in `profiles`, `property_imports`, and any other tables keyed by `user_id` (use service role client).
3. Then call `supabaseAdmin.auth.admin.deleteUser(userId)`.

Document the full set of deleted data in your Privacy Policy.

---

*See also: `settings_compliance_checklist.md`, `legal_links_matrix.md`.*
