# Documentation index

Repo-wide engineering and product docs. The **shipping app** is **`expo-app/`** (see root **`README.md`** and **`PROP_FOLIO_TARGET_STRUCTURE_BLUEPRINT.md`**).

## Start here

| Topic | Doc |
|--------|-----|
| Expo app run / EAS | **`expo-app/README.md`**, **`expo-app/docs/LAUNCH_AND_TEST.md`** |
| Env vars (production matrix) | **`production_env_matrix.md`** |
| API keys & subscriptions | **`API-KEYS-AND-SUBSCRIPTIONS.md`** |
| Supabase / backend setup | **`SETUP-BACKEND-CONFIG.md`**, **`DEPLOY-EDGE-FUNCTIONS.md`** |
| Auth MVP notes | Root **`AUTH_MVP_SIMPLIFICATION_SUMMARY.md`** |
| Repo layout blueprint | Root **`PROP_FOLIO_TARGET_STRUCTURE_BLUEPRINT.md`** |
| Post-cleanup summary (what moved, what’s next) | Root **`PROJECT_CLEANUP_SUMMARY.md`** |

## Themed folders (post–structure cleanup)

| Folder | Contents |
|--------|----------|
| **`docs/monitoring/`** | Firebase Crashlytics manual steps, release verification, setup plan |
| **`docs/security/`** | Env matrix, secrets audit, client vs server secret boundary |
| **`docs/archive/migrations/`** | Historical Sentry → Crashlytics migration audits |
| **`docs/release/`** | Versioning, rollback runbook, release management (plus existing App Store subfolders) |

## Expo-only docs

Live under **`expo-app/docs/`**, including **`MONITORING_SETUP.md`**, **`EXPO_EAS_FIREBASE_IOS.md`**, **`RELEASE_CHECKLIST.md`**, **`archive/ios-audit/`**, and **`compliance/`**.
