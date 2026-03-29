# Flow monitoring (Crashlytics)

Targeted **non-fatal** signals use `recordFlowIssue` / `recordFlowException` from `src/services/monitoring/flowInstrumentation.ts`. Each payload includes `env` (dev/prod) and `v` (app version) where applicable.

**Stages & recovery:** Many events include **`stage`** (e.g. `parse`, `enrich`, `persist`, `auth_callback`, `startup`) and **`recoverable`** (user can retry / fix without reinstall). **`recordFlowException`** also adds **`client_kind`** (`timeout`, `network`, `unauthorized`, …) via `clientErrorClassification.ts` unless you override it in `detail`.

**Deduping:** identical exception fingerprints within ~2.5s are suppressed (`reportDedupe`). Message-only flow lines dedupe the same way.

**Not duplicated:** `logErrorSafe` still forwards to Crashlytics for generic catches; flow-specific paths prefer `recordFlowIssue` / `recordFlowException` to avoid double-reporting the same failure.

---

## Flows instrumented

| Area | Where | What gets reported |
|------|--------|---------------------|
| **Auth** | `AuthContext` | Session invalid after `getUser`, email-link callback errors or missing PKCE code, callback `exchangeCodeForSession` failure, sign-in/up/out failures, reset/update password failures, profile setup incomplete (signup + phone), account delete edge failures |
| **Import** | `listingImportParser` (async), `propertyImportOrchestrator`, `useExecutePropertyImport` | Listing parse failed (reason only), manual enrich blocked codes, pipeline blocked / failed statuses |
| **API** | `edgeFunctions` `invoke` / `invokeWithTimeout` | Supabase function name + failure kind + `stage: edge_invoke` + `recoverable` (false only for `no_client`) |
| **Billing** | `revenueCat`, `SubscriptionContext` | Missing key (`rc_configure`), offerings fetch, customer info, purchase/restore, subscription load/refresh (`stage` on each) |
| **Analysis** | `property_detail_analysis_service`, `propertyWhatIfOverrides`, `portfolio/[id]` | Pipeline throw, what-if storage read/write, analysis build on detail screen |
| **Navigation** | `portfolio/[id]` | Missing route param, property not found |

---

## Event / error names

| Name | Type |
|------|------|
| `auth_session_invalid` | issue |
| `auth_callback_redirect_error` | issue |
| `auth_callback_missing_code` | issue |
| `auth_callback_set_session_failed` | exception |
| `auth_sign_in_failed` | exception |
| `auth_sign_up_failed` | exception |
| `auth_reset_password_failed` | exception |
| `auth_update_password_failed` | exception |
| `auth_sign_out_failed` | exception |
| `auth_profile_setup_incomplete` | issue |
| `auth_delete_account_edge_failed` | issue |
| `auth_delete_account_rejected` | issue |
| `bootstrap_env_incomplete` | issue (`n` = missing var count) |
| `import_listing_parse_failed` | issue (`reason`, `stage: parse`) |
| `import_enrich_blocked` | issue (`code`, `source`, `stage: enrich`) |
| `import_enrich_exception` | exception (`stage: enrich`) |
| `import_pipeline_blocked` | issue |
| `import_pipeline_failed_retryable` | issue |
| `import_pipeline_failed_nonretryable` | issue |
| `api_supabase_fn_failed` | issue |
| `api_edge_failed` | issue |
| `billing_rc_missing_api_key` | issue |
| `billing_rc_configure_failed` | exception |
| `billing_rc_offerings_fetch_failed` | exception |
| `billing_rc_customer_info_failed` | exception |
| `billing_rc_purchase_failed` | issue |
| `billing_rc_restore_failed` | issue |
| `billing_paywall_offerings_empty` | issue |
| `billing_subscription_load_failed` | exception |
| `billing_subscription_refresh_failed` | exception |
| `analysis_pipeline_failed` | exception (`stage: analysis_build`) |
| `analysis_whatif_storage_write_failed` | exception (`stage: whatif_storage`) |
| `nav_invalid_property_param` | issue |
| `nav_property_not_found` | issue |

---

## Intentionally light / omitted

- **Scoring “insufficient data”** is common for normal listings; not sent as a separate flood of events.
- **Tab route guard** (redirect unauthenticated users) is expected; not logged.
- **Auth callback** without `access_token` logs **`auth_callback_missing_token`** (deduped); generic “no session” redirects are not logged separately.
- **Portfolio Supabase reads** already use `logErrorSafe` → no extra `recordFlow*` there.
