# PropFolio – Launch Readiness Checklist (Founder Edition)

This is a **yes/no checklist** for deciding if a given build is ready to ship to real users or a limited beta. It combines technical, product, and operations checks.

---

## 1. Build & run sanity

- [ ] **iOS build compiles** in Xcode without errors.
- [ ] **iOS app runs** on an **iPhone 16** simulator (or equivalent) without crashing at startup.
- [ ] **Web app** runs with `npm run dev` (for Windows/desktop demo) or your chosen hosting setup.
- [ ] No obvious red errors in the console during normal flows.

If any of these fail, fix them before looking at anything else.

---

## 2. Demo mode and seed data

- [ ] **Demo data is enabled** by default in dev/staging (Use demo data = ON).
- [ ] **Portfolio** shows the 3 demo deals (strong 4‑plex, value‑add, risky condo).
- [ ] You can tap:
  - Portfolio → Analysis → What‑If → Renovation.
  - Import → Demo property → Imported result → Edit details.
- [ ] These flows **do not depend** on external APIs or keys.

If demo mode is broken, you cannot reliably demo or onboard; treat this as a blocker.

---

## 3. Core user journey – tap‑through test

On an **iPhone 16** simulator with demo data ON, follow this flow (adapted from `QA-PASS-FINAL.md`):

- [ ] **Portfolio**
  - App opens on Portfolio with 3 deals.
  - Cards look clean; no clipped text; archetype and status visible.
- [ ] **Analysis**
  - Tap a deal → Analysis screen.
  - See “Deal score” label, big score, archetype, confidence, future value, metrics.
- [ ] **What‑If**
  - Tap **What‑If scenarios**.
  - Adjust a slider or input and see metrics update smoothly.
- [ ] **Renovation**
  - From What‑If, open Renovation budget.
  - Change a line item and see totals update; tap Done to return.
- [ ] **Import (demo)**
  - Import tab → choose Demo property.
  - See Imported result and Edit details; save changes works.
- [ ] **Home**
  - Home tab → tap **Import property**; you land on Import tab.
- [ ] **Settings**
  - Toggle Use demo data OFF → Portfolio reflects change.
  - Toggle Use demo data ON → demo deals return.

If any of these steps fail (crashes, blank screens, obviously wrong numbers), this build is **not launch‑ready**.

---

## 4. Visual and UX quality

Use your judgment, but answer these frankly:

- [ ] **Spacing looks intentional** (no random cramped or huge gaps).
- [ ] **Text is not clipped**; important labels are fully readable on iPhone 16.
- [ ] **Scroll behavior** is smooth; content doesn’t feel cut off at the bottom.
- [ ] **Tap targets** (buttons, rows) feel easy to hit (about a finger tall).
- [ ] **Score and confidence** are clearly labeled so users know:
  - Deal score vs Confidence score.
  - That low confidence can cap a high score.
- [ ] **Keyboard** never blocks the main call‑to‑action when editing addresses or property details.

Small visual nits can be deferred; anything that feels confusing or broken for a new user should be fixed before launch.

---

## 5. Data correctness and guardrails

- [ ] For the 3 demo deals:
  - Portfolio metrics match Analysis metrics (NOI, cap rate, cash flow).
  - Scores and archetypes are consistent across screens.
- [ ] When data confidence is low:
  - The score is visibly capped (no “Exceptional” labels on low‑confidence data).
- [ ] If required inputs for scoring are missing:
  - The app does **not** pretend to have a full score; it shows a clear “Need more data” state.

This is about protecting users from misleading numbers, not pixel‑perfect precision.

---

## 6. Config & environment

- [ ] For the environment you are launching:
  - **Supabase URL + anon key** are set correctly.
  - Any external API keys you intend to use (Zillow proxy, Google Places, etc.) are configured and tested.
- [ ] **Feature flags** (if any) are set correctly:
  - Demo mode default (for new sign‑ups).
  - Premium features (Renovation, future value, AI explanations) are gated as planned.
- [ ] A **fallback path** exists if an external provider is down:
  - Import still works in a degraded mode (e.g. mock or cached data).

If you are unsure about a provider, treat it as optional for launch and rely on demo/manual data first.

---

## 7. Support and operations

- [ ] You have a **support email or form** where users can report problems.
- [ ] You have a **simple internal log** (spreadsheet or tool) for:
  - Bugs.
  - User requests.
  - Feature ideas.
- [ ] Someone (even if it’s you) is responsible for:
  - Checking errors and usage weekly.
  - Deciding which issues are blockers vs can wait.

Early on, a light but consistent process beats a heavy system you don’t use.

---

## 8. “Go / No‑Go” questions

Before you share PropFolio with a wider audience, answer:

- [ ] Can a new user **import a demo property** and see a full analysis without help?
- [ ] Can they **run a What‑If scenario** and understand what changed?
- [ ] Can they **see a clear confidence score** and understand that low confidence = more risk?
- [ ] Do you feel comfortable that **no major screen is obviously broken** on iPhone 16?

If any of these are “no,” hold the launch, fix those issues, and re‑run this checklist.

If they are all genuinely “yes,” you likely have a **launch‑ready build** for a small beta or early customers.

