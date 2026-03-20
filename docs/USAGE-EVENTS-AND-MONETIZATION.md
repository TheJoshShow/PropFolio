# Usage Event Tracking and Monetization Scaffolding

Event schema, client/server instrumentation, and how this supports pricing plans later.

---

## 1. Event schema

Events are stored in **`public.usage_events`** (see `supabase/migrations/00013_create_usage_events.sql`):

| Column        | Type        | Description |
|---------------|-------------|-------------|
| `id`          | UUID        | Primary key (default gen_random_uuid()) |
| `user_id`     | UUID        | References `profiles(id)`; must equal `auth.uid()` on insert (RLS) |
| `event_type`  | TEXT        | Canonical event name (see below) |
| `resource_type` | TEXT (nullable) | Optional classification for filtering |
| `metadata`    | JSONB (nullable) | Event-specific payload |
| `created_at`  | TIMESTAMPTZ | Default NOW() |

### Event types (`event_type`)

| Value | Description | Typical `resource_type` |
|-------|-------------|---------------------------|
| `property_import` | User imported a property (link or address) | `property` |
| `analysis_run` | User viewed/ran analysis (dashboard or portfolio) | `analysis` |
| `saved_scenario` | User saved a what-if scenario | `scenario` |
| `portfolio_save` | User saved a deal to portfolio | `portfolio_deal` |
| `premium_feature_usage` | User used a premium/gated feature | `premium_feature` |
| `future_value_predictor_call` | Future value / market context was requested | `market_context` |

### Metadata shapes (JSONB)

- **property_import:** `{ "source": "zillow"|"redfin"|"address", "from_cache": bool, "has_listing_id": bool }`
- **analysis_run:** `{ "property_id": uuid?, "has_score": bool, "has_confidence": bool, "source": "dashboard"|"portfolio" }`
- **saved_scenario:** `{ "scenario_id": uuid?, "name": string?, "as_baseline": bool }`
- **portfolio_save:** `{ "deal_id": uuid?, "property_id": uuid?, "status": "watching"|"offer"|... }`
- **premium_feature_usage:** `{ "feature_name": string, "plan_required": "pro"|"enterprise"|null }`
- **future_value_predictor_call:** `{ "geography_zip", "geography_county_fips", "geography_state", "from_cache": bool }`

All keys use **snake_case** in JSON for consistency with backend/SQL.

---

## 2. Server instrumentation

- **Storage:** Client inserts into `usage_events` via Supabase client (authenticated only; RLS enforces `user_id = auth.uid()`).
- **Aggregation:** Use SQL or a backend job to aggregate by `user_id`, `event_type`, and time window (e.g. per month) for limits and billing.
- **Example: monthly property imports per user**
  ```sql
  SELECT user_id, COUNT(*) AS n
  FROM usage_events
  WHERE event_type = 'property_import'
    AND created_at >= date_trunc('month', NOW())
  GROUP BY user_id;
  ```
- **Pricing / limits:** Join with `subscriptions` (plan) and enforce caps (e.g. free: 5 imports/month; pro: 50; enterprise: unlimited). Prefer **server-side checks** (e.g. Edge Function or RPC) before allowing an action when you enforce hard limits.

---

## 3. Client instrumentation (iOS)

| Event | Where it’s tracked |
|-------|--------------------|
| **property_import** | `ImportFlowViewModel` after successful `runImportFromLink` / `runImportFromAddress`; uses `result.importSource`, `result.fromCache`, and listing vs address. |
| **analysis_run** | `AnalysisDashboardScreen.onAppear`; uses `analyticsSource` ("dashboard" or "portfolio"), `hasScore`, `hasConfidence`. |
| **saved_scenario** | `SimulationViewModel.saveScenario` after `ScenarioManager.saveScenario`; passes scenario id, name, `asBaseline`. |
| **portfolio_save** | Not yet triggered (portfolio is mock). When you add “Save to portfolio,” call `UsageTrackingService.shared.trackPortfolioSave(dealId:propertyId:status:)`. |
| **premium_feature_usage** | Example: `RenovationPlannerScreen.onAppear` with `featureName: "renovation_planner"`. Add more when you add paywalled features and set `planRequired` when applicable. |
| **future_value_predictor_call** | `BackendMarketContextAdapter.getMarketContext` on cache hit and on successful API fetch; passes geography (zip/county/state) and `fromCache`. |

**Service:** `UsageTrackingService` (protocol `UsageTrackingProviding`). Default implementation sends to Supabase when the user is signed in; otherwise no-op. Use `UsageTrackingService.shared` in app code; use `NoOpUsageTracker()` in tests.

---

## 4. How this supports pricing plans later

- **Usage-based limits:** Aggregate events by `event_type` and window (e.g. monthly) per `user_id`. Compare to plan limits (e.g. from `subscriptions.plan`) to block or allow actions (e.g. “You’ve reached 5 property imports this month on the free plan”).
- **Feature gating:** Use `premium_feature_usage` and `plan_required` to see which features are used and which plans to require. Enforce server-side (e.g. before returning sensitive data or before performing a paid action).
- **Billing and reporting:** Counts of `property_import`, `analysis_run`, `saved_scenario`, `future_value_predictor_call` (and optionally `portfolio_save`) can drive metered billing or internal dashboards. `metadata` (e.g. `from_cache`) helps separate cache hits from billable API usage.
- **Tiers:** Align event types with tiers (e.g. free: N imports, M analyses; pro: higher N/M + renovation planner; enterprise: unlimited + API). The same schema supports all tiers; only the limits and which events you count for billing change.

---

## 5. Files reference

| Area | Files |
|------|--------|
| Schema (Swift) | `PropFolio/Services/UsageTracking/UsageEventSchema.swift` |
| Client service | `PropFolio/Services/UsageTracking/UsageTrackingService.swift` |
| Server table | `supabase/migrations/00013_create_usage_events.sql` |
| RLS | `supabase/migrations/00015_create_rls_policies.sql` (usage_events insert/select own) |
| Subscriptions | `supabase/migrations/00002_create_subscriptions.sql` |
