# PropFolio – Support & Bug Triage Process (Founder Edition)

This document describes **how to handle support and bugs** without a big team. It’s designed for a founder who might also be the first support person.

---

## 1. Goals of this process

You want to:

- Respond to users in a friendly, consistent way.
- Capture issues so they are not forgotten.
- Fix the most important problems first.
- Avoid getting overwhelmed by noise.

This process gives you a “minimum viable” support and triage loop.

---

## 2. Where support comes in

Typical channels:

- **Support email** (e.g. `support@yourdomain.com`).
- **In‑app contact link** (if you add one).
- **Founder DMs** (Twitter/LinkedIn/WhatsApp).

For every incoming message:

1. **Acknowledge** (even briefly).
2. **Log** the issue in a simple system:
   - Early stage: a shared spreadsheet or Notion table is fine.
   - Columns to include:
     - Date.
     - User email (or anonymized ID).
     - Channel (email, DM, etc.).
     - Short summary.
     - Category (bug, feature request, question).
     - Severity (see below).
     - Status (new / investigating / planned / fixed / closed).

---

## 3. Severity levels (how serious is it?)

Use simple, human definitions:

- **P0 – Blocking**
  - User cannot log in, run analysis, or save a deal.
  - App crashes or shows a blank screen in a core flow.
  - Security or privacy concern.

- **P1 – Serious but not blocking**
  - Important feature broken for some users (e.g. Import demo fails, What‑If sliders do nothing).
  - Numbers look obviously wrong for many users.

- **P2 – Annoying**
  - Visual bugs (spacing, clipped labels).
  - Confusing copy, but user can still complete tasks.
  - Minor inconsistencies between screens.

- **P3 – Nice to have / idea**
  - Feature requests.
  - Performance or UI improvements that don’t block anyone.

When you log an issue, assign one of these severities.

---

## 4. Triage process (what to do with each issue)

Do this at least once per week, or more often if you have many users:

1. **Group similar reports.**
   - If three people report the same crash, treat it as one issue with “3 reports”.

2. **Review P0s first.**
   - Anything blocking users from basic use should be:
     - Investigated immediately.
     - Given top engineering priority.
   - Example: “App crashes every time I tap What‑If.”

3. **Then review P1s.**
   - Decide whether to fix in the next patch release.
   - Example: “Import demo property shows empty details for some users.”

4. **Review P2/P3s as a batch.**
   - Sort by how often they’re reported and by product impact.
   - Decide what to include in:
     - The next patch release.
     - The next planned feature release.

5. **Mark status clearly.**
   - New → Investigating → Planned → In progress → Fixed → Closed.
   - Always link to the commit or release where the fix shipped (even just a note).

---

## 5. Reproducing and diagnosing issues

When you or your engineer picks up an issue:

1. **Reproduce it in a controlled environment.**
   - Use the same platform (iOS version, device size, or browser).
   - Use the same steps the user described.
   - If possible, use demo data to avoid real account risk.

2. **Check logs and metrics.**
   - Xcode console (for iOS) or browser dev tools (for web).
   - Supabase logs if the issue involves network or auth.

3. **Decide if it is:**
   - A **coding bug** (logic or UI issue).
   - A **configuration issue** (missing API key, wrong URL).
   - A **data issue** (unexpected values or corrupted row).

4. **Propose a concrete fix.**
   - Short description.
   - Any risk to existing users or data.

5. **Add a test when reasonable.**
   - Unit or UI test to prevent regression for core flows.

---

## 6. Communicating with users

Good communication is as important as the fix:

- **When acknowledging:**
  - Thank them for the report.
  - Briefly restate the issue in your own words to show you understand.

- **When you have a plan:**
  - Share whether it’s a quick fix or will take time.
  - Don’t over‑promise; give a rough window instead (“within the next week”).

- **When you ship a fix:**
  - Let them know:
    - What changed.
    - How to update or re‑test.
  - Example: “We just shipped version 1.0.3 which fixes the crash when opening What‑If on imported properties. Please update and let us know if you still see it.”

This builds trust, even if you’re still small.

---

## 7. How this connects to the rest of the system

Support and bug triage are tied to other founder docs:

- **Launch Readiness**
  - P0 issues should be **zero** before launching or pushing a big update.
  - P1 issues should be rare and understood.

- **Admin Ops Checklist**
  - Weekly checks of errors and usage help you spot issues before users do.

- **Pricing & Cost**
  - If you see a pattern like “imports failing due to provider limits,” it may be time to:
    - Adjust quotas or plan pricing.
    - Improve caching or provider configuration.

Everything feeds into a loop:

> Users report → You triage → Engineering fixes → Docs and pricing adjust → Product gets better.

Keep this loop light but consistent, and you’ll stay on top of issues without needing a large team.

