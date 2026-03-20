# PropFolio – Technical Overview (Founder Edition)

This is the “plain English first” view of how PropFolio works under the hood, written for a founder who is smart but new to coding.

---

## 1. What PropFolio actually does

- **Core question:** “Should I buy this property?”
- **How it answers:**
  - Pulls or accepts property details (rents, expenses, price, units, etc.).
  - Runs **deterministic math** to calculate returns (cap rate, cash flow, DSCR, etc.).
  - Rolls those numbers into a **0–100 deal score** plus a **confidence score**.
  - Lets the user play with **What‑If scenarios** and **Renovation plans**.
  - Tracks analyzed properties in a **Portfolio**.

Important: **No AI is allowed to do financial calculations.** All money math is hard‑coded and fully unit‑tested.

---

## 2. High‑level architecture

Think of the app as three layers:

1. **Screens (UI) – what the user sees**
   - Built in **SwiftUI** for iOS.
   - Mirrors a simple mental model: Home, Import, Analysis, What‑If, Renovation, Portfolio, Settings.
   - A small React web app mimics these screens so you can test on Windows.

2. **View models – glue between UI and math**
   - Take user inputs (price, rent, etc.) and call the engines and services.
   - Prepare friendly view state (e.g. “Score: 85 / 100, Strong”).

3. **Engines and services – the brains**
   - **Underwriting & scoring engine:** pure math, no UI, no network.
   - **Scenario & renovation engine:** runs What‑If and renovation totals.
   - **Property data service:** knows how to parse imports (Zillow/Redfin links, typed address) and talk to providers via adapters.
   - **Usage tracking service:** logs usage events for later pricing/analytics.

Everything “important” (money math, scoring, confidence) lives in **Engine/** or **Services/**, not in screen code. That keeps the logic testable and safe from UI bugs.

---

## 3. Where things live in the repo

You do not have to memorize the whole tree. These are the parts you’ll care about as a founder:

- `PropFolio/App/PropFolioApp.swift`
  - App entry point; decides whether to show **Login** or the main tabs.

- `PropFolio/Screens/…`
  - All the end‑user screens (Home, Import, Portfolio, Analysis, What‑If, Renovation, Settings).

- `PropFolio/ViewModels/…`
  - “Brain” for each feature. Example: Import flow view model, Simulation view model.

- `PropFolio/Engine/Underwriting/…`
  - All financial formulas and scoring logic.
  - Fully covered by unit tests; safe place to change formulas when needed.

- `PropFolio/Services/PropertyData/…`
  - Parsing and calling external property data providers (Zillow, Redfin, etc.).
  - Uses **adapters** so you can swap providers later without rewriting the app.

- `PropFolio/Services/UsageTracking/…`
  - Sends “usage events” (imports, analyses, scenarios) to Supabase for pricing and analytics.

- `PropFolio/Supabase/…`
  - Sets up the Supabase client and authentication (email login).

- `PropFolio/Demo/DemoData.swift`
  - Seed/demo data: three representative deals so you can demo the app with no external APIs.

- `docs/…`
  - Product, architecture, scoring, cost, QA, and backend docs (founder‑friendly).

If you only remember two folders, remember **`Engine/Underwriting`** (math) and **`DemoData`** (seed deals).

---

## 4. Data flow: from paste to portfolio

Here’s the simplified story when a user pastes a Zillow/Redfin link or types an address:

1. **Import input**
   - User either:
     - Pastes a URL (Zillow or Redfin), or
     - Types an address and picks from autocomplete (or continues manually).

2. **Parsing & source detection**
   - The `ImportInputParser`:
     - Checks if it’s a Zillow or Redfin URL and extracts the listing ID.
     - Otherwise treats it as a typed address.

3. **Fetch or reuse property data**
   - `PropertyDataService`:
     - First checks a **local cache**: “Have we already imported this listing or address recently?”
     - If yes, returns cached data (no external call, saves money).
     - If not, calls one or more **adapters** (Zillow, Redfin, etc.) or a **mock adapter** in dev.

4. **Normalize + confidence**
   - Raw provider data is converted into a **NormalizedProperty**:
     - Cleaned up fields (bed/bath/units, rents, expenses).
     - Per‑field **confidence** and an overall confidence score.

5. **Underwriting & scoring**
   - The underwriting engine runs:
     - Income & expenses → NOI.
     - Debt → DSCR, cash flow, returns.
     - Stress scenario (e.g. rent drop) for downside resilience.
   - The scoring engine:
     - Converts metrics into **sub‑scores 0–100**.
     - Applies **weights** to get a total score 0–100.
     - Assigns an **archetype** (Exceptional / Strong / Stable / Risky / etc.).
     - Caps the score when data confidence is low.

6. **UI presentation**
   - Analysis screen shows:
     - Deal score + archetype.
     - Confidence score.
     - Future value summary.
     - Explanation cards for risks and opportunities.
   - Portfolio screen lists the deal with the same core numbers for quick scanning.

7. **What‑If and Renovation**
   - What‑If tweaks the deal inputs (price, down payment, interest, rents, expenses) and re‑runs the same underwriting logic live.
   - Renovation budget feeds into total cash and returns.

Throughout this flow, **all calculations are deterministic** and unit‑tested. Providers (Zillow, Redfin, Google Places, RentCast, ATTOM) are optional and always behind adapters.

---

## 5. Key principles you can rely on

- **Deterministic math only.**
  - Every financial output is a pure calculation; same inputs always produce the same results.
  - All formulas are unit‑tested; they do not change by themselves.

- **AI is for explanations, not numbers.**
  - The system is designed so AI can *explain* scores and risks in plain English.
  - AI is **not allowed** to compute scores, confidence, or any money number.

- **Adapters for all external data.**
  - The main app never talks directly to Zillow, Redfin, Google, RentCast, or ATTOM.
  - Instead there is one adapter per provider. You can:
    - Swap providers.
    - Add a backend proxy.
    - Turn providers off in dev.

- **Cache and cost control.**
  - Re‑importing the same listing or address within a time window does **not** re‑hit external APIs.
  - A shared provider cache avoids paying twice for the same response.
  - Rate limiting and retry logic reduce accidental over‑use.

- **Usage events everywhere.**
  - Important user actions (imports, analyses, saved scenarios, etc.) emit **usage events**.
  - These events feed into pricing, limits, and growth analytics later.

---

## 6. What’s already in place vs future work

**Already in place:**

- iOS app with:
  - Home, Import, Portfolio, Analysis, What‑If, Renovation, Settings.
  - Deterministic underwriting and scoring engines.
  - Confidence meter and future value predictor spec.
  - Demo data and mock providers so everything is testable without live APIs.
- Web app:
  - Light shell mirroring the iOS flows for easier testing on Windows.
- Supabase backend:
  - Auth (email, Apple placeholder).
  - Schema for properties, analyses, scenarios, market snapshots, subscriptions, usage events.
  - RLS (row‑level security) to keep tenant data isolated.
- Cost and reliability scaffolding:
  - Cache, idempotency, rate limiting, retries, and fallbacks.
  - Usage event logging for pricing and analytics.

**Future work (non‑blocking, but valuable):**

- Wire **Save to portfolio** to real persistence instead of demo only.
- Turn on real providers (Zillow/Redfin via backend, Google Places, RentCast, ATTOM) once you have contracts and keys.
- Add richer account and subscription management screens on top of the existing schema.

As a founder, you can treat the current state as: **“The product works locally with realistic demo data and is ready to talk about with investors and early users.”**

