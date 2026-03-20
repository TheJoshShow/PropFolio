# PropFolio — TestFlight Plan

Use this for **internal testing**, **external beta**, and **feedback collection** before App Store release.

---

## Internal test checklist

Run through these with your team (and yourself) on each build you upload to TestFlight.

### Build & install
- [ ] Archive and upload from Xcode (or EAS Build) with correct scheme and version/build.
- [ ] Build appears in App Store Connect → TestFlight → iOS Builds.
- [ ] Install via TestFlight app on a physical device (recommended: same iOS version as your minimum).
- [ ] App launches; no crash on cold start.

### Auth
- [ ] Sign up with a new email; receive confirmation if required.
- [ ] Sign in with email/password.
- [ ] Forgot password sends email (if configured).
- [ ] Sign out; app returns to login.
- [ ] Sign in again; session persists after kill and reopen.

### Core flow
- [ ] Home shows; "Add property" goes to Import.
- [ ] Import: paste Zillow/Redfin link → see message to use address.
- [ ] Import: enter U.S. address → autocomplete appears (with network).
- [ ] Import: complete address → geocode + rent estimate; "Property added" (or error message if API fails).
- [ ] Second import succeeds; after 2nd, 3rd attempt shows paywall or upgrade CTA.
- [ ] Paywall: plans load; "Restore purchases" and "Manage subscription" work (or show fallback).
- [ ] Sandbox purchase: complete a Pro purchase; entitlement activates; paywall dismisses or shows "You have Pro."
- [ ] Settings: Restore purchases shows appropriate outcome (e.g. "Purchases restored" or "No purchases found").
- [ ] Settings: Manage subscription opens system UI or fallback message.
- [ ] Settings: Privacy Policy and Terms open correct URLs.
- [ ] Settings: Contact support opens correct URL or mailto.
- [ ] Account deletion: flow completes; user is signed out; no crash.

### Edge cases
- [ ] Offline: import shows error or timeout; restore shows offline message when applicable.
- [ ] Update password: works when logged in; redirects to login when not logged in (if implemented).
- [ ] No debug UI visible in this build (no "Debug (dev only)" in Settings).

### Sign-off
- [ ] **Internal tester name:** ________________  **Date:** ________________

---

## External beta checklist

Before inviting external testers:

### App Store Connect setup
- [ ] Build is in "Ready to Submit" or "Testing" state.
- [ ] **Test Information** (TestFlight tab) filled: What to Test, Feedback email, optional contact.
- [ ] **Export Compliance:** Answered (e.g. No encryption, or describe if you use encryption).
- [ ] **Content Rights / Advertising Identifier:** Answered as required.
- [ ] **Testers:** Group created; external testers added (email). Or public link enabled if using public beta.

### Instructions to testers
- [ ] Send short email or in-app message with:
  - Link to install TestFlight and then install PropFolio.
  - "What to test": e.g. "Sign up, add 2 properties by address, try to add a 3rd (you’ll see the paywall). Try Restore purchases and Contact support from Settings."
  - How to send feedback (see below).
  - Ask them to report: crashes, anything that blocks use, and whether the paywall and subscription flow make sense.

### During beta
- [ ] Monitor TestFlight **Crashes** (if enabled) and **Feedback** from testers.
- [ ] Check App Store Connect → TestFlight for tester status (installed, sessions).
- [ ] Fix critical bugs and upload a new build; notify testers to update.

---

## Feedback collection instructions

### For testers

**How to send feedback:**

1. **In-app (preferred):** Settings → **Contact support**. Describe the issue or suggestion and send.
2. **TestFlight:** After reproducing an issue, shake the device (or use the TestFlight feedback form if you enabled it) and submit feedback with a short description.
3. **Email:** Reply to the Feedback email you provided in TestFlight (e.g. feedback@yourdomain.com).

**What to include:**
- What you were doing (e.g. "Adding a property by address").
- What you expected vs what happened.
- Device and iOS version (e.g. iPhone 14, iOS 17.2).

**What we’re especially interested in:**
- Does the paywall and "Restore purchases" flow make sense?
- Any screen that feels broken or confusing?
- Do Privacy Policy and Terms links open correctly?

### For you (team)

- [ ] Log feedback in a simple list (spreadsheet or doc): date, tester, issue, severity.
- [ ] Triage: fix blockers before release; note nice-to-haves for later.
- [ ] Close the loop: thank testers and tell them when the next build or public release is.

---

## Pre–external beta gate

Do not start external beta until:

- [ ] At least one full internal test pass is done (see Internal test checklist).
- [ ] Support URL (and Feedback email) are valid and monitored.
- [ ] You have at least one build that passes "Export Compliance" and any required TestFlight questions.

---

*Update this plan when you add new features or change how testers should test (e.g. new flows, new permissions).*
