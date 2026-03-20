# PropFolio Test Plan

Practical test plan: automated test matrix, manual test checklist, and seed data plan for demo properties.

---

## 1. Automated test matrix

### 1.1 Unit tests — core formulas

| Area | File / target | What to test | Status |
|------|----------------|--------------|--------|
| **Underwriting** | `UnderwritingEngineTests` | Amortization (monthly payment, balance after N months, annual debt service); income flow (GSR, vacancy, EGI, NOI); debt & cash flow (DSCR, monthly/annual CF); returns (cap rate, CoC, GRM, expense ratio, break-even, debt yield, LTV); unit/occupancy (price per unit, price per SF, breakeven occupancy, equity paydown). All money in USD; deterministic. | ✅ Present |
| **Deal scoring** | `DealScoringEngineTests` | `DealScoringEngine.score(inputs)` → total score 0–100, band (exceptional/strong/good/fair/weak/poor/insufficientData); component weights; `wasCappedByConfidence`; `DealArchetype.from(score:)` and `DealScoreBand.from(score:)` boundaries (90, 75, 60, 45, 30). | ✅ Present |
| **Confidence meter** | `ConfidenceMeterEngineTests` | `ConfidenceMeterEngine.evaluate(inputs)` → score, band (high/medium/low/veryLow); override impact; explanation summary; recommended actions. | ✅ Present |
| **Simulation** | `SimulationEngineTests` | `SimulationEngine.run(inputs)` → underwriting outputs match UnderwritingEngine; total cash to close; mapping from SimulationInputs to UnderwritingInputs. | ✅ Present |
| **Renovation** | `RenovationPlanTests` | Plan totals, category defaults, tier multipliers, contingency; no financial scoring in renovation engine. | ✅ Present |
| **Archetype / band** | Add to DealScoring or new | `DealArchetype.from(score:)` for 0, 44, 45, 74, 75, 89, 90, 100, nil; `DealScoreBand.from(score:)` same boundaries. | ⬜ Add |
| **Address parser** | Add `AddressInputParserTests` | Parse "123 Main St, Austin, TX 78701"; "Austin, TX"; "78701"; empty; state+zip extraction. | ⬜ Add |

### 1.2 Scenario engine tests

| Area | File | What to test | Status |
|------|------|--------------|--------|
| **ScenarioManager** | `ScenarioManagerTests` | Save scenario (adds to list, baseline flag); set baseline (clears other baseline); remove scenario; compare(baseline, comparison) → ScenarioComparison deltas; baseline(from:) / comparisonScenarios(from:). | ✅ Present |
| **ScenarioComparison** | Same or Simulation | Delta signs (positive = improvement for cash flow, etc.); display formatters (currency, percent, deltaString). | ⬜ Add if not covered |

### 1.3 Import parser tests (Zillow / Redfin)

| Area | File | What to test | Status |
|------|------|--------------|--------|
| **Zillow** | `ZillowURLParserTests` (in `PropFolioTests/Services/ImportParserTests.swift`) | Desktop: `https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345678_zpid/` → zpid 12345678, optional address; mobile: same path on zillow.com; path with only `.../12345678_zpid/`; reject non-Zillow host; reject missing _zpid; `canParse` for zillow vs redfin. | ✅ Present |
| **Redfin** | `RedfinURLParserTests` (same file) | Desktop: `/TX/Austin/.../unit/1234567890`, `/home/1234567890`, query `?listingId=...` / `?listing_id=...`; mobile: `m.redfin.com` same paths; reject non-Redfin host; reject missing ID; `canParse`. | ✅ Present |
| **ImportInputParser** | `ImportInputParserTests` (same file) | URL → Zillow/Redfin listing or unsupported domain; typed address → .address(partial, .manual); empty/whitespace → .malformedURL. | ✅ Present |

### 1.4 View model tests

| ViewModel | What to test | Status |
|-----------|--------------|--------|
| **ImportFlowViewModel** | Phase transitions: start → linkInput → importing → result/error; runImportFromLink with success/failure; runImportFromAddress with/without selection; retryAfterError; dismissResult; saveEdits updates result. Use NoOpUsageTracker and mock PropertyDataService (or stub result). | ⬜ Add |
| **SimulationViewModel** | saveScenario adds scenario and optional baseline; setBaseline; removeScenario; loadScenario updates inputs; compare(baseline, scenario) returns delta or nil; recompute on inputs change. | ⬜ Add |
| **AddressAutocompleteViewModel** | Query change cancels previous and starts suggest (min 3 chars); selectSuggestion sets hydratedAddress; clearSelection; currentNormalizedAddress includes unit; fetchPropertyForCurrentAddress calls service and sets phase. | ⬜ Add |

### 1.5 UI smoke tests (major flows)

Requires **UI Test target** (e.g. PropFolioUITests). If none exists, add target and implement:

| Flow | Steps | Assertions |
|------|--------|------------|
| **App launch** | Launch app | Tab bar visible (Home, Import, Portfolio, Settings). |
| **Home → Import** | Tap Import tab → tap "Paste link" or "Enter address" | Link or address screen visible. |
| **Import link (mock)** | Paste URL (or use mock that returns success) → Import | Progress then Result or Error. |
| **Import address (mock)** | Type address → select suggestion (if any) or use manual → Import | Progress then Result or Error. |
| **Result → Edit** | From result, tap Edit → change field → Save | Back to result with updated data. |
| **Portfolio list** | Tap Portfolio tab | List of deal cards or empty state. |
| **Portfolio → Analysis** | Tap a deal card | Analysis screen with score/confidence/metrics. |
| **What-If** | From Analysis or Home, open What-If → change slider → Save scenario | Scenario appears in list; compare shows delta. |
| **Settings** | Tap Settings | Preferences section visible. |

Use **mock/seed data** or **test back door** so import and portfolio don’t depend on live API.

---

## 2. Manual test checklist

### 2.1 iPhone sizes and safe area

| Device | Resolution / size | Checks |
|--------|--------------------|--------|
| **iPhone SE (3rd)** | 4.7" | All tabs reachable; portfolio cards not clipped; filter chips scroll; empty state fits; keyboard doesn’t cover primary CTA on Import address. |
| **iPhone 15 / 16** | 6.1" | Default size; score hero, confidence meter, metric grid readable; What-If sliders and fields usable. |
| **iPhone 15 Pro Max / 16 Plus** | 6.7" | No excessive whitespace; list uses width; modals (Renovation, Save scenario) centered and tappable. |
| **Dynamic Type** | Largest accessibility | Labels not truncated; score/numbers scale; buttons still tappable (min 44pt). |
| **Orientation** | Portrait + Landscape (if supported) | Critical flows (Import, Analysis, Portfolio) usable in both. |

### 2.2 Regression — score, confidence, future value

| Area | Check |
|------|--------|
| **Deal score** | Score 0–100 shown; archetype badge (Risky / Stable / Strong / Exceptional / Need data) matches score; “Score capped” appears when applicable; no score when insufficient data with clear copy. |
| **Confidence** | Confidence meter shows score and band (High / Medium / Low / Very low); explanation and factors visible; band label matches score range. |
| **Future value** | If shown: band label and one-liner; no raw API jargon; disclaimer present; “Market outlook” section only when data available. |
| **Consistency** | Same property/inputs → same score and confidence (deterministic); reopening analysis doesn’t change numbers. |

### 2.3 Manual flow checklist (high level)

- [ ] **Import (link):** Paste Zillow URL → importing → result with address and metrics; paste same URL again → cache hit (no second spinner).
- [ ] **Import (address):** Type address → suggestions or manual → Import → result or error; error shows “Try again” and “Start over”.
- [ ] **Portfolio:** Empty state when no deals; with deals: filters (Archetype, Status) narrow list; tap deal → Analysis; back → list unchanged.
- [ ] **Analysis:** Score, confidence, headline metrics, future value (if any), risks/opportunities; What-If CTA opens simulator.
- [ ] **What-If:** Change purchase price / rent / rate → metrics update; Save scenario → name and baseline option; compare baseline vs scenario shows deltas.
- [ ] **Renovation:** Open from What-If; change category amounts; contingency; Apply → plan updates.
- [ ] **Settings:** Open; no crash; (when wired) account/notifications reachable.

---

## 3. Seed data plan for demo properties

Use for demos, screenshots, and UI/smoke tests so results are predictable and not tied to live API.

### 3.1 Property import seed data

| ID | Purpose | Source | Address / URL |
|----|--------|--------|----------------|
| **demo-oak** | Strong deal, high confidence | Mock or cached | 123 Oak St, Austin, TX 78701 |
| **demo-pine** | Exceptional deal | Mock or cached | 456 Pine Ave, Pflugerville, TX |
| **demo-elm** | Stable, medium confidence | Mock or cached | 789 Elm Dr, Round Rock, TX |
| **demo-cedar** | Risky, low confidence | Mock or cached | 100 Cedar Ln, Georgetown, TX |
| **demo-import-fail** | Error state | Force adapter failure | Any address when mock returns failure |

**Implementation options:**

- **Mock adapter:** `MockPropertyAdapter` returns fixed `RawPropertyData` for a list of addresses (or one generic), so “import” from paste or address always returns the same normalized property and metrics.
- **Cached fixtures:** Pre-populate `PropertyImportCache` (or load from JSON) in debug/screenshot builds with 3–4 `PropertyImportResult` entries keyed by address so “import” hits cache and shows consistent result.
- **URL fixtures:** For parser tests only, use strings: Zillow desktop URL, Zillow mobile URL, Redfin desktop, Redfin mobile (see parser test cases below).

### 3.2 Analysis / dashboard seed data

| Name | Use case | Deal score | Confidence | Future value |
|------|----------|------------|------------|--------------|
| **Strong deal** | Happy path | 82 | High (78) | Moderate tailwinds |
| **Stable deal** | Middle | 58 | Medium (55) | — |
| **Risky deal** | Low score | 38 | Low (42) | — |
| **No score** | Insufficient data | — | — | — |

Align with `AnalysisDashboardState.mock` and `PortfolioMockData.sampleDeals` so one seed = one analysis screen state.

### 3.3 Scenario seed data

- **Baseline:** Purchase $300k, rent $2k/mo, 20% down, 6% rate, 30 yr → known NOI/cap/cash flow.
- **Comparison:** Same but $320k purchase, $2.1k rent → positive deltas for NOI/cash flow, negative for CoC if applicable.

Use `SimulationInputs` / `Scenario` instances in tests and optionally preload in What-If for demo.

### 3.4 Where to store seed data

- **Unit/VM tests:** In test target only (e.g. `PropFolioTests/Fixtures/` or inline in tests).
- **UI tests:** Inject via launch argument / environment or use mock backend that returns fixture JSON.
- **Demo build:** App reads a bundled `seed_properties.json` (or similar) in DEBUG and preloads cache or shows “Demo mode” with fixed list.

---

## 4. Parser test cases (reference)

Use these in `ZillowURLParserTests` and `RedfinURLParserTests`.

### Zillow

- **Desktop (address + zpid):** `https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345678_zpid/` → source zillow, listingID `12345678`, address slug parsed optionally.
- **Desktop (zpid only):** `https://zillow.com/homedetails/12345678_zpid/` → listingID `12345678`.
- **Mobile:** `https://mobile.zillow.com/homedetails/12345678_zpid/` → same (if host allowed); or redirect-style path on zillow.com.
- **Reject:** `https://other.com/homedetails/12345678_zpid/` → unsupportedDomain; path without `_zpid` → missingListingID.

### Redfin

- **Desktop (path ID):** `https://www.redfin.com/TX/Austin/123-Main-St-78701/unit/1234567890` → source redfin, listingID `1234567890`.
- **Desktop (home):** `https://redfin.com/home/1234567890` → listingID `1234567890`.
- **Query:** `https://www.redfin.com/something?listingId=999` → listingID `999`.
- **Mobile:** `https://m.redfin.com/TX/Austin/123-Main-St-78701/unit/1234567890` → same as desktop.
- **Reject:** Non-Redfin host; path + query with no numeric ID → missingListingID.

---

## 5. Summary

| Deliverable | Location / content |
|-------------|--------------------|
| **Automated test matrix** | §1: unit (formulas, scenario, import parsers), view models, UI smoke flows with status (Present / Add). |
| **Manual test checklist** | §2: iPhone sizes, safe area, Dynamic Type; regression for score/confidence/future value; flow checklist. |
| **Seed data plan** | §3: demo properties (import + analysis), scenario fixtures, where to store (tests vs demo build). |

**Next steps:** Add parser tests (§1.3), view model tests (§1.4), and UI test target + smoke tests (§1.5); implement seed fixtures per §3 for demos and UI tests.
