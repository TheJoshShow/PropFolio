# PropFolio — Property Detail MVP Spec

**Purpose:** Minimal scope for a property detail screen with confidence/deal score so store copy can honestly promise "confidence score" or "deal score" in-app.  
**Use when:** Choosing Path A (implement minimal score view before launch) or planning post-launch Phase 6.  
**Source:** release_blocker_report.md, feature_claims_gap_report.md  
**Date:** 2025-03-12

---

## 1. Goals

- User can **see** saved properties (portfolio list).
- User can **open** a property and see a **detail** screen.
- Detail screen shows at least **one** of: confidence score or deal score (or clear "Score coming soon" when inputs are insufficient).
- All copy that mentions "confidence score" or "deal score" is truthful.

---

## 2. Out of scope for this MVP spec

- Full underwriting or simulation UI.
- Renovation scenarios, stress tests, or multi-scenario comparison.
- Link-based import (Zillow/Redfin full scrape); address + optional rent only.

---

## 3. Data and APIs

- **List:** Query `properties` for the current user's default portfolio (via `portfolios.user_id` or equivalent). Order by created_at desc. Return at least: `id`, `street_address`, `city`, `state`, `postal_code`, `list_price`, `rent` (if stored), `bedrooms`, `bathrooms`, `sqft`, `created_at`.
- **Detail:** Fetch single property by `id` (and ensure it belongs to user's portfolio). Same fields; add any fields needed for score inputs (e.g. rent, list_price for a minimal cap rate or data-completeness confidence).
- **Rent:** If `properties` does not store `rent` today, either add column and set it from `PropertyImportData.rent` on import, or derive from a separate table; confidence/score need at least list_price + rent for minimal deal signal.

---

## 4. Screens and flows

| Screen | Description |
|--------|-------------|
| **Portfolio (list)** | Replace static empty state with: if count === 0, show current empty state (with updated copy). If count > 0, show list of properties (e.g. address line, city/state, optional list_price or "—"). Tap row → navigate to property detail. |
| **Property detail** | New route, e.g. `app/(tabs)/portfolio/[id].tsx` or `app/portfolio/[id].tsx`. Show: address, basic fields (list price, rent if any, beds/baths/sqft), and **score block**: either (a) confidence score (from `evaluateConfidence` with inputs derived from property + defaults) or (b) deal score (from `score` with inputs from underwriting/simulation if available) or (c) "Score coming soon — add more data to unlock" when inputs are insufficient. Back to Portfolio list. |

---

## 5. Score inputs (minimal)

- **Confidence:** `ConfidenceMeterInputs` uses e.g. `rentEstimateConfidence`, `expenseAssumptionsConfidence`, etc. For MVP, derive from what’s on the property: e.g. rent present → rentEstimateConfidence 0.6; list_price + rent → simple data completeness. Default missing factors to low or 0 so score is conservative.
- **Deal score:** `DealScoreInputs` needs at least cap rate (or cash flow), DSCR, and data confidence. From property alone we can approximate: cap rate = (rent × 12) / list_price if both exist; DSCR and rest may require defaults or "insufficient data" and show band "Insufficient data to score" plus CTA to add more data later.

**Recommendation:** Prefer **confidence** for MVP (fewer inputs; property + rent + list_price can yield a simple completeness-based confidence). Add deal score when underwriting/simulation is wired to property detail.

---

## 6. UI components (reuse where possible)

- **List:** FlatList or ScrollView of cards/rows; pull-to-refresh; loading and error states.
- **Detail:** ScrollView with sections: Address, Details (price, rent, beds/baths/sqft), Score (confidence meter or deal score band + short explanation from existing `confidenceMeterCopy` / `dealScoreExplanations`). Use existing `src/lib` engines and copy; no new formulas.

---

## 7. Acceptance criteria

- [ ] Portfolio tab shows empty state when user has 0 properties; shows list when user has ≥1.
- [ ] Tapping a property opens detail screen with correct data.
- [ ] Detail shows at least one of: confidence score (with band) or deal score (with band) or "Score coming soon" / "Insufficient data."
- [ ] No new claim in App Store or in-app copy about "confidence score" or "deal score" until this is shipped.
- [ ] After implementation, feature_claims_gap_report.md and launch_copy_recommendations.md updated so copy can safely mention scores.

---

## 8. References

- `expo-app/src/lib/confidence` (evaluate, types, copy)
- `expo-app/src/lib/scoring` (score, dealScoreInputsFromSimulation, types, copy)
- `expo-app/src/services/importLimits.ts` (toPropertyRow, ensureDefaultPortfolio; property insert)
- `expo-app/src/hooks/useExecutePropertyImport.ts` (onSuccess returns propertyId; today no navigation to detail)
- release_blocker_report.md (§ Scoring and analysis, § Severity 3)
