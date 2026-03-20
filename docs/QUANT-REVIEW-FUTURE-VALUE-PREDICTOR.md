# Quant Review: Future Value Predictor

**Scope:** Future Value Predictor design (data model, data-source mapping, model logic, API/orchestration, insight copy).  
**Checks:** Variable choice, look-ahead bias, unsupported certainty, cost of public data pulls, explainability to novice users, graceful degradation when market inputs are missing.

**Reference:** `docs/FUTURE-VALUE-PREDICTOR-SPEC.md`, `PropFolio/Services/MarketIntelligence/FutureValueInsightCopy.swift`.

---

## 1. Verdict Summary

| Check | Pass/Fail | Notes |
|-------|-----------|--------|
| **Variable choice** | **PASS** | Inputs are standard fundamentals; no double-counting. Optional: document why macro rates omitted. |
| **Look-ahead bias** | **PASS** | Real-time “current outlook” uses latest available data; no backtest. Add explicit “data through” rule and display. |
| **Unsupported certainty** | **PASS** | Framing is evidence-based and directional; disclaimers and hedging (“may,” “can”) throughout. |
| **Cost of public data pulls** | **PASS** | Backend-only, free sources, 24–48h cache, shared series across geographies. Add “fetch at coarsest geography first” guidance. |
| **Explainability to novices** | **PASS** | Plain language; tailwind/headwind clear. Optional: brief explainer for “months of inventory.” |
| **Missing inputs degrade gracefully** | **CONDITIONAL** | Renormalization and InsufficientData are correct. Add guard when very few factors present (e.g. score from 1–2 factors can overstate confidence). |

**Overall: CONDITIONAL PASS** — apply improvements below; no blocking failures.

---

## 2. Variable Choice

**What was reviewed:** Choice of inputs (population growth, income growth, migration, building permits, housing supply, rent trend, employment stability, optional neighborhood trend).

**Findings:**

- Variables are standard demand/supply and labor fundamentals and map cleanly to public data. No overlap between factors (e.g. income vs employment are distinct; permits vs supply are pipeline vs current inventory).
- Building permits are correctly interpreted as *future* supply; the inverted insight (elevated permits → headwind) is consistent with the variable meaning.
- Rent trend direction is a demand/valuation proxy without implying a specific price path.

**Gaps (acceptable by design):**

- Interest rates / cost of capital are not an input. For a directional indicator that avoids a price forecast, omitting rates is a reasonable choice (rates are macro, often national). If the product later adds “rate environment” as context, it should be documented as a separate, optional input.
- Distressed supply (e.g. foreclosure share) and zoning/land-use are not included; spec already limits to “reliable” and preferably free sources.

**Improvement:** In the spec, add one sentence under “Model Logic” or “Data-Source Mapping”: e.g. “Interest rates and other macro factors are not included; the score reflects local fundamentals only.”

---

## 3. Look-Ahead Bias

**What was reviewed:** Whether the predictor could inadvertently use future information (e.g. revised or later-released data) as if it were known at the time of the “prediction.”

**Findings:**

- The design is a **real-time current outlook**: we produce a single “as of now” score from the latest available inputs. There is no backtest or point-in-time simulation, so there is no explicit “prediction date” vs “data through date” in the current flow.
- Data sources have publication lags (Census 1–2 years, BLS monthly, etc.). Using “latest available” for a current outlook is appropriate and does not constitute look-ahead.
- Risk: If we later add historical or backtested outlooks, we must restrict inputs to data with **release/period end ≤ reference date**. Today’s design does not yet define a formal “reference date” or “data through” for the single live score.

**Improvements:**

1. **Define and expose “data through”:** In the result, `dataHorizon` (e.g. “2024-Q3”) should be defined as “latest period end across all inputs used.” Document that every input has `period` ≤ this horizon (or explicitly document any exception, e.g. “as of release date”).
2. **Display:** Always show the user something like “Based on data through [dataHorizon]” near the score so it’s clear we are not using future data.
3. **Future backtests:** If the product ever supports “outlook as of date T,” the implementation must fetch only data that would have been available as of T (by release date / vintage), and the spec should state this.

**Verdict: PASS** — no look-ahead in current design; improvements above reduce risk and clarify semantics.

---

## 4. Unsupported Certainty

**What was reviewed:** Whether the predictor or its copy implies guarantees, false precision, or certainty about future values.

**Findings:**

- Spec and copy consistently frame the output as an **evidence-based directional indicator**, not a forecast. Disclaimers are required and always shown (short + longer footer).
- Insights use hedging language: “can support,” “may soften,” “may pressure,” “suggests.” No “will” or “guarantee” in the template set.
- Output is a 0–100 score and band only; no dollar or percentage appreciation is produced for the user, which avoids false precision.
- Band one-liners use “supportive fundamentals” / “softer fundamentals” rather than “values will rise/fall.”

**Verdict: PASS** — no unsupported certainty; keep disclaimers mandatory in implementation.

---

## 5. Cost of Public Data Pulls

**What was reviewed:** API cost, rate limits, caching, and backend-only usage.

**Findings:**

- All external data is fetched **backend-only**; no paid or third-party APIs from the client. Aligns with PropFolio rules.
- Sources are free (Census, BLS, FRED, HUD, Census permits) with API keys; no per-call cost assumed.
- Caching: 24–48h TTL per geography; shared cache for raw series (e.g. county-level BLS reused across ZIPs); stale-while-revalidate mentioned.
- Spec says “prefer batch or bulk endpoints” and “use a single shared cache for raw series.”

**Improvement:** Add explicit **geography hierarchy** guidance to minimize calls: e.g. “Fetch at state or county level where the API supports it; derive or map to ZIP from county/state so that one state/county pull serves many ZIPs.” This keeps cost and rate-limit risk low as geography coverage grows.

**Verdict: PASS** — cost-conscious; the improvement above makes scaling safer.

---

## 6. Explainability to Novice Users

**What was reviewed:** Whether the score, band, and insight copy are understandable to non-expert investors.

**Findings:**

- Insight sentences are short and plain: “Population is growing, which can support future demand.” No jargon in the user-facing text (no “YoY,” “sub-score,” or “cap rate” in insights).
- Tailwinds vs headwinds are clearly separated (templates and band labels), and band one-liners explain what the band means (e.g. “On balance, market data leans supportive for value”).
- “Months of inventory” appears in supply insight (“Supply is tight (low months of inventory)”). Novices may not know the definition.

**Improvement:** Optional UX: one-time tooltip or help text for “months of inventory” (e.g. “How long it would take to sell current listings at the current sales pace”). Not required for pass; improves clarity.

**Verdict: PASS** — insights are explainable; optional tooltip improves novice experience.

---

## 7. Missing Market Inputs Degrade Gracefully

**What was reviewed:** Behavior when required or optional inputs are missing; renormalization; failure modes.

**Findings:**

- **Required set:** At least population OR migration, plus income, rent trend, and employment. If not met → `score: null`, `band: InsufficientData`, explanation “We don’t have enough market data for this area yet.” Correct.
- **Some factors missing:** Weights renormalized over present factors; limiting factor added: “Some indicators are missing; score is based on available data.” Correct.
- **Upstream failure:** Serve stale cache with a note, or 503/InsufficientData. Correct.

**Risk:** If only the **minimum** required factors are present (e.g. population, income, rent trend, employment — 4 factors), the score is a weighted average over those four. Renormalization gives each a large effective weight. In an extreme case, only one or two factors might be present (e.g. if “required” is relaxed in code). A score of 75 (“Strong tailwinds”) from a single strong factor (e.g. income) could overstate how much evidence supports the read.

**Improvement:** Add a **minimum-factor guard** in the spec and implementation:

- Option A: Require at least **3 or 4 factors** (including required set) before returning a non-null score; otherwise return `InsufficientData` with “We need more market indicators to show a score.”
- Option B: If fewer than N factors (e.g. N = 4) are present, still compute the score but add a **limiting factor** every time: “Score is based on only [k] indicators; more data would improve reliability.”

Recommend **Option B** so we still show a directional read when data is thin, while making the limitation explicit.

**Verdict: CONDITIONAL PASS** — degradation rules are correct; add the minimum-factor guard (prefer Option B) to avoid overstating confidence when only a few inputs exist.

---

## 8. Recommended Spec / Implementation Changes

| Priority | Change |
|----------|--------|
| 1 | **Data horizon:** Document that `dataHorizon` is the latest period end across inputs; display “Based on data through [dataHorizon]” in UI. |
| 2 | **Missing inputs:** When number of present factors is below a threshold (e.g. 4), add a fixed limiting factor: “Score is based on only [k] indicators; more data would improve reliability.” Optionally require a minimum factor count for non-null score. |
| 3 | **Variable choice:** One sentence in spec: “Interest rates and other macro factors are not included; the score reflects local fundamentals only.” |
| 4 | **Cost:** In API/orchestration section, add: “Fetch at state/county level where possible; map to ZIP from county/state to minimize API calls.” |
| 5 | **UX (optional):** Tooltip or help text for “months of inventory” where supply insight is shown. |

---

## 9. Summary

**Overall: CONDITIONAL PASS.**

The Future Value Predictor is sound for variable choice, avoidance of look-ahead in the current design, avoidance of unsupported certainty, cost control, and explainability. Missing inputs are handled with renormalization and InsufficientData; the only condition is to add an explicit guard (or limiting copy) when very few factors are present so that a score from 1–2 inputs does not overstate confidence. Applying the improvements in §8 will bring the design to a full **PASS** with no blocking issues.
