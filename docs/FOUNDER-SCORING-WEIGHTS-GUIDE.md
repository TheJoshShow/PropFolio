# PropFolio – Non‑Technical Guide to Editing Scoring Weights

This guide explains **how to safely change scoring weights** without breaking the math or surprising users. It is written for a smart non‑developer; you can hand this to a product/quant partner as well.

---

## 1. What the scoring engine is (in plain English)

The deal score is:

- A **0–100 score** that says “How good is this deal financially?”
- Built from **sub‑scores** like:
  - Cap rate.
  - Cash flow.
  - DSCR (debt coverage).
  - Expense ratio.
  - Renovation burden.
  - Market tailwinds.
  - Data confidence.
- Each sub‑score is also 0–100 and comes from **deterministic formulas** (see `docs/DEAL-SCORING-SPEC.md`).

The final score is:

- A **weighted average** of these sub‑scores.
- Then limited by **guardrails**, especially **data confidence** (low‑confidence data caps the score).

No AI is involved. Changing weights is like adjusting sliders on a mixing board – but the math is fixed and unit‑tested.

---

## 2. Rules you must not break

When adjusting scoring weights, always respect these rules:

1. **Total weight must stay at 100%.**
   - If you increase one factor, you must decrease others so the total stays at 100.

2. **Required safety factors must stay meaningful.**
   - **Data confidence** must never be set to a tiny weight; it also enforces a **cap** on the final score when low.
   - Core risk measures like **DSCR** and **cash flow** should not be near zero.

3. **Do not remove guardrails.**
   - There is a specific rule: if **data confidence** is below a threshold, the overall score is capped (cannot say “Strong” on poor data).
   - Do not disable or weaken this without a strong quantitative reason.

4. **No money math in AI.**
   - Even if you add AI explanations later, the scoring logic and weights must stay in the deterministic engine, not in an LLM prompt.

If you keep these rules, you can safely adjust how “aggressive” or “conservative” the scoring feels.

---

## 3. Where the weighting logic lives

The definitive technical spec is in:

- `docs/DEAL-SCORING-SPEC.md`
- `docs/QUANT-AUDIT-SCORE-ARCHETYPE-CONFIDENCE.md`

The actual implementation lives in **Engine/Underwriting** (not shown here to keep this guide non‑technical), but engineers will refer to those specs when making changes.

As a founder or product owner, you should operate on the **spec** (weights and band definitions), not the code directly.

---

## 4. How to propose a safe change (step‑by‑step)

Here is the recommended process:

1. **Write down the change in words first.**
   - Example: “We want to care more about DSCR and less about purchase discount.”

2. **Map that to weights in the spec.**
   - Use the table in `DEAL-SCORING-SPEC` (section “Inputs and weights”).
   - Suggest new weights that:
     - Keep the total at 100.
     - Do not reduce DSCR, cash flow, or data confidence below a sensible minimum.

3. **Create a “before vs after” example table.**
   - Pick 3–5 sample deals (e.g. from demo data).
   - For each, list:
     - Old score & band (Strong, Stable, Risky, etc.).
     - New score & band with proposed weights.
   - In plain English, explain:
     - Which deals went up or down.
     - Why that change matches your intent (e.g. heavily levered deals should be punished more).

4. **Get buy‑in from the quantitative reviewer.**
   - Share the table and reasoning.
   - Confirm that the new weights do not introduce:
     - Score inflation (too many deals in “Exceptional”).
     - Strange edge cases (e.g. deals with no cash flow still scoring high).

5. **Have engineering implement + unit test the change.**
   - Engineers update the engine:
     - Adjust weights.
     - Update tests to lock in the new behavior.
   - Do **not** hand‑edit code yourself if you’re not comfortable; stay at the spec level.

6. **Validate in the app with real examples.**
   - Run demo deals and a few real deals (if available).
   - Make sure:
     - Scores and archetypes feel right.
     - Confidence caps still behave as expected.

---

## 5. Common “knobs” and how they affect users

Here’s how changing different weights tends to feel for users:

- **Increase cap rate weight**
  - High‑yield deals look better, even if other factors are middling.
  - Lower‑yield but safe deals may look worse.

- **Increase cash flow weight**
  - Deals with strong monthly/annual cash flow stand out.
  - Thin cash flow deals are clearly penalized.

- **Increase DSCR weight**
  - Leverage risk (ability to cover debt) is highlighted.
  - Aggressively financed deals (low DSCR) look much worse.

- **Increase expense ratio weight**
  - High‑expense properties (bad expense ratio) are punished more.

- **Increase renovation burden weight**
  - Heavy renovation projects will look worse unless upside is very strong.

- **Increase market tailwinds weight**
  - Properties in strong markets score higher, even if current cash flow is average.
  - Good for a “future‑oriented” investor audience.

- **Increase data confidence weight or tighten caps**
  - Deals with poor or missing data cannot look “Amazing.”
  - Encourages users to fill in missing fields.

Use these intuitions when deciding where to adjust.

---

## 6. How to know if a change was a mistake

After changing weights, watch for:

- **Too many deals clustered at the top or bottom.**
  - If all decent deals are 85–95, you’ve likely inflated one factor too much.

- **Deals that don’t match investor intuition.**
  - For example, highly levered deals with razor‑thin cash flow showing as “Strong.”

- **Confusion between score and confidence.**
  - If users start asking “Why is this risky deal showing a good score?” you may have weakened the guardrails.

If you see these signs:

- Roll back to the previous weights.
- Revisit the spec with a quant lens.

---

## 7. Summary: your role vs engineering’s role

**Your role (non‑technical founder / product):**

- Decide what “good” and “risky” should mean in real‑world terms.
- Propose changes in the **spec**:
  - Which factors matter more or less.
  - Example deals and desired bands.
- Approve final behavior after seeing examples.

**Engineering’s role:**

- Implement those changes **safely** in the scoring engine.
- Maintain unit tests and guardrails.
- Ensure no AI is involved in the numeric calculations.

If you stay focused on the **spec** and use the process above, you can confidently evolve PropFolio’s scoring model without accidentally breaking trust with your users.

