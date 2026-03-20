# PropFolio — Legacy Code and Retention Decisions

**Canonical production iOS app:** expo-app (Expo / React Native).  
**Rules:** Do not migrate features into Swift. Do not delete PropFolio (Swift) yet. Mark legacy unless explicitly required later.

---

## 1. PropFolio (Swift) — legacy, retained

| Decision | Rationale |
|----------|-----------|
| **Status** | **Legacy.** Expo app is the canonical iOS app for launch. |
| **Action** | Do not delete. Do not migrate features from Expo into Swift. Leave directory in repo. |
| **Optional** | May move to `_archive_native` or similar later by separate decision; not required for iOS-only launch. |

---

## 2. expo-app/expo-app (nested directory)

| Decision | Rationale |
|----------|-----------|
| **Status** | Unreferenced duplicate (own package.json, node_modules). No build script, EAS, or app code references it. |
| **Action** | **Removal attempted;** folder may still exist (Windows long-path or permissions). **Remove manually** if desired: from a short path (e.g. `C:\pf`) or use robocopy mirror/delete. |
| **Verification** | Grep in package.json, tsconfig, app, src: no references. Docs only. |

---

## 3. _archive_review

| Decision | Rationale |
|----------|-----------|
| **Status** | Archive at repo root. |
| **Action** | **Keep as archive.** No deletion. _archive_review/web does not exist in repo. |
| **Reference** | Not used by expo-app build or app code. |

---

## 4. Retained areas (no change)

| Area | Reason |
|------|--------|
| **expo-app/_quarantine/** | Quarantined unused components; not in production path. Left as-is. |
| **expo-app/src/dev/** | __DEV__-only overrides. Removed for production readiness. |
| **supabase/** | Backend; unchanged. |
| **docs/** | Documentation; updated only where noted (e.g. APP-STORE-PRODUCTION-READINESS iOS-only). |

---

## 5. Summary

- **PropFolio (Swift):** Legacy; retained; not deleted.
- **expo-app/expo-app:** Unreferenced; remove manually if present.
- **_archive_review:** Retained as archive.
- **Expo app:** Canonical production iOS app; Phases 0–6 executed per plan.
