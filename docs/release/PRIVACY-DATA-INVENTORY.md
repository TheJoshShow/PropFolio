## PropFolio – Privacy & Data Inventory

This inventory is organized by **SDK/service** and **PropFolio endpoint**. It is intended to support privacy questionnaires and App Review conversations.

### 1. First‑party app & storage

- **React Native / Expo app**
  - Data: On‑device UI state, navigation, preferences (theme, demo toggle).
  - Storage: AsyncStorage / UserDefaults for Supabase auth session and basic app prefs.
  - Personal data: Email address (for authenticated users) stored only in Supabase; not stored in native preferences beyond Supabase session tokens.
- **Supabase client (`@supabase/supabase-js`)**
  - Data sent: Email/password (on sign‑in), auth tokens, property/import data, analytics events.
  - Personal data: Email, property details the user enters, usage events keyed by user id.
  - Storage location: Supabase Postgres in your project region.

### 2. Supabase database tables (selected)

- **`auth.users`**
  - Fields: Email, hashed password, provider identities, timestamps.
  - Purpose: Authentication and account management.
- **`profiles`**
  - Fields: `id` (FK to `auth.users`), display name, avatar URL.
  - Purpose: App‑level profile metadata.
- **`properties` / related underwriting tables**
  - Fields: Property address, purchase price, rents, expenses, financing assumptions.
  - Purpose: Run deterministic underwriting and scoring.
- **`property_imports`**
  - Fields: user_id, property_id, imported_at, source (zillow/redfin/manual).
  - Purpose: Free‑tier usage counting and audit of imports.
- **`subscription_status`**
  - Fields: plan_status, entitlement_active, free_limit, product_id, store, expires_at.
  - Purpose: Subscription entitlements and limit configuration.
- **`usage_events`**
  - Fields: event_type (`property_import`, `analysis_run`, etc.), metadata JSON.
  - Purpose: Anonymous‑ish usage analytics tied to user id.

### 3. RevenueCat (`react-native-purchases`)

- Data sent:
  - Anonymous/hashed app user id (Supabase user id used as RevenueCat app user id).
  - Purchase tokens / receipts, product identifiers, entitlement metadata.
- Personal data:
  - RevenueCat stores purchase history and subscription state keyed by the app user id and store account.
  - No email address is sent directly from the client; mapping to a real‑world identity happens only if you link via backend or dashboard notes.
- Use:
  - Determine active subscriptions (`pro_access` entitlement).
  - Provide “Manage subscription” deep links and restore purchases.

### 4. Third-party crash reporting — not integrated (planned: Firebase Crashlytics; see repo root migration doc)

- Data sent (when DSN is configured):
  - Crash reports and error events with stack traces, device model, OS version, anonymized user/session identifiers.
  - Custom breadcrumbs for navigation or key actions (if configured).
- Personal data:
  - No email or address is intentionally logged; app code should avoid passing PII in error messages.
  - crash reporting may infer coarse location from IP at ingestion time unless disabled in crash reporting settings.
- Use:
  - Monitor crashes and serious errors; prioritize fixes.

### 5. Supabase Edge Functions (third‑party APIs)

All third‑party API keys are stored as Supabase secrets; the mobile app never sees them.

- **`geocode-address` / `places-autocomplete` (Google Maps Platform)**
  - Data sent to Google:
    - Free‑form address strings and partial user queries.
    - No user identifiers are attached beyond Supabase project IP/headers.
  - Returned data:
    - Normalized addresses, place IDs, lat/lng, suggestion strings.
  - Use:
    - Improve address entry UX and normalize addresses for underwriting.
- **`rent-estimate` (RentCast)**
  - Data sent:
    - Normalized address (street, city, state, zip) and optional property type/bedrooms.
  - Returned data:
    - Estimated rent, ranges, and basic property characteristics.
  - Use:
    - Prefill or validate rent assumptions in underwriting.
- **`openai-summarize` (OpenAI)**
  - Data sent:
    - Text for plain‑English summaries/explanations (never raw passwords or tokens; no core financial math).
  - Returned data:
    - Short natural‑language summaries.
  - Use:
    - Explanatory copy (e.g. score explanations); **not** for any numeric calculations.
- **`census-data` (Census API)**
  - Data sent:
    - Geographic identifiers (state, county FIPS, tract) or lat/lng.
  - Returned data:
    - Aggregated demographic and housing statistics (no individual‑level data).
  - Use:
    - Market context and future‑value style insights.

### 6. In‑app analytics (`usage_events` + `trackEvent`)

- Events:
  - Auth funnel: `signup_started`, `signup_completed`, `login_completed`.
  - Usage: `import_started`, `import_succeeded`, `import_blocked_free_limit`.
  - Monetization: `paywall_viewed`, `paywall_plan_selected`, `purchase_*`, `restore_*`, `manage_subscription_tapped`.
- Metadata:
  - Non‑PII only (e.g. `source`, `planId`, `outcome`, `blocked`, `resumed`).
  - Emails, tokens, and raw IDs are never logged as metadata.
- Storage:
  - Events stored in `usage_events` table in Supabase.

### 7. Local device data

- Stored via AsyncStorage/UserDefaults:
  - Supabase session (access/refresh tokens) for authenticated users.
  - Basic flags like “demo mode” or feature toggles.
- Not stored locally:
  - Raw passwords (only transit to Supabase over TLS).
  - Third‑party API keys (Google, RentCast, OpenAI, Census, RevenueCat secret keys).

