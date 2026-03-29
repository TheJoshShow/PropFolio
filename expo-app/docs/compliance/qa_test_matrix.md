# PropFolio iOS — QA Test Matrix

Use this matrix for manual (or automated) testing before each release and for App Store submission.

**Build:** expo-app, iOS  
**Last updated:** [DATE]

---

## 1. Authentication

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 1.1 | Login (email/password) | Enter valid email + password → Sign in | Session established; redirect to Home | |
| 1.2 | Login invalid email | Enter invalid email format → Sign in | Inline error (e.g. "Enter a valid email") | |
| 1.3 | Login wrong password | Valid email + wrong password | Auth error message | |
| 1.4 | Login empty fields | Submit with empty email or password | Button disabled or inline error | |
| 1.5 | Sign up | Valid name, email, password, confirm → Sign up | Account created; redirect or "Check your email" | |
| 1.6 | Sign up validation | Invalid email / short password / mismatch | Inline or alert error | |
| 1.7 | Forgot password | Enter email → Send reset link | Success message; email received (if configured) | |
| 1.8 | Forgot password invalid email | Invalid email → Submit | Validation error | |
| 1.9 | Password reset (update) | From Settings → Update password; enter new + confirm | Success screen; can sign in with new password | |
| 1.10 | Update password no session | Open /update-password when logged out | Redirect to login | |
| 1.11 | Logout | Settings → Log out → Confirm | Session cleared; redirect to Login | |
| 1.12 | Account deletion | Settings → Delete account → Confirm | Account removed; signed out; no crash | |

---

## 2. Property import

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 2.1 | Paste Zillow URL | Paste Zillow link → Import from link | Message directing to use address (no "coming soon") | |
| 2.2 | Paste Redfin URL | Paste Redfin link → Import from link | Same as 2.1 | |
| 2.3 | Paste invalid link | Paste non-Zillow/Redfin URL | "Unsupported link" message | |
| 2.4 | Enter address | Type address; select suggestion or submit; complete flow | Geocode + rent estimate; property saved; success message | |
| 2.5 | Enter address empty | Submit with empty address | "Enter address" alert | |
| 2.6 | Import at free limit | Use 2 free imports; try 3rd (link or address) | Paywall or upgrade CTA; no silent fail | |
| 2.7 | Import as Pro | With active Pro; add property | Import succeeds; no paywall | |
| 2.8 | Loading states | During geocode / save | Buttons show "Looking up…" / "Saving…"; disabled | |
| 2.9 | API failure | Simulate timeout or network off | User sees error and can retry | |

---

## 3. Subscription and paywall

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 3.1 | Paywall from import limit | Hit free limit → Upgrade to Pro | Paywall screen with plans | |
| 3.2 | Plan selection | Tap Subscribe on a plan | Purchase sheet (Sandbox); loading then success or cancel | |
| 3.3 | Purchase success | Complete purchase (Sandbox) | Entitlement active; paywall dismisses or "You have Pro" | |
| 3.4 | Purchase cancel | Cancel purchase sheet | Return to paywall; no crash | |
| 3.5 | Restore purchases | Paywall or Settings → Restore | Outcome message (restored / no purchases / failed / offline) | |
| 3.6 | Restore with active sub | Restore when already Pro | Success outcome | |
| 3.7 | Paywall already Pro | Open paywall when Pro | "You have Pro" + Manage subscription + Done | |
| 3.8 | Manage subscription | Paywall or Settings → Manage subscription | System subscription management or fallback message | |
| 3.9 | Offerings unavailable | Offline or RC down | Fallback message + Retry | |
| 3.10 | Loading plans | Open paywall with slow network | "Loading plans…" or spinner | |

---

## 4. Links and legal

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 4.1 | Privacy Policy (Settings) | Settings → Privacy Policy | Opens correct URL in browser | |
| 4.2 | Terms (Settings) | Settings → Terms of Service | Opens correct URL | |
| 4.3 | Privacy Policy (Paywall) | Paywall → Privacy Policy | Opens URL; no unhandled error | |
| 4.4 | Terms (Paywall) | Paywall → Terms of Service | Opens URL; no unhandled error | |
| 4.5 | Contact support | Settings → Contact support | Opens support URL or mailto | |
| 4.6 | Billing help | If configured, Settings → Billing help | Opens billing help URL | |

---

## 5. Navigation and screens

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 5.1 | Tab navigation | Switch Home / Import / Portfolio / Settings | All tabs load; no crash | |
| 5.2 | Home → Import | Home → Add property | Import screen | |
| 5.3 | Portfolio empty state | Open Portfolio with no properties | "No properties yet" + Add property CTA | |
| 5.4 | 404 / not found | Open invalid route (if possible) | Not-found screen; link to home | |
| 5.5 | Auth redirect | Open app logged out | Login screen; no flash of tabs | |
| 5.6 | Post-login redirect | Log in or sign up | Tabs (Home) | |

---

## 6. Loading, empty, and error states

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 6.1 | Auth loading | During sign-in/sign-up | Button loading state | |
| 6.2 | Import loading | During geocode/save | Disabled buttons; "Looking up…" / "Saving…" | |
| 6.3 | Paywall loading | While loading offerings | Loading indicator / copy | |
| 6.4 | Subscription status (Settings) | While refreshing | Loading or current status | |
| 6.5 | Empty portfolio | No imports | Empty state with CTA | |

---

## 7. Offline and API failure

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 7.1 | Offline login | Disable network; try sign in | Error message | |
| 7.2 | Offline import | Disable network; try address import | Error or timeout message | |
| 7.3 | Offline paywall | Disable network; open paywall | Fallback message; Retry when back online | |
| 7.4 | Restore offline | Restore purchases with no network | "Unable to restore" / offline message | |

---

## 8. Security and production readiness

| # | Test | Steps | Expected | Pass |
|---|------|--------|----------|------|
| 8.1 | No debug UI (release) | Build release; open Settings | No "Debug (dev only)" section | |
| 8.2 | No test credentials | Use production env | No demo@ or test logins | |
| 8.3 | Session expiry | Invalidate session (e.g. delete in dashboard); use app | Redirect to login or re-auth | |

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| QA | | |
| Dev | | |

---

*Use alongside [`../archive/ios-audit/release_blocker_report.md`](../archive/ios-audit/release_blocker_report.md) and [`../archive/ios-audit/launch_candidate_summary.md`](../archive/ios-audit/launch_candidate_summary.md) for release and App Store submission.*
