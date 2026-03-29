# PropFolio — Versioning Policy

How we assign and use version numbers and build numbers for the app and (optionally) backend.

---

## 1. Version scheme

We use **Semantic Versioning (SemVer)** for the **marketing / user-visible version**:

```
MAJOR.MINOR.PATCH
```

| Segment | Meaning | When to bump |
|---------|---------|----------------|
| **MAJOR** | Breaking or major product change. | Incompatible API or data changes; major UX or product pivot that breaks expectations. |
| **MINOR** | New features, backward-compatible. | New screens, new flows, new capabilities. No breaking change for existing users. |
| **PATCH** | Bug fixes and small fixes. | Hotfixes, crash fixes, copy/layout fixes, minor backend fixes that don’t change behavior contract. |

### Examples

- `1.0.0` → First App Store release.
- `1.1.0` → New feature (e.g. property list view).
- `1.0.1` → Hotfix (e.g. fix login crash).
- `2.0.0` → Breaking change (e.g. new auth flow that invalidates old sessions; or major API change).

---

## 2. Where version is stored

### App (expo-app)

| Asset | Location | Notes |
|-------|----------|--------|
| **Marketing version** | `expo-app/app.json` → `expo.version` | Must match “Version” in App Store Connect for the build you upload. |
| **iOS build number** | `expo-app/app.json` → `expo.ios.buildNumber` (if set), or EAS build config / Xcode | Must be a **monotonically increasing** integer per version. Each build submitted to App Store Connect must have a higher build number than the previous one for that version (or for the next version). |
| **package.json** | `expo-app/package.json` → `version` | Keep in sync with `app.json` for consistency (e.g. `1.0.0`). |

### Single source of truth

- **Primary:** `expo-app/app.json` → `expo.version` and (if used) `expo.ios.buildNumber`.
- Bump these when cutting a release or hotfix; keep `package.json` version aligned.

---

## 3. Build number rules (iOS)

- **Unique per build:** Every binary you upload to App Store Connect must have a build number **greater** than any previously accepted build (for that app and version, or for the next version).
- **Common pattern:**  
  - Version `1.0.0`, first build → build `1`.  
  - Version `1.0.0`, second build (e.g. hotfix resubmit) → build `2`.  
  - Version `1.1.0`, first build → build `3` (or start at `1` for the new version; Apple allows either as long as it’s greater than the previous **build**).
- **Practical:** Increment build number for every upload (TestFlight or App Store). Example: 1.0.0 (1), 1.0.0 (2), 1.1.0 (3).

---

## 4. When to bump version

| Event | Bump | Example |
|-------|------|---------|
| First public release | Set to 1.0.0 | 0.x or 1.0.0 |
| New feature release | MINOR | 1.0.0 → 1.1.0 |
| Bug-fix / hotfix release | PATCH | 1.0.0 → 1.0.1 |
| Breaking or major change | MAJOR | 1.2.0 → 2.0.0 |
| Pre-release (optional) | Use prerelease identifiers in tags only (e.g. v1.1.0-beta.1); store version can stay 1.1.0 until release. | — |

---

## 5. Backend / Edge Functions

- Supabase Edge Functions do not have a single “app version” field. Deployments are tracked by:
  - Git commit or tag (e.g. deploy from `v1.0.0`).
  - Supabase dashboard deployment history.
- **Recommendation:** When you cut a release (e.g. tag `v1.0.0`), deploy the **same commit**’s `supabase/functions` to production so app and backend are in sync. Document in release notes or runbook which tag/commit was deployed for backend.

---

## 6. Git tags and version

- **Tag format:** `vMAJOR.MINOR.PATCH` (e.g. `v1.0.0`).
- Tag the commit that has the **release version** in `app.json` (and the build number you used for that release).
- Do not reuse or move a tag after a build has been submitted to the store; create a new version and tag for any change.

---

## 7. Checklist for a new version

- [ ] Decide MAJOR / MINOR / PATCH per this policy.
- [ ] Update `expo-app/app.json` → `expo.version`.
- [ ] Update `expo-app/app.json` → `expo.ios.buildNumber` (or your EAS/Xcode config) to a new, higher build number.
- [ ] Update `expo-app/package.json` → `version` to match.
- [ ] Commit, merge to `main`, then tag: `git tag -a vX.Y.Z -m "Release X.Y.Z: description"`.
- [ ] Build from that commit; upload to TestFlight/App Store with the same version and build number.

---

*See also: `release_management_plan.md`, `rollback_runbook.md`.*
