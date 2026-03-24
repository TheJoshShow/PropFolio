# PropFolio – Ongoing Cost Model (Founder Edition)

This document explains **where ongoing costs come from** and how you can keep them predictable as you grow. It is intentionally high‑level and avoids code details.

---

## 1. Cost buckets at a glance

PropFolio has four main cost buckets:

1. **Supabase (database + auth)**
2. **External data providers** (Zillow/Redfin/Google/RentCast/ATTOM/etc.)
3. **Infrastructure around those providers** (your own backend, jobs, logging)
4. **AI / LLM costs** (future explanations, not core math)

The app is already designed to **minimize variable costs**:

- Caches and avoids duplicate API calls.
- Uses deterministic math instead of LLMs for scoring.
- Tracks usage so you can price plans based on cost drivers.

---

## 2. Supabase costs (database + auth)

**What you get from Supabase:**

- Managed Postgres database.
- Authentication (email, optional Apple).
- Row‑level security (per‑user data isolation).
- Function hosting and storage (optional).

**Cost drivers:**

- **Number of active users** (auth).
- **Database size** (number of properties, analyses, events).
- **Read/write volume** (imports, saves, scenarios, usage events).

**How the app keeps this under control:**

- Only stores **normalized data and compressed JSON**; raw API responses are optional.
- Uses **usage_events** for analytics instead of heavy per‑request logging tables.
- You can archive or purge old data if needed (e.g. old imports or scenarios).

**Founder takeaway:**

- On early tiers and realistic early usage, Supabase stays **low and predictable**.
- You can always:
  - Increase plan size as you grow.
  - Migrate to your own Postgres if you outgrow Supabase pricing.

---

## 3. External data providers (API & subscription costs)

External providers are where most **variable costs** will come from. Each provider has its own pricing and quotas.

### 3.1 Per‑call and per‑property costs

Examples:

- **Zillow / Redfin / ATTOM / RentCast:** pay per API call or via a fixed‑fee contract.
- **Google Places:** pay per 1,000 autocomplete or geocoding calls, after a free tier.

Every time a user:

- Pastes a listing link, or
- Types an address and uses autocomplete,

you may be billed **once per unique property or query**.

### 3.2 How PropFolio reduces these costs

From `docs/RELIABILITY-AND-COST.md`, the app already:

- **Caches** imports:
  - Re‑importing the same listing or address within a time window **does not** re‑hit providers.
- **Caches provider responses:**
  - Same autocomplete query or rent estimate → serve from cache, not from the vendor.
- **Throttles** requests:
  - Spikes in user activity are smoothed out, reducing 429 errors and repeat calls.
- **Uses fallbacks:**
  - If Zillow/Redfin is down or blocked, it can fall back to mock or alternative data instead of calling the same vendor over and over.

**Founder takeaway:**

- Your main knob is **“how many unique properties do we hit external APIs for per month?”**
- Caching and idempotency ensure that **users playing with the same deal repeatedly** do not multiply your provider bill.

---

## 4. AI / LLM costs (future)

Right now, PropFolio:

- **Does not use AI for core math** (underwriting, scoring, confidence).
- Is designed so AI can **only** be used for:
  - Explanations in plain English (e.g. “Why is this deal risky?”).
  - Summarizing analyses or scenarios.

If/when you add AI:

- You can cache explanations by **property + scenario** so you don’t re‑generate the same explanation repeatedly.
- You can log usage via `usage_events` (e.g. `explanation_generated`) to:
  - See how often this is used.
  - Tie it to pricing (e.g. only Pro users get explanations).

**Founder takeaway:**

- AI costs are **optional and controllable**.
- You can gate them behind paid plans and usage events.

---

## 5. Internal infrastructure and ops

At some point you may add:

- A small backend service (e.g. Node, Deno, or Go) to:
  - Proxy calls to vendors (hide keys from clients).
  - Run periodic jobs (pull market data, refresh snapshots).
- Logging/monitoring (e.g. crash reporting, Logtail, Datadog).

These bring:

- **Fixed monthly costs** (small servers, log quotas).
- **Variable** depending on how much logging and how many jobs you run.

Because PropFolio’s **core math is on‑device**, backend servers:

- Do **not** need to be huge.
- Mostly handle imports, market data refresh, and auth/usage tracking.

---

## 6. Connecting costs to pricing

The app already tracks key actions in `usage_events`:

- Each **property import**.
- Each **analysis run**.
- Each **what‑if scenario save**.
- Each **future value predictor call**.

These are exactly the actions that drive:

- **API calls** to vendors.
- **Database load** and Supabase costs.

That means you can:

- Define plans in simple terms like:
  - Free: up to **N imports** and **M analyses** per month.
  - Pro: more imports/analyses + unlimited scenarios + renovation planner.
  - Enterprise: custom limits and dedicated support.
- Keep your **unit economics** aligned: heavier users either pay more or move to higher tiers.

---

## 7. Practical starting assumptions (you can revise later)

You can start with simple, conservative assumptions:

- **Supabase:** Assume a small monthly base cost that scales with user count.
- **External APIs:** Assume **1–2 billable API calls per import** on average, thanks to caching and fallbacks.
- **AI:** Assume zero until you explicitly add explanations.

Then:

- Use `usage_events` to measure actual imports/analyses.
- Plug in real API pricing once you sign vendor contracts.
- Adjust plan limits and pricing before a wide launch.

This keeps the product **runnable and demo‑ready today**, while giving you a clear path to sustainable margins later.

