# PropFolio iOS-Only Launch — Final Cleanup Log

**Source of truth:** audit_report_ios_only.md, ios_conversion_plan.md, app_store_compliance_audit.md, release_blocker_report.md  
**Scope:** Phases 0–6.  
**Date:** [DATE]

---

## Phase 0: Verification

| Check | Result |
|-------|--------|
| **expo-app/expo-app** referenced by build/EAS/CI? | No. No eas.json; package.json scripts do not reference nested path. **Decision:** Remove if possible; confirmed unreferenced. |
| **_archive_review / _archive_review/web** | _archive_review exists at repo root; _archive_review/web **does not exist**. No app or build references. **Decision:** Keep _archive_review as archive; nothing to remove for web. |
| **Baseline validate** | `npm run test` passes (2 suites, 8 tests). `npm run typecheck` reports missing @sentry/react-native and react-native-purchases (optional native deps) and one code fix (openUrl → openUrlSafe in PaywallContent); fix applied. |
| **Backup branch** | Operator to create (e.g. `pre-ios-only-cleanup`). |

---

## Phase 1: Config and scripts

| Item | Action |
|------|--------|
| **app.json** | Already iOS-only: no `android` or `web` keys. No change. |
| **package.json** | No `android` or `web` scripts present. Added `description` stating production builds are iOS-only. |
| **EAS** | No eas.json in repo. When added, production profile should use `platform: ios` only; documented in release docs. |

---

## Phase 2: Assets

| Item | Action |
|------|--------|
| **android-icon-*.png, favicon.png** | Not present in expo-app/assets/images (only README found). No files deleted. |
| **icon.png, splash-icon.png, SpaceMono** | Retained for iOS. |

---

## Phase 3: Platform.OS and copy

| File | Action |
|------|--------|
| **app/_layout.tsx** | Already uses `Platform.OS === 'ios'` for Sentry. No change. |
| **app/(tabs)/_layout.tsx** | SymbolView already uses single string names (e.g. `house.fill`). No change. |
| **app/(tabs)/settings.tsx** | Already iOS subscription hint; no web branch. No change. |
| **app/paywall.tsx** | No web early-return. No change. |
| **src/contexts/AuthContext.tsx** | Web block (WebBrowser.maybeCompleteAuthSession) is no-op on iOS. Left in place. |
| **src/services/supabase.ts** | Web branches left for type safety. No change. |
| **src/utils/subscriptionManagement.ts** | Comment updated: "iOS-only production app"; behavior unchanged. |
| **src/config/billing.ts** | Already iOS-only; Android key reserved. No change. |
| **src/features/paywall/PaywallContent.tsx** | Fixed `openUrl` → `openUrlSafe` for Terms link (was missing). |
| **src/features/paywall/paywallCopy.ts** | Already iOS/PropFolio-focused. No change. |
| **Auth, Supabase, RevenueCat, import, delete-account, legal, support** | All flows left intact; no removals. |

---

## Phase 4: Optional cleanup

| Item | Decision |
|------|----------|
| **react-native-web** | Not removed (optional per plan; could break tooling). Deferred. |
| **app/+html.tsx** | Not present in expo-app/app. No action. |
| **src/store/index.ts** | Left in place; documented as reserved for future state. |

---

## Phase 5: PropFolio (Swift) and nested expo-app

| Item | Action |
|------|--------|
| **PropFolio/** | Not deleted. Marked legacy; Expo is canonical iOS app. See legacy_code_decision.md. |
| **expo-app/expo-app** | Confirmed unreferenced by any build script or app code. **Removal attempted; folder still present** (Windows long-path or permissions). **Action:** Remove manually from a short path or use robocopy mirror trick. Documented in legacy_code_decision.md and final_ios_validation_report.md. |

---

## Phase 6: Validation and release docs

| Item | Action |
|------|--------|
| **npm run validate** | `npm run test` passes. `npm run typecheck` has known issues (Sentry/Purchases modules); PaywallContent fix applied. |
| **iOS smoke test** | Operator to run on simulator/device (auth, import, paywall, restore, delete account, links). |
| **docs/release/APP-STORE-PRODUCTION-READINESS.md** | Added "iOS only" target statement at top. |

---

## Deletions summary

- **No assets or app files deleted** (no Android/web assets found).
- **expo-app/expo-app:** Removal attempted; folder may still exist; remove manually if desired.
- **PropFolio (Swift):** Not modified; legacy only.
- **_archive_review:** Kept as archive; _archive_review/web does not exist.

---

## Code fixes applied

1. **PaywallContent.tsx:** `openUrl(getTermsUrl())` → `openUrlSafe(getTermsUrl())` (Terms link).
2. **package.json:** Added description: production builds are iOS-only.
3. **subscriptionManagement.ts:** Comment updated to iOS-only production.
4. **APP-STORE-PRODUCTION-READINESS.md:** iOS-only target note.
