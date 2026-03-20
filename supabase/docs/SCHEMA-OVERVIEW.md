# PropFolio Supabase Schema Overview

## 1. Schema Overview

### Entity relationship (high level)

```
auth.users (Supabase managed)
    │
    ├── profiles (app "users" — 1:1 with auth.users)
    │       │
    │       ├── subscriptions (1:1 or 1:n per user)
    │       ├── usage_events (1:n, for analytics & limits)
    │       └── portfolios (1:n)
    │               │
    │               └── properties (1:n per portfolio)
    │                       │
    │                       ├── property_units (1:n, multi-unit)
    │                       ├── property_photos (1:n)
    │                       ├── imported_source_records (1:n, raw payloads)
    │                       └── analyses (1:n per property)
    │                               │
    │                               ├── analysis_scenarios (1:n, what-if)
    │                               └── renovation_line_items (1:n)
    │
    ├── market_snapshots (reference; no owner — geography + date)
    └── api_cache_entries (service-only; key/value cache)
```

### Table summary

**Note:** The product table "users" is implemented as **profiles** (1:1 with `auth.users`). All FKs that "belong to the user" reference `profiles(id)` or go through portfolios.

| Table | Purpose | Key FKs | Source/confidence |
|-------|---------|---------|-------------------|
| **profiles** | App user extension (1:1 auth.users); "users" in product terms | auth.users(id) | — |
| **subscriptions** | Plan, status, Stripe, period | profiles(id) | — |
| **usage_events** | Analytics + pricing limits | profiles(id) | — |
| **portfolios** | User’s container of properties | profiles(id) | — |
| **properties** | Normalized property record | portfolios(id) | data_source, fetched_at, overall_confidence |
| **property_units** | Units within a property (rent, beds) | properties(id) | — |
| **property_photos** | Photo URLs + order | properties(id) | source |
| **analyses** | One underwriting run per property | properties(id) | confidence_score, confidence_grade |
| **analysis_scenarios** | What-if snapshots (base/opt/pess) | analyses(id) | — |
| **renovation_line_items** | Reno line items per analysis | analyses(id) | — |
| **imported_source_records** | Raw Zillow/Redfin etc. payloads | properties(id) | source, fetched_at |
| **market_snapshots** | Market signals by geography + date | — | snapshot metadata |
| **api_cache_entries** | External API response cache | — | expires_at |

### Migration order (dependencies)

Apply in this order:

1. `00001_create_profiles` — extends auth.users
2. `00002_create_subscriptions` — profiles
3. `00003_create_portfolios` — profiles
4. `00004_create_properties` — portfolios
5. `00005_create_property_units` — properties
6. `00006_create_property_photos` — properties
7. `00007_create_analyses` — properties
8. `00008_create_analysis_scenarios` — analyses
9. `00009_create_renovation_line_items` — analyses
10. `00010_create_imported_source_records` — properties
11. `00011_create_market_snapshots` — none (reference)
12. `00012_create_api_cache_entries` — none (service)
13. `00013_create_usage_events` — profiles
14. `00014_add_updated_at_triggers` — optional trigger for all updated_at
15. `00015_create_rls_policies` — RLS for all tables

---

## 2. Why each table exists

- **profiles** — Supabase gives `auth.users`; the app needs a stable place for display name, preferences, and FKs from portfolios/subscriptions/usage_events. One row per auth user; id = auth.users(id). Ensure profile creation on signup (trigger on auth.users or app creates profile on first sign-in).

- **subscriptions** — Store plan (free/pro/enterprise), status (active/canceled/past_due), Stripe ids, and current period for billing and feature gating (limits, analytics).

- **usage_events** — Event log (e.g. property_added, analysis_created, api_fetch) for analytics and enforcing usage/pricing limits (e.g. N properties per month). Indexed by user_id and event_type + created_at.

- **portfolios** — A user can have one or more “lists” of deals (e.g. “2024 deals”, “Commercial”). Each saved property belongs to one portfolio.

- **properties** — Single normalized property record (address, list price, beds/baths/sqft, etc.) plus high-level source metadata (data_source, fetched_at, overall_confidence). Supports “one property, many analyses” and links to raw imports.

- **property_units** — Multi-unit properties: each unit (e.g. Unit A, B) with its own rent, beds/baths, sqft. One property can have many units.

- **property_photos** — Photo URLs and sort order for a property; optional source for provenance.

- **analyses** — One underwriting “run” per property: snapshot of inputs (purchase, rent, expenses, financing) and outputs (NOI, cap rate, cash flow, etc.) plus confidence_score/grade. Multiple analyses per property (e.g. base case, after reno).

- **analysis_scenarios** — What-if variants for an analysis (e.g. Base, Optimistic, Pessimistic). Each row stores a snapshot of inputs and outputs for that scenario.

- **renovation_line_items** — Line-item reno budget per analysis (description, cost, category). Tied to analysis so each run can have its own reno list.

- **imported_source_records** — Raw JSON from Zillow, Redfin, etc., keyed by property and source/external_id. Keeps normalized data in `properties` (and related) while preserving raw payloads for audit and reprocessing. Re-import of the same (property_id, source, external_id) should upsert (update raw_payload and fetched_at) rather than insert.

- **market_snapshots** — Market signals (and optional future-value metadata) by geography type + id and snapshot date. Shared reference data; no user ownership. Supports analytics and “market at time of analysis.”

- **api_cache_entries** — Cache for external API responses (e.g. property fetch) to avoid duplicate calls. Key/value + expires_at; intended for backend/Edge Functions (service role), not direct user access.

- **usage_events** — Event stream for analytics and enforcing usage limits; one row per event, append-only.
