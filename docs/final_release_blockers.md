# PropFolio — Final Release Blockers

**Purpose:** Triage list of issues that could block iOS App Store release. Resolve or explicitly accept before marking GO in launch_go_no_go.md.  
**Last updated:** [DATE]  
**Build:** expo-app, iOS

---

## 1. Severity definitions

| Severity | Meaning | Action |
|----------|--------|--------|
| **P0 – Blocker** | Must fix before release. App Store rejection risk, safety, or critical broken flow. | Fix and re-verify. |
| **P1 – Should fix** | Should fix before release. User-facing bug or compliance gap; may cause rejection or support load. | Fix or document acceptance and mitigate. |
| **P2 – Nice to have** | Can ship; fix in next release. | Defer; add to launch_go_no_go "Known issues" if shipping. |

---

## 2. Current blockers (add as found)

*Use this section to list issues found during RC sweep or manual/E2E testing. Start empty; add rows when issues are identified.*

| ID | Severity | Area | Description | Status |
|----|----------|------|-------------|--------|
| — | — | — | No open blockers from code verification sweep. | — |

**Instructions:** When a new issue is found, add a row with ID (e.g. RC-1), Severity (P0/P1/P2), Area (e.g. Auth, Paywall, Import), Description, and Status (Open / In progress / Fixed / Accepted).

---

## 3. Code verification sweep — findings (no new P0/P1)

The following were **verified in code** during the final RC sweep. No **new** P0 or P1 issues were introduced; existing fixes from release_blocker_report.md are assumed in place.

| Check | Result |
|-------|--------|
| Sign up, login, logout, password reset, update password, delete account | Implemented; validation and errors; session redirect; delete uses Edge Function. |
| Free import limit and paywall trigger | canImport and showPaywallForBlocked; at-limit card and alert. |
| Purchase flow and restore purchases | usePaywallState; getRestoreOutcome (success, no_purchases, failed, offline). |
| Support and legal links | openUrlSafe used in Settings, Paywall, Sign-up; Alert on open failure. |
| Offline / API failure | Timeout and retry in edgeFunctions; fallback offerings; offline restore message. |
| Invalid input | Auth and import validation; getAuthErrorMessage. |
| Session expiry redirect | (tabs)/_layout and update-password redirect when session === null. |
| Debug UI in release | Settings Debug section and simulate-at-limit gated by __DEV__. |
| Demo/placeholder in production | Demo user only when getSupabase() null; form placeholders are input hints only. |

**If manual or E2E testing finds issues,** add them to Section 2 (Current blockers) and update severity. Re-run tests after fixes and clear blockers before marking GO.

---

## 4. Pre-existing items (from release_blocker_report.md)

These were previously documented; ensure they remain fixed:

| Item | Severity | Status (from prior report) |
|------|----------|----------------------------|
| Update-password without session | S2 | Fixed — redirect to login when !session. |
| Import: "Coming soon" for Zillow/Redfin link | S2 | Fixed — actionable copy. |
| Paywall: Legal link error handling | S2 | Fixed — openUrlSafe. |
| Forgot-password: Dev-oriented message | S2 | Fixed — generic message when !isAuthConfigured. |

---

## 5. Triage workflow

1. **During RC testing:** Log any failure or concern in Section 2 with severity.  
2. **P0:** Fix before release; re-test.  
3. **P1:** Fix or explicitly accept with mitigation (document in launch_go_no_go "Known issues").  
4. **P2:** Defer; optional to list in launch_go_no_go.  
5. When Section 2 has no open P0/P1 (or all accepted), launch_go_no_go gate #1 is satisfied.

---

*Keep this file updated until release. Link to rc_test_results.md and launch_go_no_go.md.*
