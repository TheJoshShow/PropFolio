# PropFolio — Launch Go / No-Go

**Purpose:** Single place to record the final go/no-go decision for iOS App Store release.  
**Date:** [DATE]  
**Build:** expo-app, iOS (Expo / React Native)

---

## 1. Go / No-Go result

| Decision | Check one |
|----------|-----------|
| **GO** — Release to App Store | ☐ |
| **NO-GO** — Do not release; resolve blockers first | ☐ |

**Date decided:** _______________  
**Decided by:** _______________

---

## 2. Gate criteria

Before marking **GO**, all of the following must be satisfied:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | No open **P0/P1 release blockers** (see final_release_blockers.md). | ☐ |
| 2 | **RC test results** (rc_test_results.md): code verification complete; critical manual/E2E paths run on **release build** and passed (or known issues documented and accepted). | ☐ |
| 3 | **Production env** set per app_store_release_env_checklist.md (Supabase, RevenueCat, Privacy/Terms/Support URLs). | ☐ |
| 4 | **App Store Connect** ready: Privacy Policy URL, Support URL, subscription products, screenshots, version/build. | ☐ |
| 5 | **Legal/compliance:** Terms and Privacy Policy live; account deletion, restore purchases, and manage subscription working. | ☐ |
| 6 | **No debug UI** and no demo/placeholder content in production build (__DEV__ and env checks confirmed). | ☐ |
| 7 | **Secrets:** No service role or server API keys in client; secret boundary audit (secret_boundary_audit.md) and env checklist signed off. | ☐ |

---

## 3. Known issues / deferred (if any)

List any known minor issues that are **accepted for launch** (e.g. S3 / nice-to-have). Do not list P0/P1 here; those must be fixed or explicitly downgraded and documented.

| Issue | Severity | Decision (e.g. "Ship; fix in 1.0.1") |
|-------|----------|--------------------------------------|
| | | |
| | | |

---

## 4. Sign-off (optional but recommended)

| Role | Name | Date |
|------|------|------|
| Technical / CTO | | |
| Product / Lead | | |
| Compliance / Legal (if applicable) | | |

---

## 5. Post-launch

- [ ] Monitor App Review feedback and first user reports.
- [ ] Track crash-free rate (e.g. Sentry) and subscription/restore support tickets.
- [ ] Plan 1.0.1 for any deferred items or quick fixes.

---

*Update this document when the final go/no-go decision is made. Keep final_release_blockers.md and rc_test_results.md current until release.*
