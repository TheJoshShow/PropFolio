# PropFolio — Rollback Runbook

When to roll back, how to roll back the **app** (App Store) and **backend** (Supabase), and how to communicate.

---

## 1. When to consider rollback

- **App:** Critical crash, login/signup broken, payment or subscription flow broken, data loss or corruption, or a security issue introduced in the latest release.
- **Backend:** Edge Function or DB change causes widespread errors, auth failures, or data issues.

Rollback is a last resort. Prefer a **hotfix** (new patch release) if the fix is quick and you can ship within 24–48 hours; otherwise roll back first, then fix and re-release.

---

## 2. App rollback (iOS / App Store)

Apple does not support “reverting” a live app to a previous binary. Users keep the version they have until they update. You can only control what **new** users get and what **updates** you offer.

### Option A: Stop promoting the new version (soft rollback)

- **Action:** In App Store Connect, remove the app from sale (or use phased release to halt further rollout if you use it).
- **Effect:** New users cannot install; existing users keep their current version (including the bad one if they already updated).
- **When:** You have a hotfix coming soon and the issue is not affecting all users severely.

### Option B: Release a new version that reverts the problem (recommended)

- **Action:** From `main`, revert the offending commit(s) or branch from the **previous release tag** (e.g. `v1.0.0`), bump **PATCH** (e.g. `1.0.1`) and **build number**, then build and submit a new version.
- **Effect:** New build is effectively “previous good state” plus version bump. Users who update get the fix.
- **Steps:** See “Rollback checklist” below.

### Option C: Do nothing (if issue is minor)

- If the bug is rare or cosmetic, you may choose to fix forward with a patch release and not “roll back” anything.

---

## 3. Rollback checklist (app)

Use this when you decide to ship a **new** version that is the previous good state (Option B).

- [ ] **Identify last known good version:** e.g. `v1.0.0` (tag or commit).
- [ ] **Create rollback branch:**  
  `git checkout -b hotfix/v1.0.1 main`  
  (or branch from the tag: `git checkout -b hotfix/v1.0.1 v1.0.0` and then cherry-pick only non-broken fixes if needed.)
- [ ] **Revert bad commit(s):**  
  `git revert <commit-hash> --no-edit`  
  Or, if branching from tag, do not bring in the bad commits.
- [ ] **Bump version and build:** In `expo-app/app.json`: set `version` to next PATCH (e.g. `1.0.1`); set iOS `buildNumber` to a value **higher** than the bad release’s build.
- [ ] **Build:** Produce a new iOS build (EAS or Xcode) from this branch.
- [ ] **Smoke-test:** Install the new build; verify login, core flows, and the reverted fix.
- [ ] **Merge to main:** PR from `hotfix/v1.0.1` into `main`; merge.
- [ ] **Tag:**  
  `git tag -a v1.0.1 -m "Rollback release 1.0.1 (revert of 1.1.0 issues)"`  
  `git push origin v1.0.1`
- [ ] **Upload to App Store Connect:** New build, new version or new build number for same version (per Apple rules).
- [ ] **Submit for review** (or release to TestFlight first, then submit).
- [ ] **Document:** Note in release notes or internal doc that this is a rollback/hotfix for [issue].
- [ ] **Monitor:** Watch crash reporting and support after rollout.

---

## 4. Backend rollback (Supabase)

### Edge Functions

- **Option 1 — Redeploy previous version:** If you have a previous deployment (e.g. in Supabase dashboard or via CLI), redeploy that version of the function.
- **Option 2 — Revert in Git and redeploy:** Revert the function’s code to the previous commit, then deploy:
  ```bash
  git show <previous-commit>:supabase/functions/delete-account/index.ts > supabase/functions/delete-account/index.ts
  supabase functions deploy delete-account
  ```
  Repeat for any other affected functions.
- **Option 3 — Fix forward:** If reverting is hard, fix the bug in the function and deploy the fix; prefer this if it’s a one-line fix.

### Database (migrations)

- **Avoid rolling back migrations** in production unless you have a tested rollback script and a backup. Prefer **fix-forward** migrations (e.g. add a column or fix data) unless you have clear rollback procedures and a recent backup.
- If you must roll back a migration: restore from backup in a maintenance window, or run a reverse migration script that you have tested in staging.

### Secrets / env

- If a rollback is due to a bad secret (e.g. wrong API key): update the secret in Supabase Dashboard → Edge Functions → Secrets to the correct value and redeploy the function if needed.

---

## 5. Communication

- **Internal:** Notify team in your normal channel (Slack, etc.) that a rollback is in progress and what the issue is.
- **Users:** If the issue is widespread and visible (e.g. app unusable), consider in-app message or status page: “We’re aware of an issue and are rolling out a fix. Please update to the latest version.”
- **App Store review:** If you submit a new version as a rollback, release notes can say: “This update includes important stability fixes. Please update.”

---

## 6. Post-rollback

- [ ] Root cause documented (what broke, why).
- [ ] Fix or test added so the same issue does not recur.
- [ ] Release management plan or runbook updated if you discovered a gap.

---

*Keep this runbook next to `release_management_plan.md` and `versioning_policy.md`.*
