# Monitoring context (Crashlytics)

**Full setup, architecture, and troubleshooting:** [`MONITORING_SETUP.md`](./MONITORING_SETUP.md)

## Startup (`initMonitoring`)

After Crashlytics init and global error handlers, **`applyStartupMonitoringAttributes()`** sets:

| Key | Meaning |
|-----|---------|
| `pf_app_env` | `development` or `production` |
| `pf_app_version` | `expoConfig.version` (fallback `unknown`) |
| `pf_build_number` | iOS build from Expo Constants (fallback `0`) |
| `pf_platform` | `ios` (or React Native `Platform.OS`) |

**Console:** `[PropFolio][Monitoring] startup attributes` with the map (dev only).

## Auth session (`MonitoringAttributesSync`)

Renders inside `AuthProvider` + `SubscriptionProvider` in `app/_layout.tsx`.

- **Signed in:** `setUserId` = opaque Supabase user id only; `pf_auth_state` = `signed_in`.  
  **Console:** `[PropFolio][Monitoring] user context set (signed in, opaque id only)` (dev only).

- **Signed out (after auth loading finishes):** clears user id; `pf_auth_state` = `signed_out`; `pf_sub_tier` = `unknown`; `pf_portfolio_n` = `0`.  
  **Console:** `[PropFolio][Monitoring] user context cleared (signed out)` (dev only).

Crashlytics adapter also logs `setUserContext` / opaque id length on the native path (dev only).

## Debounced updates (churn control)

| Key | Source | Debounce |
|-----|--------|----------|
| `pf_sub_tier` | `hasProAccess` → `pro` / `free` | ~450 ms |
| `pf_route` | `usePathname()` with UUIDs masked | ~350 ms |
| `pf_portfolio_n` | `usePortfolioProperties` list length | ~1600 ms |

## API for features

- `setMonitoringAttributes({ ... })` — generic sanitized keys/values (prefer `MonitoringAttr` from `@/services/monitoring`).
- `setMonitoringPortfolioPropertyCount(n)` — integer count only (capped at 9999).

## Privacy

No passwords, tokens, emails, raw addresses, payment payloads, or freeform user notes. Route strings mask UUID-like segments as `[id]`.

## Verification (internal)

Optional **Stability checks** on Settings (dev / QA diagnostics only) send a fixed non-fatal test and optional native crash. See [MONITORING_VERIFICATION.md](./MONITORING_VERIFICATION.md).
