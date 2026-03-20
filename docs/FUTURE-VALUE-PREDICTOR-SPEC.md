# Future Value Predictor — Design Spec

**Purpose:** Provide an **evidence-based directional indicator** for how market fundamentals may support or pressure future property values. This is **not** a guaranteed forecast. It feeds into the Deal Score as the optional "market tailwinds" factor (see `DEAL-SCORING-SPEC.md`).

**PropFolio rules:** No AI for financial metrics; deterministic, testable logic; backend-only data fetch; aggressive caching; cost-conscious providers.

---

## 1. Data Model

### 1.1 Geography (reuse / align)

Use the same geography key as market context for cache and API:

```ts
// Shared: align with MarketGeography (zip | county FIPS | state)
interface FutureValueGeography {
  postalCode?: string;   // optional ZIP
  countyFips?: string;  // optional 5-digit FIPS
  state: string;        // 2-letter required
}
```

Cache key: `future-value:zip:{zip}` | `future-value:county:{fips}` | `future-value:state:{state}`.

### 1.2 Input series (cached, normalized)

Each input is a time series or point-in-time value we normalize for the model. Store per geography with provenance.

```ts
/** Single normalized input for the predictor (e.g. one factor's series or latest value). */
interface FutureValueInputSeries {
  factor: FutureValueFactor;
  geography: FutureValueGeography;
  /** Normalized value(s). For trends: e.g. YoY growth rate as decimal (0.02 = 2%). */
  value: number | number[];  // one number = latest; array = series for trend
  /** Period the value refers to (e.g. "2024-Q3", "2024"). */
  period: string;
  /** When we fetched or computed this. */
  fetchedAt: string;  // ISO 8601
  source: FutureValueDataSource;
  /** 0–1; affects explanation and "insufficient data" handling. */
  confidence: number;
}

enum FutureValueFactor {
  PopulationGrowth = "populationGrowth",
  IncomeGrowth = "incomeGrowth",
  MigrationNet = "migrationNet",
  BuildingPermits = "buildingPermits",
  HousingSupply = "housingSupply",
  RentTrendDirection = "rentTrendDirection",
  EmploymentStability = "employmentStability",
  NeighborhoodTrend = "neighborhoodTrend",  // optional
}
```

### 1.3 Output (score, band, explanation)

Result returned to UI and to Deal Scoring (as market tailwinds 0–100).

```ts
/** Band for UI; aligned with evidence strength, not a price forecast. */
enum FutureValueBand {
  StrongTailwinds = "strongTailwinds",   // 75–100
  ModerateTailwinds = "moderateTailwinds", // 50–74
  Neutral = "neutral",                   // 40–49
  ModerateHeadwinds = "moderateHeadwinds", // 25–39
  StrongHeadwinds = "strongHeadwinds",   // 0–24
  InsufficientData = "insufficientData",
}

/** One factor's contribution to the score (for explanation). */
interface FutureValueFactorContribution {
  factor: FutureValueFactor;
  subScore: number;      // 0–100
  weight: number;        // weight used (after renormalization)
  contribution: number;  // subScore * weight
  dataPoint: string;    // e.g. "+2.1% population growth"
  sourceLabel: string;  // e.g. "Census, 2024"
}

/** Result of the Future Value Predictor. */
interface FutureValuePredictorResult {
  geography: FutureValueGeography;
  /** 0–100; null when insufficient data. */
  score: number | null;
  band: FutureValueBand;
  /** Factor-level breakdown for "why this score". */
  contributions: FutureValueFactorContribution[];
  /** User-facing summary (evidence-based, not a guarantee). */
  explanation: FutureValueExplanation;
  /** At least one factor had data from this time. */
  dataHorizon: string;  // e.g. "2024-Q3"
  generatedAt: string;  // ISO 8601
}

/** Structured explanation (supporting / limiting / summary). */
interface FutureValueExplanation {
  summary: string;
  supportingFactors: string[];
  limitingFactors: string[];
  /** Short disclaimer always shown near the score. */
  disclaimerShort: string;
}
```

### 1.4 Stored cache shape (backend)

Backend stores raw or normalized series per geography to avoid re-fetching. Suggested shape:

```ts
/** Per-geography cache entry for predictor inputs. */
interface FutureValueCacheEntry {
  geography: FutureValueGeography;
  inputs: FutureValueInputSeries[];
  /** When this cache entry was last fully updated. */
  updatedAt: string;
  /** Next refresh allowed after this time (ISO 8601). */
  refreshAfter: string;
}
```

---

## 2. Data-Source Mapping

Map each factor to public or low-cost, cacheable sources. All calls from **backend only**; mobile receives only the computed result (or cached result).

| Factor | Primary source | Geography | Typical lag | Cost | Notes |
|--------|----------------|-----------|-------------|------|--------|
| **Population growth** | Census Bureau (ACS 1-year or 5-year; PEP for annual) | County, Metro, State | 1–2 years | Free (API key) | YoY % change; prefer county/state. |
| **Income growth** | Census (ACS median household income) or BLS (wages) | County, Metro, State | 1 year | Free | YoY % change in median income or wages. |
| **Migration patterns** | Census (ACS migration flows, PEP components) or IRS SOI | State, Metro, County | 1–2 years | Free | Net in-migration rate or inflow/outflow ratio. |
| **Building permits** | Census Building Permits Survey (C40) | County, Metro, State | Monthly | Free | Units permitted; YoY or trend; proxy for supply pipeline. |
| **Housing supply** | Census (vacancy, inventory), or backend market proxy (months of inventory) | County, State, ZIP | Quarterly / from market API | Free / backend | Months of supply or inventory count; normalize to 0–100. |
| **Rent trend direction** | HUD FMR, Zillow Observed Rent Index (free research), or backend rent series | Metro, County, State | Monthly / quarterly | Free / backend | Direction: up / flat / down; avoid paid Zillow API from client. |
| **Employment stability** | BLS (unemployment rate, payrolls), or state LAUS | County, Metro, State | Monthly | Free (API key) | Unemployment level and change; inverse for “stability”. |
| **Neighborhood trend** | Optional: HUD, NBER, or curated “neighborhood” indices if reliable and free | Varies | Varies | Free only | Omit if no reliable free source; do not add paid APIs. |

### 2.1 Source identifiers (for provenance)

```ts
enum FutureValueDataSource {
  Census = "census",
  BLS = "bls",
  Fred = "fred",
  HUD = "hud",
  CensusPermits = "censusPermits",
  BackendMarket = "backendMarket",
  Derived = "derived",
}
```

### 2.2 Normalization rules (high level)

- **Growth rates:** Store as decimals (e.g. 0.021 for 2.1%). Model converts to 0–100 sub-scores using documented thresholds.
- **Rent trend:** Map "up" → higher sub-score, "down" → lower, "flat" → middle.
- **Employment:** Lower unemployment (or improving) → higher sub-score; use BLS series with clear date range.
- **Supply:** Lower months-of-supply (tighter market) → higher sub-score within bounds; cap extremes.
- **Permits:** Moderate growth can be positive; extreme boom may be normalized so as not to overweight (document in model logic).

All normalization must be **deterministic and unit-testable** (no AI).

---

## 3. Model Logic

### 3.1 Weights (documented, fixed)

Weights sum to 1.0. Missing optional factors are omitted and weights **renormalized** over present factors. "Neighborhood trend" is optional; if absent, its weight is distributed to others (or left out of denominator).

| # | Factor | Weight | Required |
|---|--------|--------|----------|
| 1 | Population growth | 0.18 | Yes (or band = InsufficientData if all required missing) |
| 2 | Income growth | 0.15 | Yes |
| 3 | Migration patterns | 0.14 | Yes |
| 4 | Building permits | 0.12 | No |
| 5 | Housing supply | 0.14 | No |
| 6 | Rent trend direction | 0.12 | Yes |
| 7 | Employment stability | 0.15 | Yes |
| 8 | Neighborhood trend | 0.10 | No |

**Required for a valid score:** at least population OR migration, plus income, rent trend, and employment. If required set is not met, return `score: null`, `band: InsufficientData`, and explanation that more market data is needed.

### 3.2 Sub-score formulas (0–100, deterministic)

- **Population growth (YoY %):**  
  `≤ -1% → 0`; `-1% to 0 → 0–25`; `0 to 2% → 25–60`; `2% to 5% → 60–90`; `≥ 5% → 100`. Linear interpolation within segments.

- **Income growth (YoY %):**  
  `≤ -2% → 0`; `-2% to 0 → 0–30`; `0 to 3% → 30–70`; `≥ 3% → 70–100`. Linear.

- **Migration (net in-migration rate or ratio):**  
  Negative → 0–40; near zero → 50; positive → 60–100. Exact thresholds TBD from data (e.g. per-capita net flow or state-level IRS in/out ratio).

- **Building permits (YoY % change in units):**  
  Large decline → low; flat/slight growth → mid; very high growth → cap at 85 (avoid overweighting boom). Linear with cap.

- **Housing supply (months of inventory or equivalent):**  
  Low supply (e.g. &lt; 3 months) → 90–100; 3–6 → 60–90; 6–12 → 30–60; &gt; 12 → 0–30.

- **Rent trend direction:**  
  Up → 75; Flat → 50; Down → 25. (If we have a continuous rent index change %, map similarly.)

- **Employment stability:**  
  Based on unemployment level and change: low and stable or improving → high sub-score; high or rising → low. Exact mapping TBD (e.g. unemployment 4–5% and stable → 70–80; &gt; 7% or rising → 30–40).

- **Neighborhood trend (optional):**  
  If present: positive → 70–100, neutral → 50, negative → 20–40. If absent, omit and renormalize.

All formulas must be implemented in code with unit tests; thresholds are constants (no AI).

### 3.3 Score and band

- **Score:**  
  `score = sum(subScore_i * weight_i) / sum(weight_i)` over present factors, then round to 0–100. If required factors missing → `score = null`.

- **Band:**  
  - 75–100 → StrongTailwinds  
  - 50–74 → ModerateTailwinds  
  - 40–49 → Neutral  
  - 25–39 → ModerateHeadwinds  
  - 0–24 → StrongHeadwinds  
  - Insufficient data → InsufficientData  

### 3.4 Explanation generation (rule-based)

- **Supporting factors:** List factors with sub-score &gt; 60 and positive data point (e.g. "Population growth +2.1% (Census, 2024)").
- **Limiting factors:** List factors with sub-score &lt; 40 or missing required (e.g. "Employment data not available for this geography").
- **Summary:** One sentence: band + 1–2 main drivers (e.g. "Moderate tailwinds (62/100). Income and rent trends support demand; supply is tightening.").
- **Disclaimer short:** Always append the standard short disclaimer (see §5).

No AI: use only factor names, sub-scores, and data points from the model.

---

## 4. API / Job Orchestration Plan

### 4.1 Backend-only data flow

- **No paid or third-party API calls from the mobile client.**  
  All data is fetched by backend jobs or on-demand backend endpoints using server-side keys/env.

- **Single entry point for client:**  
  `GET /market/future-value?zip=… | countyFips=… | state=…`  
  Returns `FutureValuePredictorResult` (JSON). Client may cache this by geography (e.g. 24h).

### 4.2 Caching strategy

- **Per-geography cache:**  
  Store `FutureValueCacheEntry` keyed by `future-value:zip:{zip}` or `county:{fips}` or `state:{state}`.

- **TTL:**  
  - Public data (Census, BLS, FRED, HUD, permits): refresh **no more than once per 24 hours** per geography; prefer 24–48h for cost and rate limits.  
  - Backend’s own market/rent series: use same or longer TTL as existing market context (e.g. 24h).

- **Stale-while-revalidate:**  
  Return cached result immediately if `refreshAfter` has not passed; optionally enqueue a background refresh for next request.

### 4.3 Job orchestration (backend)

- **Option A — On-demand only:**  
  On first request for a geography, backend fetches all needed series (from internal cache or external APIs), computes result, stores in `FutureValueCacheEntry`, returns result. Subsequent requests serve from cache until TTL.

- **Option B — Scheduled + on-demand:**  
  - Nightly (or 2x/day) job: refresh inputs for “active” geographies (e.g. states/counties/ZIPs that had requests in last 7 days).  
  - On-demand: same as Option A but may hit pre-warmed cache.

- **Rate and cost:**  
  - Prefer batch or bulk endpoints where available (e.g. Census).  
  - Use a single shared cache for raw series (e.g. county-level BLS) so multiple geographies reuse the same series.  
  - No paid APIs from client; keep paid usage server-side and minimal.

### 4.4 Failure and partial data

- If **all** required factors are missing for a geography → return `InsufficientData` and explanation "We don't have enough market data for this area yet."
- If **some** factors missing → compute score from present factors with renormalized weights; add limiting factor: "Some indicators are missing; score is based on available data."
- If **upstream timeout/error** → serve stale cache if available and set a flag or note in explanation; otherwise return 503 or InsufficientData with message.

---

## 5. User-Facing Explanation Copy

### 5.1 Framing principles

- **Evidence-based, not a guarantee:** Everywhere we say this is based on current data and trends, not a promise of future prices.
- **Directional:** Use "tailwinds" / "headwinds" / "supports" / "pressures" rather than "will go up X%."
- **Provenance:** Where helpful, mention data source and period (e.g. "Census, 2024") in expandable or secondary copy.

### 5.2 Standard short disclaimer (always shown)

Use next to the score or band:

- **"Market outlook is an evidence-based directional indicator, not a guarantee of future value. Based on public data (e.g. population, income, employment, supply)."**

### 5.3 Band labels and one-liners

| Band | Label (UI) | One-liner |
|------|------------|-----------|
| StrongTailwinds | Strong tailwinds | Several indicators point to supportive fundamentals for value. |
| ModerateTailwinds | Moderate tailwinds | On balance, market data leans supportive for value. |
| Neutral | Neutral | Mixed signals; no strong directional read from the data. |
| ModerateHeadwinds | Moderate headwinds | Some indicators suggest softer fundamentals. |
| StrongHeadwinds | Strong headwinds | Multiple indicators suggest weaker fundamentals for value. |
| InsufficientData | Not enough data | We don’t have enough market data for this area yet. |

### 5.4 Explanation templates (rule-based)

- **Summary (example):**  
  "Moderate tailwinds (62/100). Income growth and rent trends support demand; employment is stable. Supply is slightly above the long-term norm."

- **Supporting (examples):**  
  - "Population growth +2.1% (Census, 2024)."  
  - "Median income up 3% year-over-year."  
  - "Rent trend direction: up."  
  - "Unemployment low and stable (BLS)."  

- **Limiting (examples):**  
  - "Building permit data not available for this geography."  
  - "Months of supply above 6; market is looser."  
  - "Some indicators are missing; score is based on available data."  

### 5.5 Longer disclaimer (footer or modal)

- **"Future Value is a directional score based on public market data (population, income, migration, permits, supply, rent trends, employment). It is not a price forecast, does not guarantee appreciation, and should not be the only factor in your investment decision. Data can be delayed or revised. Past trends do not guarantee future results."**

---

## 6. Integration with Deal Score

- The Deal Scoring Engine already has an optional **market tailwinds** input (0–100) with weight 4% (see `DEAL-SCORING-SPEC.md`).
- **Contract:** Backend (or client with cached response) calls the Future Value Predictor by geography; takes `result.score` (or 0 if `InsufficientData`); passes it as `marketTailwinds` into `DealScoreInputs`.
- Do **not** pass raw forecasts or dollar appreciation from this predictor into underwriting or deal score; only the 0–100 directional score.

---

## 7. Checklist for implementation

- [ ] Shared types: `FutureValueGeography`, `FutureValueFactor`, `FutureValuePredictorResult`, `FutureValueExplanation`, `FutureValueBand`, `FutureValueCacheEntry` (TypeScript or Swift mirror).
- [ ] Data-source adapters (backend): at least Census, BLS, and one of HUD/FRED/backend market for rent and supply; permits from Census.
- [ ] Normalization and sub-score functions: unit tested, deterministic.
- [ ] Weight table and renormalization when factors are missing.
- [ ] Cache layer: key by geography, TTL 24–48h, stale-while-revalidate optional.
- [ ] API: `GET /market/future-value` returning `FutureValuePredictorResult`; no paid calls from client.
- [ ] Copy: short disclaimer always shown; band labels and explanation templates in app or backend copy module.
- [ ] Deal Score: feed `score` (or 0) as `marketTailwinds` when Future Value is available.

---

## 8. Insight summaries (explanation engine)

Concise, one-line insights that map 1:1 to a real predictor input. Used in supporting/limiting lists and in the summary. Rules: **plain language**, **investor-friendly**, **tailwind vs headwind clear**, **never imply certainty** (use "may," "can," "suggests," "supports," "may pressure").

### 8.1 Template table (one insight per factor)

| Factor | Tailwind (subScore ≥ 60) | Headwind (subScore ≤ 40) | Neutral (41–59) |
|--------|--------------------------|---------------------------|-----------------|
| **Population growth** | Population is growing, which can support future demand. | Population is declining or flat, which may soften demand. | Population is roughly stable. |
| **Income growth** | Incomes are rising, which can support housing demand and values. | Income growth is weak or declining, which may pressure affordability. | Income trends are mixed or flat. |
| **Migration (net)** | More people are moving in than out, which may support demand. | More people are leaving than arriving, which may soften demand. | Migration is roughly in balance. |
| **Building permits** | Permit activity is moderate or low, which can keep supply in line with demand. | Permit activity is elevated, which may increase future supply and moderate appreciation. | Permit activity is steady. |
| **Housing supply** | Supply is tight (low months of inventory), which can support prices. | Supply is high (e.g. many months of inventory), which may moderate prices. | Supply is near typical levels. |
| **Rent trend** | Rents are trending up, which can support property values. | Rents are trending down or flat, which may limit upside. | Rent trends are flat or mixed. |
| **Employment stability** | Employment is stable or improving, which can support the local economy and housing. | Employment is weak or worsening, which may pressure the market. | Employment trends are mixed. |
| **Neighborhood trend** | Neighborhood-level data leans positive. | Neighborhood-level data leans negative. | Neighborhood trends are neutral. |

**Note (permits):** The model may encode permit *growth* as a positive sub-score (e.g. high growth → 85). For **insight selection only**, treat BuildingPermits as **inverted**: when `subScore >= 60` use the **headwind** template (elevated activity → more future supply); when `subScore <= 40` use the **tailwind** template (moderate/low activity).

### 8.2 Engine logic (deterministic)

**Input:** List of `FutureValueFactorContribution` (factor, subScore, dataPoint, sourceLabel).

**Output:** List of **insight summaries** (strings), one per contribution, in a consistent order (e.g. by factor enum order).

**Rules:**

1. **Classify each contribution:**
   - `subScore >= 60` → use **tailwind** template for that factor (except BuildingPermits: use **headwind** — high permits = more future supply).
   - `subScore <= 40` → use **headwind** template (except BuildingPermits: use **tailwind**).
   - `41 <= subScore <= 59` → use **neutral** template.

2. **Do not** substitute the raw data point into the sentence in a way that implies certainty (e.g. avoid "Population grew 2%, so values will rise"). Optional: append data point in parentheses for provenance, e.g. "Population is growing, which can support future demand (+2.1%, Census 2024)."

3. **Order:** Emit insights in a fixed factor order (e.g. population, income, migration, permits, supply, rent, employment, neighborhood) so the list is stable and easy to scan.

4. **Missing factors:** Do not emit an insight for a factor that is not in the contributions list (no "Population: no data" as an insight; that belongs in limiting factors as a separate line, e.g. "Population data not available for this geography.").

**Pseudocode:**

```
function insightSummaries(contributions: FutureValueFactorContribution[]): string[] {
  const order = [PopulationGrowth, IncomeGrowth, MigrationNet, BuildingPermits, HousingSupply, RentTrendDirection, EmploymentStability, NeighborhoodTrend];
  return order
    .filter(f => contributions.some(c => c.factor === f))
    .map(f => {
      const c = contributions.find(c => c.factor === f);
      const template = c.subScore >= 60 ? tailwind(f) : c.subScore <= 40 ? headwind(f) : neutral(f);
      return optionallyAppendDataPoint(template, c.dataPoint, c.sourceLabel);
    });
}
```

### 8.3 Example outputs

**Example A — Moderate tailwinds (score 62)**  
Contributions: population 72, income 68, migration 55, permits 45, supply 58, rent 75, employment 70.

- Population is growing, which can support future demand.
- Incomes are rising, which can support housing demand and values.
- Migration is roughly in balance.
- Permit activity is steady.
- Supply is near typical levels.
- Rents are trending up, which can support property values.
- Employment is stable or improving, which can support the local economy and housing.

**Example B — Mixed (score 48)**  
Contributions: population 35, income 52, migration 30, supply 65, rent 50, employment 45.

- Population is declining or flat, which may soften demand.
- Income trends are mixed or flat.
- More people are leaving than arriving, which may soften demand.
- Supply is tight (low months of inventory), which can support prices.
- Rent trends are flat or mixed.
- Employment trends are mixed.

**Example C — Headwinds (score 28)**  
Contributions: population 25, income 30, permits 85, supply 20, rent 25, employment 28.

- Population is declining or flat, which may soften demand.
- Income growth is weak or declining, which may pressure affordability.
- Permit activity is elevated, which may increase future supply and moderate appreciation.
- Supply is high (e.g. many months of inventory), which may moderate prices.
- Rents are trending down or flat, which may limit upside.
- Employment is weak or worsening, which may pressure the market.
