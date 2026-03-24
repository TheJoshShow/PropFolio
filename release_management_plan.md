# PropFolio — Release Management Plan

Safe release structure for the PropFolio repo: branches, environments, tagging, hotfixes, and promotion.

---

## 1. Release branch strategy

### Long-lived branches

| Branch | Purpose | Protection |
|--------|---------|------------|
| **main** | Production-ready code. Every commit on `main` is deployable; tags mark releases. | Require PR; no direct push. Optional: require status checks before merge. |
| **develop** (optional) | Integration branch for features. Merge to `main` when release is cut. | Use if you run a two-branch flow; otherwise work from `main` with short-lived branches. |

### Short-lived branches

| Type | Naming | Base | Merge into |
|------|--------|------|------------|
| **Feature** | `feature/<short-name>` or `feat/description` | `main` (or `develop`) | `main` (or `develop`) |
| **Release** | `release/vX.Y.Z` | `main` | `main` (after version bump + tag) |
| **Hotfix** | `hotfix/vX.Y.Z` or `hotfix/description` | `main` | `main` |

### Recommended default (small team)

- **Single default branch: `main`.**
- All work in feature branches; merge to `main` via PR.
- For a release: create `release/vX.Y.Z` from `main`, bump version and build in that branch (or bump on `main` and tag). Tag from the commit that has the release version.
- Hotfixes: branch from `main` → fix → PR → merge → tag hotfix.

---

## 2. Versioning strategy

- **Scheme:** Semantic Versioning (SemVer) `MAJOR.MINOR.PATCH`.
- **Where:** `expo-app/app.json` → `expo.version` (marketing version). iOS build number in `expo.ios.buildNumber` or EAS/Xcode (must increase every App Store upload).
- **When to bump:** See `versioning_policy.md`.

Summary:

- **PATCH:** Bug fixes, small fixes, no new features. Bump for hotfixes and patch releases.
- **MINOR:** New features, backward-compatible. Bump for regular releases.
- **MAJOR:** Breaking changes (API, data, or UX). Bump when you intentionally break compatibility.

---

## 3. Hotfix strategy

### When to use a hotfix

- Critical bug in production (crashes, data loss, security, payment/auth broken).
- Fix is small and low-risk; can be tested quickly.

### Steps

1. **Branch from `main`:**  
   `git checkout main && git pull && git checkout -b hotfix/vX.Y.Z`  
   (Use next PATCH version, e.g. `1.0.1`.)

2. **Make minimal change:** Only the fix; no unrelated features or refactors.

3. **Bump version:** In `expo-app/app.json` set `version` to `X.Y.Z`. Bump iOS build number (e.g. in `app.json` under `expo.ios.buildNumber` or in EAS config).

4. **Test:** Run app and any relevant tests; verify fix and no regression.

5. **Merge to `main`:**  
   PR from `hotfix/vX.Y.Z` → `main`. Review and merge.

6. **Tag release:**  
   `git tag -a vX.Y.Z -m "Hotfix X.Y.Z: brief description"`  
   Push tag: `git push origin vX.Y.Z`.

7. **Build and ship:** Build from `main` (or from the tag), upload to TestFlight/App Store. Document in release notes as a hotfix.

8. **Backport (optional):** If you maintain `develop`, cherry-pick the hotfix commit onto `develop`.

---

## 4. Release tagging convention

### Tag format

- **Releases:** `vMAJOR.MINOR.PATCH` (e.g. `v1.0.0`, `v1.1.0`, `v1.0.1`).
- **Pre-releases (optional):** `v1.1.0-beta.1`, `v1.1.0-rc.1`. Use if you want to tag TestFlight builds before store release.

### Rules

- Tag only from `main` (from the commit that has the release version in `app.json`).
- Annotated tags preferred:  
  `git tag -a v1.0.0 -m "Release 1.0.0: initial App Store release"`.
- Never move or overwrite a tag that has been used for a store build; create a new version/tag for any change.

### Example

```bash
git checkout main
git pull
# Ensure app.json version is 1.0.0
git tag -a v1.0.0 -m "Release 1.0.0: initial App Store release"
git push origin v1.0.0
```

---

## 5. Environment promotion checklist

Use this when moving a build from one stage to the next (e.g. TestFlight → App Store).

### Environments (typical)

| Environment | Purpose | Config / build |
|-------------|---------|----------------|
| **Local / dev** | Day-to-day development. | `.env` with dev Supabase (or demo); no store keys required. |
| **TestFlight (staging)** | Internal/external beta. | Same or separate Supabase project; RevenueCat sandbox; env from EAS secrets or `.env` for build. |
| **Production** | App Store live. | Production Supabase, RevenueCat production, production crash reporting; env from EAS secrets. |

### Promotion: Dev → TestFlight

- [ ] Version and build number set in `expo-app/app.json` (and EAS if used).
- [ ] Branch is `main` (or release branch) and up to date.
- [ ] TestFlight env vars set (Supabase, RevenueCat sandbox, crash reporting if used).
- [ ] Build succeeds (e.g. `eas build --platform ios --profile preview` or your profile).
- [ ] Build uploaded to TestFlight; install and smoke-test.
- [ ] No secrets or dev-only URLs in the build (use env for all endpoints and keys).

### Promotion: TestFlight → Production (App Store)

- [ ] Release version and build number are final (and match App Store Connect after upload).
- [ ] Production env used for build: production Supabase, RevenueCat production, production crash reporting.
- [ ] Legal URLs (Privacy, Terms, Support) point to production and match App Store Connect.
- [ ] Tag created: `vX.Y.Z` from the release commit.
- [ ] Release checklist and app store release docs completed (see `app_store_release/release_checklist.md`).
- [ ] Build uploaded to App Store Connect; “What’s New” and metadata updated.
- [ ] Submit for review (or release if using phased release).

### Post-release

- [ ] Tag pushed: `git push origin vX.Y.Z`.
- [ ] Release notes or changelog updated (optional but recommended).
- [ ] Monitor crash reporting/crashes and support for 24–48 hours.

---

## 6. Rollback

If a production release causes critical issues, use the **rollback runbook** (`rollback_runbook.md`) to revert to the previous App Store version or to a previous backend state.

---

## 7. Document references

| Document | Purpose |
|----------|---------|
| **versioning_policy.md** | When and how to bump MAJOR.MINOR.PATCH; where version lives. |
| **rollback_runbook.md** | Step-by-step rollback (app and backend). |
| **app_store_release/release_checklist.md** | Pre-submit checklist for each store release. |

---

*Update this plan when you add environments (e.g. staging Supabase) or change branching.*
