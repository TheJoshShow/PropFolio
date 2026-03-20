# Property Detail — Edge Case Report

Summary of edge cases, null-safety, and fixes applied so the scoring experience does not crash and renders consistently.

## 1. Null/undefined and guards

### 1.1 analysisResult or propertyRow null after load

**Risk:** Main content does `const a = analysisResult!` and `const row = propertyRow!`. If either is null (e.g. session expired, or fetch cleared one but not the other), the app can throw.

**Fix:** Before rendering main detail, require both `analysisResult` and `propertyRow`. If `!loading` and either is null, show error state (e.g. "Unable to load property" or "Please sign in to view this property") with Back, instead of rendering the success path.

### 1.2 Session expired while loading

**Risk:** When `userId` is null (e.g. session expired), `fetchProperty` returns early without setting `error`. Then `loading` is false, `error` is null, `analysisResult` and `propertyRow` are null. The condition `if (error && !analysisResult)` is false, so we fall through to `const a = analysisResult!` and crash.

**Fix:** Treat "no userId but id present" as an error: when `!userId && id`, set a user-facing error (e.g. "Please sign in to view this property") and show the error UI. Alternatively, guard the success path with `if (!analysisResult || !propertyRow) { return <ErrorOrRedirect />; }`.

### 1.3 explanationCopy and metrics

**Risk:** If `explanationCopy` or `explanationCopy.dealSummary` were ever missing, hero or deal summary could show "undefined".

**Fix:** buildPropertyDetailAnalysis always returns `explanationCopy` with `dealSummary` and `confidenceSummary` (or INSUFFICIENT_DATA_REASON for insufficientData). UI uses `a.explanationCopy.dealSummary` without optional chaining; safe as long as pipeline never returns partial explanationCopy. For extra safety, UI can use `a.explanationCopy?.dealSummary ?? 'Insufficient data'`.

**Cap note:** Only render when `a.wasCappedByConfidence && a.explanationCopy.capApplied`; capApplied is only set when cap is applied, so no undefined.

### 1.4 metricsSummary and format helpers

**Risk:** `m.dscr.toFixed(2)` or `formatCurrency(m.monthlyCashFlow)` when values are null.

**Fix:** formatCurrency and formatPercent already return "—" for null. DSCR cell uses `m.dscr != null ? \`${m.dscr.toFixed(2)}×\` : '—'`. So no .toFixed on null if this pattern is used everywhere. Verify all metric cells handle null.

### 1.5 strengths, risks, assumptions

**Risk:** Iterating over undefined or null.

**Fix:** UI uses `a.strengths`, `a.risks`, `a.assumptions` only in conditional render (`length > 0`) and `.map()`. Pipeline always returns arrays (possibly empty). Safe.

## 2. Score labels and disclaimers

### 2.1 Deal and confidence band labels

**Risk:** Unknown band value could make dealBandLabel/confidenceBandLabel return undefined (if switch had no default).

**Fix:** propertyAnalysisCopy.ts dealBandLabel and confidenceBandLabel have `default` cases returning 'Insufficient data' and 'Very low' respectively. So all band values render a string.

### 2.2 Displayed score

**Risk:** displayedDealScore null shown as number or "NaN".

**Fix:** UI uses `a.displayedDealScore != null ? Math.round(a.displayedDealScore) : '—'` in badge and score card. Consistent.

### 2.3 Disclaimer

**Fix:** SCORE_DISCLAIMER constant is always rendered below the two score cards. Single source of truth.

## 3. Data fetch edge cases

### 3.1 getPropertyById returns null

**Scenario:** Deleted property or not in user's portfolio.

**Current behavior:** fetchProperty sets `setPropertyRow(row)` only when row is truthy; when null, we set `setError('Property not found')` (or keep previous error). So we need to ensure when row is null we set error. Check: in fetchProperty, when row is null we do setError('Property not found'). So error is set, analysisResult stays null, and we show error UI. Good.

### 3.2 Network failure

**Scenario:** Supabase or network fails.

**Current behavior:** getPropertyById will throw or return null; catch block sets setError(e.message). So error UI shown. No crash if we don’t render main content when analysisResult is null.

### 3.3 Stale property

**Scenario:** Row returned with old data.

**Current behavior:** We build analysis from row and render. No special "stale" state; "Last updated" shows row.updated_at or fetched_at. No crash.

## 4. Test coverage (unit)

- **buildPropertyDetailAnalysis:** Covers missing rent, missing price, zero price, NaN/Infinity, negative cash flow, low-confidence cap, high confidence no cap, clamping 0–100, factorExplanations and explanationCopy, insufficientData.
- **Extend tests:** Sparse property (only price + rent, no taxes/expenses); outlier values (very high rent, very low DSCR); confidence band boundaries; deal band boundaries.

## 5. Fixes applied

- **Session expired:** When `!userId` and `id` is present, set error to "Please sign in to view this property" and show error UI; no longer fall through to success path.
- **Null guard:** Before rendering main content, require both `analysisResult` and `propertyRow`. If either is null after load, show error card with Back.
- **Copy fallbacks:** UI uses `a.explanationCopy?.dealSummary ?? 'Insufficient data'` and `a.explanationCopy?.capApplied`; factor breakdown uses `a.explanationCopy?.factorExplanations?.[factorId]` so missing keys do not throw.
- **Unit tests:** buildPropertyDetailAnalysis tests extended for sparse property, outliers, low-confidence cap, score/band consistency; propertyAnalysisCopy tests ensure all band labels and descriptions return non-empty strings.

## 6. Checklist summary

| Area | Status |
|------|--------|
| Guard when analysisResult or propertyRow null | Done: show error UI when either null |
| Session expired while loading | Done: set error when !userId and id; show error UI |
| explanationCopy / dealSummary | Done: optional chaining + fallback in UI |
| metricsSummary null fields | formatCurrency/formatPercent and dscr cell handle null |
| Band labels | Defaults in dealBandLabel and confidenceBandLabel; unit tested |
| Disclaimer | Always rendered; single constant |
| Deleted property | getPropertyById null → setError → error UI |
| Offline | Error in catch → setError → error UI |
