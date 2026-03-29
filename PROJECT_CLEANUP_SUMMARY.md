# PropFolio — project cleanup summary

**Last updated:** 2025-03-21 (post-restructure verification pass)

This document complements **`PROP_FOLIO_TARGET_STRUCTURE_BLUEPRINT.md`**: it records what the restructuring achieved, why, what still needs human review, and sensible next steps. It is **not** a substitute for the blueprint’s target layout.

---

## What changed (restructure + verification)

| Area | Change |
|------|--------|
| **Subscription code** | `expo-app/src/subscription/` removed; **`expo-app/src/features/subscriptions/entitlementPolicy.ts`** (+ tests) is canonical; **`SubscriptionContext`** imports from `features/subscriptions`. |
| **Empty `src` folders** | Removed **`expo-app/src/features/auth/`** and **`expo-app/src/dev/`** (were empty). |
| **Repo-root markdown** | Operational and audit docs moved to **`docs/monitoring/`**, **`docs/security/`**, **`docs/archive/migrations/`**, **`docs/release/`**. |
| **`expo-app/` root markdown** | Audits → **`expo-app/docs/archive/ios-audit/`**; compliance matrices → **`expo-app/docs/compliance/`**; **`RELEASE_CHECKLIST.md`** → **`expo-app/docs/RELEASE_CHECKLIST.md`**. |
| **Entry docs** | Root **`README.md`** is Expo-first; **`docs/README.md`** indexes key guides; **`PropFolio/README.md`** labels Swift as legacy. |
| **Cross-links** | Markdown references to moved files were updated; **`node scripts/verify-markdown-links.mjs`** is used to guard regressions. |

---

## Why it changed

- **Single mental model:** MVP ships from **`expo-app/`**; docs and subscription policy paths should not fork across `src/subscription` vs `features/subscriptions`.
- **Less root noise:** Founders and new contributors hit **`README.md`** + **`docs/README.md`** instead of a dozen loose `*.md` files at repo root.
- **Expo/EAS safety:** No changes to **`expo-app/app/`** (Expo Router), **`app.config.ts`**, or **`eas.json`** layout — only organization and TypeScript import paths for entitlement policy.

---

## What still needs review

1. **Two release checklists** — **`app_store_release/release_checklist.md`** (store bundle) vs **`expo-app/docs/RELEASE_CHECKLIST.md`** (app/engineering). Decide whether to cross-link only or merge overlapping sections.
2. **Swift tree** — **`PropFolio/`** remains in-repo as legacy; archiving to another branch/repo is a **product** decision, not done here.
3. **`docs/FILE-TREE.md`** — May still describe an older tree; refresh when you want parity with the blueprint.
4. **Historical audits** — Some files (e.g. **`docs/app_store_compliance_audit.md`**, **`docs/rc_test_results.md`**) still mention **`subscriptionDebugOverrides`** as a past compliance topic. Code path is gone; those rows are **historical** unless you reintroduce a dev override module.
5. **Blueprint Part C item 1** — Root README already reflects MVP = `expo-app`; optional tweak: explicitly link **`docs/README.md`** in the first bullet (already linked elsewhere in README).

---

## Package cleanup suggestions

- **No packages were removed** during restructuring; **`npm run validate`** in **`expo-app/`** passes.
- **Optional later:** Run **`npx depcheck`** (or Expo’s dependency tools) on **`expo-app/`** after a feature freeze — false positives are common with Metro/Expo.
- **Do not remove** **`@react-native-firebase/*`** or **`react-native-purchases`** without replacing crash reporting and IAP flows.

---

## Environment variable cleanup suggestions

- **`EXPO_PUBLIC_SENTRY_DSN`** — **Obsolete**; remove from any local **`.env`**, EAS dashboard, or team runbooks if still present. **`expo-app/.env.example`** already warns not to add it.
- **Firebase** — Prefer **`GOOGLE_SERVICES_INFO_PLIST`** (EAS file var) or committed plist for local builds; see **`docs/monitoring/FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`**.
- **Re-run** **`docs/production_env_matrix.md`** against **`expo-app/.env.example`** after adding new **`EXPO_PUBLIC_*`** keys.

---

## Next cleanup opportunities (incremental)

1. **Thin large tab screens** — Split **`app/(tabs)/*`** into **`features/*`** + hooks per blueprint Part C §6.
2. **Founder docs** — Consider merging **`founder_docs/`** into **`docs/founder/`** or linking from **`docs/README.md`** only.
3. **`expo-app/src/store/index.ts`** — Placeholder barrel; either adopt minimal global state or delete when unused (grep before removing).
4. **`expo-app/_quarantine/`** — Review **`docs/release/AUDIT-OBSOLETE-UNUSED.md`**; delete quarantined files when comfortable.
5. **Jest teardown** — Tests complete successfully but Jest may report open handles; use **`npm run test:open-handles`** occasionally to find leaks.

---

## Verification record (this pass)

| Check | Result |
|--------|--------|
| Stale import **`../subscription/entitlementPolicy`** | **None found** (grep TS/TSX). |
| **`npm run validate`** (`expo-app/`) | **Pass** (typecheck + 149 tests). |
| **Markdown relative links** | **`scripts/verify-markdown-links.mjs`** — **OK** |
| **Doc drift** | **Fixed** references to removed **`expo-app/src/dev/subscriptionDebugOverrides.ts`** in active guides (`AUTH-FREE-TIER…`, `FREE-TO-PAID…`, `audit_report_ios_only`, `AUDIT-CODEBASE-BEFORE-SUBSCRIPTIONS`, `cleanup_candidates.csv`). |
| **Blueprint alignment** | **Matches** target layout for routes, `src/` roles, doc hubs, subscriptions folder, removed empty dirs; **intentional gaps** listed above (Swift archive, dual checklists, FILE-TREE). |

---

## Related files

- **`PROP_FOLIO_TARGET_STRUCTURE_BLUEPRINT.md`** — Target structure and rules.
- **`docs/README.md`** — Documentation index.
- **`expo-app/README.md`** — Run, env, and monitoring entry points.
