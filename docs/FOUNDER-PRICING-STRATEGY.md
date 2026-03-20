# PropFolio – Pricing Strategy for Users (Founder Edition)

This document connects **what the product does**, **what it costs to run**, and **how you might charge users**. It’s a starting point, not a final pricing sheet.

---

## 1. What value are users paying for?

PropFolio is not “another calculator.” Users pay for:

- **Confidence in a buy/no‑buy decision.**
- **Speed:** how quickly they can go from listing to “I understand this deal.”
- **Quality of analysis:** a repeatable, defensible set of numbers and scenarios.
- **Portfolio view:** seeing all analyzed deals and scenarios in one place.

You can think in terms of **saved time and avoided mistakes**:

- Time saved per deal vs spreadsheets and random calculators.
- Deals avoided that would have lost money.
- Deals found that they would have missed.

Pricing should always feel small compared to the cost of:

- A bad investment decision.
- The time of a serious investor or buyer’s agent.

---

## 2. What drives cost on your side?

From the cost model:

- **Supabase:** scales with number of users and data size (predictable).
- **External APIs:** scale with number of **unique imports** and **market/ rent lookups**.
- **AI (future explanations):** scales with **how many explanations you generate**.

The most direct driver is: **how many properties and scenarios each user runs per month.**

This suggests that pricing should roughly map to:

- Number of **imports**.
- Number of **analyses/scenarios**.
- Access to **premium features** (Renovation, future value predictor, saved scenarios).

---

## 3. Simple tier structure (example)

You can start simple and grow into more complex tiers later.

### 3.1 Free tier – “Learning & light use”

**Who:** New investors, curious users, early testers.

**What they get:**

- A small number of imports per month (e.g. **3–5 properties**).
- Full use of the **deal score**, **confidence meter**, and basic **What‑If**.
- Demo portfolio and limited saved scenarios.

**Why this works:**

- Lets people experience the full scoring and What‑If flow.
- Keeps external API cost low via a **hard cap** on imports.

### 3.2 Pro tier – “Active investor”

**Who:** Users actively evaluating multiple deals per month.

**What they get (example):**

- Higher limits: e.g. **30–50 imports** and **100+ analyses** per month.
- Unlimited local scenarios for each property.
- **Renovation planner** fully unlocked.
- **Future value predictor** (if backed by market data).
- Priority email support.

**Why this works:**

- Ties revenue to higher usage, which is also where API costs live.
- Clear upgrade story from Free: “you’ve hit your monthly limit; upgrade to Pro.”

### 3.3 Team / Enterprise – “Agents & small teams”

**Who:** Buyer’s agents, small firms, or investors with staff.

**What they get (example):**

- Seats (e.g. 3–10 users) under one account.
- Shared portfolios and templates.
- Higher import and scenario limits, or custom.
- SLA around uptime and support.

**Why this works:**

- Allows higher‑value customers to pay for their heavier usage.
- Often more sensitive to risk; value of avoiding bad deals is higher.

---

## 4. How the product already supports this

The schema and app already include:

- `subscriptions` table in Supabase:
  - Tracks **plan**, **status**, and **user**.
- `usage_events` table:
  - Records **property imports**, **analysis runs**, **saved scenarios**, **premium feature usage**, etc.
- `UsageTrackingService` on the client:
  - Sends usage events when key actions happen.

With these pieces you can:

1. Set **per‑plan limits** in one place (e.g. free: 5 imports, pro: 50).
2. Periodically aggregate `usage_events` to see:
   - Who is hitting limits.
   - Which features matter most.
3. Decide **which features are gated**:
   - Example: Renovation planner and future value predictor only for Pro and up.

You don’t need to redesign the database to add pricing; it’s already structured for this.

---

## 5. Pricing guardrails (to keep things sane)

When defining actual dollar amounts:

- **Anchor to deal size and risk:**
  - If your target user buys one $300,000 property, saving them from one bad deal is worth far more than a few hundred dollars.
- **Don’t make it a “tax” on every scenario:**
  - Avoid charging per click.
  - Instead, use reasonable monthly quotas per plan.
- **Protect yourself from heavy users on Free:**
  - Hard caps on imports and analyses.
  - Gentle messaging: “You’ve reached your free plan limit; upgrade to keep analyzing deals.”

---

## 6. Example first‑launch pricing (numbers purely illustrative)

You can start with something like:

- **Free**
  - $0 / month.
  - Up to **5 imports** and **20 analyses** per month.
  - Basic What‑If, no Renovation planner, no AI explanations.

- **Pro**
  - e.g. **$39–$59 / month**.
  - Up to **50 imports** and **200 analyses** per month.
  - Full What‑If, Renovation planner, future value predictor.
  - Saved scenarios and basic support.

- **Team**
  - e.g. **$149+ / month**, includes multiple seats.
  - Higher or custom limits.
  - Shared portfolios and priority support.

You can adjust these numbers once you:

- See real usage from `usage_events`.
- Know your actual API costs per active user.

---

## 7. Next steps before launch

1. **Pick 1–2 target segments** (e.g. solo investors and buyer’s agents).
2. **Estimate their monthly imports/analyses** and check costs using:
   - Your vendors’ API pricing.
   - Supabase pricing tiers.
3. **Draft an internal spreadsheet**:
   - Rows: plans.
   - Columns: allowed imports, analyses, estimated vendor calls, estimated cost, target price, target margin.
4. **Run 2–3 trial users** and track their actual event usage:
   - See if your assumptions hold.
   - Adjust limits or prices as needed.

PropFolio’s architecture already gives you the **data you need** to do this; pricing becomes a business decision, not an engineering project.

