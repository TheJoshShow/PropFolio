# PropFolio – Admin Operations Checklist (Founder Edition)

This is a simple checklist for **running PropFolio as a small team**: what to watch, what to do regularly, and where to click. It assumes you have access to Supabase and basic analytics tools.

---

## 1. Daily / weekly health checks

### 1.1 Supabase project health

- [ ] Log into **Supabase dashboard**.
- [ ] Check **Project status**:
  - No red or orange warnings.
  - Database CPU and RAM within comfortable ranges.
- [ ] Check **Auth**:
  - No obvious spikes in sign‑up errors.
  - Sign‑in/sign‑up tests work (you can log in yourself).

### 1.2 Error and crash logs

Depending on your tooling (e.g. Xcode, crash reporting, Crashlytics):

- [ ] Review **new crashes** and **serious errors**.
- [ ] For each new serious issue, file a short ticket:
  - What the user was trying to do.
  - Which screen and platform (iOS or web).
  - Any error message you saw.

### 1.3 Usage sanity check

Use either Supabase SQL editor or a saved dashboard to:

- [ ] Check **active users** in the past 7 days.
- [ ] Check **usage_events**:
  - Number of `property_import` events.
  - Number of `analysis_run` events.
- [ ] Confirm these numbers match your expectations:
  - If a big marketing push happened, usage should be up.
  - If something looks off (e.g. near zero imports), investigate.

---

## 2. Monthly operations

### 2.1 Data backups and retention

- [ ] Confirm Supabase **automated backups** are turned on.
- [ ] If you store large raw payloads (API responses), consider:
  - Archiving older raw data to a cheaper storage.
  - Keeping normalized core data (properties, analyses) for the long term.

### 2.2 Plan and pricing review

- [ ] Aggregate `usage_events` by **plan** and **user**:
  - Who hits import/analysis limits?
  - Which features (What‑If, Renovation, future value) are used most?
- [ ] Review **plan economics**:
  - For each plan, estimate **API costs** vs **revenue**.
  - Identify outliers (users who cost more than they pay).
- [ ] Decide if you need to:
  - Adjust limits.
  - Adjust prices.
  - Nudge heavy users to higher tiers.

### 2.3 Vendor contracts and quotas

For each external provider you’ve turned on (Zillow/Redfin proxies, Google Places, RentCast, ATTOM):

- [ ] Check monthly usage against contract quotas.
- [ ] Check monthly bills for any surprises.
- [ ] If cost is spiking:
  - Review caching and duplicate imports (see reliability docs).
  - Consider raising plan prices or limits to keep margins healthy.

---

## 3. Before a new app release

### 3.1 Run the launch readiness checklist

- [ ] Follow the **Launch Readiness** doc (see `FOUNDER-LAUNCH-READINESS.md` once created) to:
  - Build the latest version.
  - Run the full tap‑through test on iPhone simulator.
  - Confirm demo data still works.

### 3.2 Verify environment and config

- [ ] Confirm **Supabase URL + anon key** are set correctly in:
  - Xcode scheme or Info.plist for iOS.
  - `.env` for web (if you expose login there).
- [ ] Confirm feature flags (if any) match your intended launch configuration:
  - Demo mode default (on/off).
  - Any premium feature gates (e.g. Renovation for Pro only).

### 3.3 Schema and migrations

- [ ] If there are new migrations in `supabase/migrations/`:
  - Make sure they’re applied to your staging and production projects.
  - Run a quick smoke test to ensure data is still accessible and correct.

---

## 4. User account and data operations

### 4.1 Handling user support requests

Common examples:

- “I can’t log in.”
- “My portfolio is empty.”
- “This property looks wrong.”

For each:

- [ ] **Log the request** with:
  - User email.
  - Time and timezone.
  - Short description of the issue.
- [ ] Check in Supabase:
  - Does the user exist?
  - Do they have properties and analyses?
  - Are there usage_events showing recent imports/analyses?
- [ ] Decide if this is:
  - A simple explanation issue (user education).
  - A configuration issue (missing keys, bad environment).
  - A real bug (hand off to engineering with context).

### 4.2 Deleting or exporting user data

You may receive requests like:

- “Delete all my data.”
- “Export my analysis history.”

For each request:

- [ ] Confirm identity (they control the email used for the account).
- [ ] Export or delete using Supabase tools or a small admin script:
  - Properties.
  - Analyses and scenarios.
  - Usage events if requested.
- [ ] Record what you did and when, in a simple admin log (even a spreadsheet is fine at early stage).

---

## 5. Configuration changes (keys, providers, feature flags)

When you change environment variables (API keys, URLs, flags):

- [ ] Document the change:
  - Which key changed.
  - New provider or endpoint.
  - Date and who changed it.
- [ ] Update:
  - Xcode scheme / Info.plist / Secrets.xcconfig.
  - `.env` for the web app where relevant.
- [ ] Run a quick **import smoke test**:
  - Paste a known working link (or use a dev key).
  - Confirm the Import result still looks correct.

---

## 6. Who does what (early‑stage version)

In a small team, one person might wear multiple hats, but it’s useful to name the roles:

- **Founder / Product Owner**
  - Owns pricing, plans, and vendor contracts.
  - Decides what features are free vs paid.
- **Technical Lead**
  - Owns Supabase config, API keys, and deployments.
  - Investigates bugs and performance issues.
- **Support Lead (can be you)**
  - Reads support inbox and in‑app feedback.
  - Prioritizes which issues become tickets.

As you grow, you can formalize these roles. For now, treat this checklist as the minimum set of **operational habits** that keep PropFolio healthy.

