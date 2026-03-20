# PropFolio – API & Vendor Map (Founder Edition)

This document shows **which outside services PropFolio can talk to**, what they’re used for, and how “hard” the dependency is. It’s written so you can reason about vendors and contracts without reading code.

---

## 1. Big picture: three layers of data

PropFolio’s data comes from three places:

1. **User input**
   - Rents, expenses, purchase price, renovation budgets, scenarios.
   - You fully control this; no vendors involved.

2. **Your own backend (Supabase)**
   - User accounts, portfolios, analyses, usage events, subscriptions.
   - Hosted with **Supabase** (Postgres + auth + storage).

3. **External data providers (optional)**
   - Zillow, Redfin (listing data).
   - Google Places (address autocomplete).
   - RentCast (rent estimates).
   - ATTOM (property/parcel data).

The app is built so it **still works** with just (1) and (2). Vendor (3) is optional and can be turned on one by one.

---

## 2. Core backend: Supabase

- **What it is:** Managed Postgres + auth + storage, similar to Firebase but SQL‑first.
- **How PropFolio uses it:**
  - **Auth:** Email sign‑in / sign‑up (and Apple later).
  - **Data:** Tables for:
    - Users / profiles.
    - Properties and imported raw records.
    - Analyses and scenarios.
    - Market snapshots (for future value).
    - Subscriptions and usage events.
  - **RLS (row‑level security):** Enforced in SQL so each user only sees their own data.
- **Risk level:** **High importance, but replaceable.**
  - If Supabase is down, login and cloud data are unavailable.
  - However, the **demo mode** (local-only) still works for testing and demos.
  - In the future you could migrate the same schema to another Postgres host if needed.

---

## 3. Property data & import providers

All property data vendors are wrapped in **adapters**. The app talks to an adapter; the adapter talks to the vendor (or your backend proxy).

### 3.1 Zillow (listing and property data)

- **Role in the product:**
  - When a user pastes a **Zillow link**, you can:
    - Extract a listing ID (zpid).
    - Call a Zillow API or backend proxy to get property details.
- **How it’s wired:**
  - Adapter: `ZillowAdapter` (under `Services/PropertyData/Adapters`).
  - Config key: `ZILLOW_API_KEY` (read via `AppConfiguration.zillowAPIKey`).
  - **If key is missing:** adapter reports “not available” and the system:
    - Uses a **mock adapter** in dev, or
    - Falls back to other sources.
- **Risk / lock‑in:**
  - You can ship without Zillow and turn it on once you have an agreement.
  - The parsing logic for Zillow URLs is independent from the network API.

### 3.2 Redfin (listing data)

- **Role:**
  - Same as Zillow, but for Redfin links.
- **How it’s wired:**
  - Adapter: `RedfinAdapter`.
  - Config flag: `REDFIN_ENABLED` (boolean).
  - Expected pattern is to call **your own backend proxy**, not Redfin directly.
- **Risk / lock‑in:**
  - Fully optional; can be off (flag false) without breaking the app.
  - Can be replaced by your own “scraper” or ingest pipeline if contracts require.

### 3.3 Address autocomplete (Google Places)

- **Role:**
  - When a user types an address instead of pasting a link, autocomplete:
    - Suggests addresses.
    - Returns structured address components.
- **How it’s wired:**
  - Interface: `AddressAutocompleteProvider`.
  - Default dev implementation: **mock** provider.
  - Future implementation: Google Places or your own backend endpoint with Places behind it.
  - Config key: `GOOGLE_PLACES_API_KEY`.
- **Risk / lock‑in:**
  - Google is common but not required; provider is behind a clean interface.
  - You can swap to another geocoding API later.

### 3.4 RentCast (rent estimates)

- **Role:**
  - Optional provider for **rent estimates and rent comps**.
- **How it’s wired:**
  - Adapter: `RentCastAdapter` (future/optional; scaffolded).
  - Config key: `RENTCAST_API_KEY`.
- **Risk / lock‑in:**
  - Fully optional. Weight this vendor only if rent estimation is a priority.

### 3.5 ATTOM (parcel and property attributes)

- **Role:**
  - Optional provider for richer **property and parcel data** (beds/baths, lot size, etc.).
- **How it’s wired:**
  - Adapter: `ATTOMAdapter` (future/optional; scaffolded).
  - Config key: `ATTOM_API_KEY`.
- **Risk / lock‑in:**
  - Also optional; can be turned on once you have a contract and clear ROI.

### 3.6 Market data (future value / market context)

- **Role:**
  - To support the **future value predictor** and “market tailwinds” factor.
- **How it’s wired:**
  - Backend table `market_snapshots` in Supabase.
  - Optional service that pulls public market data into snapshots via your own backend.
  - Config key: `PUBLIC_MARKET_DATA_URL` (for an internal service).
- **Risk / lock‑in:**
  - You are not bound to a single market data vendor; you can change the data feed behind the scenes.

---

## 4. Auth, usage tracking, and subscriptions

### 4.1 Auth (Supabase)

- **What:** Email sign‑up / sign‑in (Apple Sign In later).
- **Where:** `SupabaseAuthProviding` and `SupabaseClientManager` on the client; `auth` schema in Supabase.
- **Why it matters:**
  - All cloud data (properties, portfolios, scenarios) is tied to users.
  - Needed for any **paid** plan or multi‑device access.

### 4.2 Usage events

- **What:** Every important action can emit a **usage event**.
  - Examples: `property_import`, `analysis_run`, `saved_scenario`, `future_value_predictor_call`, `premium_feature_usage`.
- **Where:** See `docs/USAGE-EVENTS-AND-MONETIZATION.md`.
- **Vendor:** Stored in Supabase (no extra vendor).
- **Why it matters:**
  - Lets you see which features are used.
  - Supports **usage‑based pricing** and **plan limits** later.

### 4.3 Subscriptions

- **What:** Simple `subscriptions` table in Supabase with plan, status, and user id.
- **Vendor:** Also Supabase; can be backed by Stripe or other billing later.
- **Why it matters:**
  - You can introduce pricing tiers without re‑designing the schema.

---

## 5. “Hard” vs “soft” dependencies

**Hard dependency (must work for production):**

- Supabase: auth + main database.
- Your own backend logic (if you add server‑side calculations or ingest pipelines).

**Soft / optional dependencies:**

- Zillow, Redfin, Google Places, RentCast, ATTOM.
- These only matter if you want **live imports and data enrichment**.
- The product is usable with:
  - Demo data.
  - Manual input.
  - Your own backend feeds.

---

## 6. Practical vendor strategy (recommendation)

1. **Phase 1–2: Run on zero external property APIs**
   - Use demo data and manual input.
   - Make sure scoring, What‑If, and renovation feel great.

2. **Phase 3: Turn on login + usage events**
   - Configure Supabase URL + anon key.
   - Make sure events are recording imports and analyses.

3. **Phase 4: Experiment with one property data feed**
   - Pick **one** primary ingest path (e.g. Zillow via your own backend proxy).
   - Use the adapter pattern that is already in the app; do not wire the API directly into screens.

4. **Phase 5: Add market data**
   - Implement the pipeline that populates `market_snapshots`.
   - Wire the future value predictor to that data.

At all times, you can fall back to **demo mode** for demos, onboarding, and investor pitches, even if an external vendor is having a bad day.

