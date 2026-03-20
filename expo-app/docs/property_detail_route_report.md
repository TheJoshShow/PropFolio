# Property Detail — Route Report

**Purpose:** Document the dedicated property detail route, data flow, and technical choices.  
**Date:** 2026-03-18

---

## 1. Route

| Item | Value |
|------|--------|
| **Path** | `/(tabs)/portfolio/[id]` |
| **File** | `app/(tabs)/portfolio/[id].tsx` |
| **Entry** | Tap on a property row in Portfolio list → `router.push({ pathname: '/(tabs)/portfolio/[id]', params: { id } })` |
| **Stack** | Portfolio tab uses `app/(tabs)/portfolio/_layout.tsx` (Stack); list = index, detail = [id]. |

---

## 2. Data flow

1. **Params:** `useLocalSearchParams<{ id: string }>()` → `id` (property uuid).
2. **Auth:** `useAuth()` → `session?.user?.id` (required to fetch; redirect handled by tabs layout).
3. **Fetch:** `getPropertyById(supabase, userId, id)` → single property row (or null).
4. **Analysis:** From row, build `PropertyDetailAnalysisInput` (listPrice, rent, address, optional overrides) → `runPropertyDetailAnalysis(input)` → `PropertyDetailAnalysisResult` (deal score breakdown, confidence explanation/actions, key metrics, flags, assumptions).
5. **Display:** One-way; no user edits on this screen. All copy and values from analysis + row.

---

## 3. Memoization and recompute

- **Analysis:** Computed once when the property row is set (after successful fetch). Stored in state (`analysisResult`). Not recomputed on theme or re-render unless row/id changes.
- **Derived display values:** Formatting (currency, percent, date) is pure; can be done in render or with small useMemo for lists (e.g. top 3 strengths/risks) to avoid unnecessary array slices.
- **Avoid recompute:** Do not call `buildPropertyDetailAnalysis` inside render; only in fetch callback when we have the row.

---

## 4. Loading and error

| State | UI |
|-------|-----|
| **Loading (no data yet)** | Skeleton: hero placeholder, two score card placeholders, metrics grid placeholder; no spinner required but can add subtle indicator. |
| **Error (fetch failed or not found)** | Full-screen fallback: title "Unable to load property", message, Back button. |
| **Success** | Full content: hero, score section, metrics grid, strengths, risks, assumptions, footer. |

---

## 5. Graceful fallback

- **Missing metric:** Show "—" (em dash); do not show "null" or "undefined".
- **Insufficient data (no score):** displayedDealScore = null; show "—" in score card; show dealBand label "Insufficient data" and short explanation from copy.
- **Empty strengths/risks:** Section hidden or "None identified" (per product preference).
- **Empty assumptions:** Section hidden or "Using default inputs only."

---

## 6. Dependencies

- **Services:** `getSupabase`, `getPropertyById` (portfolio.ts).
- **Analysis:** `runPropertyDetailAnalysis` (`src/features/property-analysis`) + score disclaimers from `src/lib/propertyAnalysis/propertyAnalysisCopy.ts`.
- **UI:** SafeAreaView, ScrollView, theme (spacing, fontSizes, lineHeights, colors), Card, Button.
