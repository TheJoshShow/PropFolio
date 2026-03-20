# Portfolio List Implementation Report

**Purpose:** Audit and implementation of the portfolio experience: list backed by saved/imported properties and navigation to property detail.  
**Date:** 2026-03-18

---

## 1. Audit: Current Portfolio Data Source and Supabase

### 1.1 Tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| **portfolios** | One per user (default "My Portfolio") | id, user_id, name |
| **properties** | Saved properties per portfolio | id, portfolio_id, street_address, unit, city, state, postal_code, country_code, list_price, bedrooms, bathrooms, sqft, rent, data_source, fetched_at |
| **property_imports** | Import count per user (for free-tier limit) | user_id, property_id, source, etc. |

- **RLS:** Assumed that portfolios and properties are scoped by user (portfolio.user_id; properties via portfolio_id). Client reads portfolios where user_id = auth.uid() and properties where portfolio_id in user's portfolio(s).
- **Insert path:** `src/services/importLimits.ts` → `ensureDefaultPortfolio()` then insert into `properties` via `toPropertyRow()`. **Rent is persisted** (`rent: data.rent`) so list/detail can show it and analysis can run on day one. `data_source` is set from the import source.

### 1.2 Fetch Strategy

1. Get current user (Supabase auth.getUser()).
2. Get user's default portfolio: `from('portfolios').select('id').eq('user_id', userId).limit(1).maybeSingle()`.
3. Fetch properties: `from('properties').select('*').eq('portfolio_id', portfolioId).order('fetched_at', { ascending: false })`.
4. Map each row to list item; compute deal score and confidence client-side via `runPropertyDetailAnalysis()` (simulation → confidence → deal score).

### 1.3 Gaps
- **updated_at:** Not in toPropertyRow; Supabase may add `created_at`/`updated_at` automatically. Use `fetched_at` or `updated_at` if present for "Updated" time.
- **Images:** No image URL in schema; list/detail handle missing images (no thumbnail or placeholder).

---

## 2. Implementation Summary

- **Service:** `src/services/portfolio.ts` — `getPortfolioProperties(supabase, userId)` → raw property rows; `getDefaultPortfolioId(supabase, userId)`.
- **Hook:** `src/hooks/usePortfolioProperties.ts` — fetches list, returns `{ list, loading, error, refresh }`; list items include computed `displayedDealScore`, `confidenceScore`, `monthlyCashFlow`, `updatedAt` for display.
- **List:** Portfolio tab converted to stack: `app/(tabs)/portfolio/_layout.tsx` (Stack), `app/(tabs)/portfolio/index.tsx` (list with FlatList, pull-to-refresh, loading/empty/error), `app/(tabs)/portfolio/[id].tsx` (detail). Removed `app/(tabs)/portfolio.tsx`.
- **List item:** Address (street + unit), city/state, deal score badge, confidence badge, estimated rent ("—" or value if rent column added), monthly cash flow (from analysis or "—"), updated time (fetched_at).
- **States:** Loading (skeleton or spinner), empty (current empty-state copy + Add property), pull-to-refresh, offline error (message + retry), API error (message + retry), no images (placeholder or no thumbnail).
- **Navigation:** Tap row → `router.push({ pathname: '/(tabs)/portfolio/[id]', params: { id } })`.

---

## 3. Files Touched / Added

| File | Change |
|------|--------|
| docs/portfolio_list_implementation_report.md | This report |
| docs/portfolio_data_contract.md | Data contract (API row + list item type) |
| src/services/portfolio.ts | New: getDefaultPortfolioId, getPortfolioProperties |
| src/hooks/usePortfolioProperties.ts | New: usePortfolioProperties (list + loading/error/refresh) |
| app/(tabs)/portfolio.tsx | Removed (replaced by portfolio/index.tsx) |
| app/(tabs)/portfolio/_layout.tsx | New: Stack for list + detail |
| app/(tabs)/portfolio/index.tsx | New: List with FlatList, states, badges |
| app/(tabs)/portfolio/[id].tsx | New: Property detail screen (analysis + metrics) |

---

## 4. Dependencies

- Supabase client (getSupabase), Auth (session/userId).
- `runPropertyDetailAnalysis` (feature-level pipeline: simulation + existing engines) for list-item scores and detail screen.
- expo-router for navigation; React Native FlatList, RefreshControl, ActivityIndicator.
