# PropFolio – iOS-Only Cleanup Log

**Date:** March 2025  
**Reference:** audit_report_ios_only.md, cleanup_candidates.csv, ios_conversion_plan.md

---

## 1. Deletions performed

### 1.1 Safe to delete / Delete after verification

| Item | Reason deleted | Reference verification method |
|------|----------------|--------------------------------|
| **expo-app/expo-app/** (entire directory) | Nested duplicate of expo-app with its own node_modules; no build or app references. First delete succeeded in part; folder may still exist due to Windows long-path limits. Remove manually if present. | Grep for `expo-app/expo-app` in package.json, tsconfig, app code, CI: only docs referenced it. CODEBASE-AUDIT-REPORT and CLEANUP-SUMMARY stated it was an orphan duplicate. |
| **_archive_review/** (entire directory) | Archived Vite/React web package; not used by expo-app. | Grep for `_archive_review` in repo: only docs referenced it; no imports, routes, or scripts. |
| **expo-app/app/+html.tsx** | Web-only root HTML for static web build; iOS-only app does not use web export. | No imports or route registrations reference +html; Expo Router uses it only for web platform. |
| **expo-app/assets/images/android-icon-foreground.png** | Android adaptive icon; app.json android block removed. | Only app.json referenced it; reference removed before deletion. |
| **expo-app/assets/images/android-icon-background.png** | Android adaptive icon; app.json android block removed. | Same as above. |
| **expo-app/assets/images/android-icon-monochrome.png** | Android adaptive icon; app.json android block removed. | Same as above. |
| **expo-app/assets/images/favicon.png** | Web favicon; web block removed from app.json. | Only app.json web.favicon referenced it; reference removed before deletion. |

### 1.2 Config / script / code changes (no file deletion)

| Change | Reason |
|--------|--------|
| **app.json** | Removed `android` and `web` keys (iOS-only target). |
| **package.json** | Removed scripts `"android"` and `"web"`. |
| **app/_layout.tsx** | Sentry init: `isWeb` → `isIOS`; init only when `Platform.OS === 'ios'`. |
| **app/(tabs)/_layout.tsx** | SymbolView: use string name (e.g. `"house.fill"`) for iOS instead of `{ ios, android, web }`. |
| **app/(tabs)/settings.tsx** | Removed `Platform.OS === 'web'` branches (manage subscription, restore disabled, web hint); removed unused `Platform` import. |
| **app/paywall.tsx** | Removed web early-return and `Platform.OS !== 'web'` conditionals; removed unused `Platform` import. |
| **src/contexts/AuthContext.tsx** | WebBrowser.maybeCompleteAuthSession guarded with `Platform.OS === 'web'` (no behavioral change for iOS). |
| **src/services/supabase.ts** | Kept web branches behind `typeof Platform !== 'undefined' && Platform.OS === 'web'` for type safety. |
| **src/config/billing.ts** | `isBillingConfigured()` and `getRevenueCatApiKey()` simplified to iOS only; Android branch removed. |
| **src/features/paywall/PaywallContent.tsx** | Removed `Platform.OS !== 'web'` wrapper around legal row; removed unused `Platform` import. |
| **src/features/paywall/paywallCopy.ts** | Updated `webSubtitle` to "in the PropFolio app" (iOS-only). |
| **src/utils/subscriptionManagement.ts** | `openSubscriptionManagement()` iOS-only path only; removed Android URL and branch; updated fallback copy. |
| **src/services/revenueCat.ts** | `isNative = Platform.OS === 'ios'` (was ios \|\| android). |
| **src/theme/index.ts** | Comment updated to "iOS" (was "iOS, Android, and Web"). |

---

## 2. Reference verification methods used

- **Imports / exports:** Grep for path or module name in `expo-app` (app, src); no app code imported from expo-app/expo-app or _archive_review.
- **Route registrations:** Expo Router file-based; no route points to +html (web-only entry).
- **Package scripts:** package.json and app.json only; no script referenced expo-app/expo-app or _archive_review.
- **Config references:** app.json contained the only references to android and web assets; removed before deleting assets.
- **Build references:** No EAS or CI config in repo; no build reference to deleted paths.
- **Env references:** No env vars pointed at deleted paths.
- **Asset references:** app.json checked for android-icon-* and favicon; removed in same pass.
- **Native references:** N/A for deleted folders (no native code in expo-app/expo-app for this app).

---

## 3. Uncertain items not deleted

| Item | Reason not deleted |
|------|--------------------|
| **PropFolio/** (Swift project) | Per ios_conversion_plan.md and cleanup_candidates.csv: do not delete until decision (abandon vs. replace Expo). No deletion. |
| **expo-app/_quarantine/** | Kept unchanged per audit; documented in AUDIT-OBSOLETE-UNUSED.md. |
| **react-native-web** (dependency) | Removed from package.json initially; `npm install` failed (path/postinstall issue: "Holdings" in path). Restored to package.json so existing node_modules and lockfile remain valid. **Recommendation:** Remove again when running `npm install` from a path without spaces/special characters (e.g. `C:\propfolio`) and re-run install. |
| **expo-app/expo-app/** | Delete was attempted twice; second attempt failed with "Could not find a part of the path" (Windows long-path issue under node_modules). **Remove manually** (e.g. from a short path like `C:\propfolio`, or use `robocopy` mirror trick). Folder is an orphan duplicate with no references. |

---

## 4. Not applicable / no action

- **Bucket 1 (Safe to delete immediately):** No items were in this bucket before verification; all deletions were after verification.
- **Dead screens / components / hooks / services:** None identified beyond previously quarantined modal and components; no additional dead code removed.
- **Duplicate logic consolidation:** No duplicate utilities or components were merged in this pass; Platform branches were simplified only.

---

## 5. Imports and path aliases

- No imports were broken by the deletions. Removed files (+html.tsx, assets) were not imported by app or src.
- Path aliases (`@/`, `~/`) unchanged; no updates required after cleanup.

---

## 6. Updated project tree snapshot (post-cleanup)

Top-level and expo-app (source) only; node_modules and .git omitted.

```
PropFolio/
├── docs/
│   ├── release/           # App Store, privacy, support, subscription mapping, etc.
│   ├── audit_report_ios_only.md
│   ├── cleanup_candidates.csv
│   ├── cleanup_log.md      # this file
│   ├── dependency_cleanup_report.md
│   ├── ios_conversion_plan.md
│   ├── stabilization_summary.md
│   └── ...                 # other project docs
├── supabase/               # migrations, Edge Functions, docs
├── PropFolio/              # Native Swift iOS app (unchanged; not deleted)
├── expo-app/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── +not-found.tsx
│   │   ├── paywall.tsx
│   │   ├── update-password.tsx
│   │   ├── (auth)/         # login, sign-up, forgot-password, _layout
│   │   └── (tabs)/         # index, import, portfolio, settings, _layout
│   │   # +html.tsx REMOVED
│   ├── assets/
│   │   ├── fonts/          # SpaceMono-Regular.ttf
│   │   └── images/         # icon.png, splash-icon.png (android-icon-*, favicon REMOVED)
│   ├── components/         # Themed, useColorScheme, useClientOnlyValue, etc.
│   ├── constants/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── contexts/
│   │   ├── dev/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/            # scoring, confidence, underwriting, simulation, parsers, renovation
│   │   ├── services/
│   │   ├── store/
│   │   ├── theme/
│   │   ├── types/
│   │   ├── utils/
│   │   └── test/
│   ├── _quarantine/        # unused modal and components (kept)
│   ├── app.json            # iOS only (android, web blocks REMOVED)
│   ├── package.json        # android, web scripts REMOVED
│   ├── tsconfig.json
│   └── ...
# expo-app/expo-app/ REMOVED
# _archive_review/ REMOVED
```
