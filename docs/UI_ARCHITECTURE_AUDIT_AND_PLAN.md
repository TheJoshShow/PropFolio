# PropFolio — UI parity audit & staged implementation plan

**Phase:** Architecture / screen audit only (no broad UI rewrites in this document’s authoring step).  
**Target:** Visual parity with design renders (Welcome, Auth modals, Portfolio, Import, Settings, Property analysis tabs).

---

## 1. File map (by flow)

### Navigation / routes

| Area | Files |
|------|--------|
| Root shell | `app/_layout.tsx` |
| Welcome / redirect hub | `app/index.tsx` |
| Auth stack | `app/(auth)/_layout.tsx`, `app/(auth)/sign-in.tsx`, `app/(auth)/create-account.tsx`, `app/(auth)/forgot-password.tsx`, `app/(auth)/reset-password.tsx`, `app/(auth)/verify-email-pending.tsx` |
| Main stack | `app/(main)/_layout.tsx`, `app/(main)/portfolio.tsx`, `app/(main)/property/[id].tsx`, `app/(main)/paywall.tsx`, `app/(main)/style-guide.tsx` |
| Settings stack | `app/(main)/settings/_layout.tsx`, `index.tsx`, `personal.tsx`, `security.tsx`, `notifications.tsx`, `subscription.tsx` |
| Import (modal) | `app/import-property.tsx` → `src/features/import/ImportPropertyScreen.tsx` |

### Auth — context & services

| Role | Files |
|------|--------|
| Context | `src/features/auth/AuthContext.tsx`, `src/features/auth/index.ts`, `src/features/auth/validation.ts` |
| API | `src/services/auth/authService.ts`, `src/services/auth/index.ts` |
| Supabase client | `src/services/supabase/client.ts` |

### Portfolio

| Role | Files |
|------|--------|
| Screen | `app/(main)/portfolio.tsx` |
| Data | `src/features/portfolio/useProperties.ts`, `src/features/portfolio/buildPortfolioView.ts`, `src/features/portfolio/index.ts` |
| Presentation | `src/components/ui/PortfolioSummaryHero.tsx`, `PortfolioPropertyCard.tsx`, `PortfolioHeroSkeleton.tsx`, `PortfolioListSkeleton.tsx`, `FloatingActionButton.tsx` |
| Scoring used for list | `src/services/scoring/scoringEngine.ts`, `fromPropertySnapshot.ts` |

### Import

| Role | Files |
|------|--------|
| UI | `src/features/import/ImportPropertyScreen.tsx`, `src/features/import/index.ts` |
| Client API | `src/services/property-import/propertyImportService.ts`, `types.ts`, `index.ts` |
| Invoke / sanitize | `src/services/import/edgeInvoke.ts`, `sanitize.ts` |
| Gates | `src/features/subscription/useImportGate.ts`, `SubscriptionContext.tsx` |
| Edge (server) | `supabase/functions/import-property/*`, `places-*` |

### Settings

| Role | Files |
|------|--------|
| Screens | `app/(main)/settings/*.tsx` |
| UI primitives | `src/components/ui/SettingsRow.tsx`, `SectionHeader.tsx`, `Card.tsx`, `Screen.tsx` |
| Legal | `src/lib/openLegalDocument.ts`, `src/config/legalSupport.ts` |

### Property detail / analysis

| Role | Files |
|------|--------|
| Route shell | `app/(main)/property/[id].tsx` |
| Main view | `src/features/property/detail/PropertyDetailView.tsx` |
| Editor | `src/features/property/detail/AssumptionsEditorModal.tsx` |
| Formatting | `src/features/property/detail/formatCalculatedMetric.ts` |
| Hooks | `src/features/property/usePropertyDetail.ts`, `usePropertyDetailScoring.ts` |
| Local persistence | `src/features/property/propertyDetailScenarioStorage.ts` |
| Metric tiles | `src/components/ui/DetailMetricCard.tsx` |
| Market placeholders | `src/services/market-data/marketDataAdapters.ts` |

### Theme / design tokens

| Files |
|-------|
| `src/theme/index.ts`, `tokens.ts`, `shadows.ts` |

### Data models — property

| Layer | Files |
|-------|--------|
| Client types | `src/types/property.ts` (`PropertyRow`, `PropertySnapshotV1`) |
| DB | `supabase/migrations/002_properties_and_import_logs.sql` (+ `003` snapshots/scenarios) |
| Scoring domain | `src/scoring/domain/types.ts`, `normalize/fromSnapshot.ts`, `calculate/*`, `engine/computeFullScore.ts` |

### Contexts / hooks touching these screens

| Name | Files |
|------|--------|
| Auth | `AuthContext.tsx` |
| Subscription / paywall | `SubscriptionContext.tsx`, `usePremiumGate.ts`, `useImportGate.ts` |
| RevenueCat stub | `src/services/revenuecat/revenueCatService.ts` |

---

## 2. Architecture issues (honest assessment)

### Duplication / overlap

- **Portfolio card vs style guide:** `PortfolioPropertyCard` is the real list row; `PropertySummaryCard` exists mainly for `style-guide.tsx` — similar job, different layout (risk of drift).
- **Metric presentation:** `DetailMetricCard` vs `MetricCard` — detail uses `DetailMetricCard`; style guide uses `MetricCard`; no shared “icon + label + value row” primitive like the mocks.
- **Tabs:** `TabPill` / `TabPillRow` used on Import and Property detail — OK, but **segmented-control visual in mocks** (navy selected pill) differs from current pill style; likely one component with variants vs new component.
- **Settings rows:** `SettingsRow` is reused; mocks show more iOS-native grouped table — may need layout variant (value column, chevron-only rows).

### Dead / low-use

- **`SafeAreaWrapper`** was removed in a prior pass; no action.
- **`style-guide.tsx`** is dev-only; keep or gate behind `__DEV__` to avoid shipping confusion.

### Brittle patterns

- **Large inline `StyleSheet` blocks** per screen (`PropertyDetailView`, `portfolio`, settings) — hard to align with a single “modal card” or “settings group” system without extracting layout components.
- **Header configuration** split between stack `screenOptions` and `useLayoutEffect` (portfolio, property detail) — works but easy to mismatch title/large-title behavior vs design.
- **Import flow** is **tabs + text fields**, not the mock’s **two large destination cards** (Zillow vs manual) — product/navigation change, not just CSS.

### Hardcoded / placeholder data

- **Market tab:** `COMPARABLES_PLACEHOLDER`, `MARKET_TREND_PLACEHOLDER` — intentional until APIs exist.
- **Copy** scattered in screens (import subtitle mentions Zillow/Redfin + server enrichment — differs from mock copy; align with product/legal).
- **Portfolio header title** is `PropFolio` in `useLayoutEffect`; mock shows **“My Portfolio”** as page title — simple string / layout change later.

### Spacing / tokens

- **Single token source** (`src/theme/tokens.ts`) is good; screens still mix **raw gaps** with tokens in a few places — audit during refactor to use `spacing.*` and shared layout constants (e.g. `modalPadding`, `cardRadius`).

### Strategy-specific logic

- **No first-class `investmentStrategy`** (`buy_hold` | `fix_flip` | …) in `PropertySnapshotV1`, `PropertyRow`, or `NormalizedPropertyInputs`.
- **Engine** computes a **single buy-hold-style metric set** (`cap_rate`, `cash_on_cash`, `noi_annual`, `arv`, `dscr`, etc.) — there is **no** separate MAO, fix-and-flip ROI, DOM, LTV/LTC block as in mocks.
- **Renovation tab** today: rehab budget + ARV + stress buttons + narrative factor — **not** line-item renovation ledger (roof, HVAC, …) from mocks.
- **`scenarios` DB table** exists (migration `003`) but **client still uses AsyncStorage** (`propertyDetailScenarioStorage.ts`) — server scenarios not wired; risk of duplicate sources of truth later.

### Missing reusable components (for mock parity)

- **Auth modal shell:** centered card, X close, divider under title (auth screens are full-screen stack pages today, not modal cards).
- **Welcome:** custom house mark vs glyph — may need SVG/asset.
- **Import hub:** two large selectable rows with leading brand icon + chevron.
- **Property “info” table:** rows with icon, label, value (mock) vs current hero + metric grid.
- **Segmented control** (navy selected) for Financials / Market / Renovation.
- **Expandable “more metrics”** accordion (mock) vs always-visible grids/lists.
- **Renovation line items** with expand/collapse and category icons.

---

## 3. Current data shape vs mock requirements

### Stored today

**`properties` row (`PropertyRow`):** `id`, `user_id`, `source_type`, `source_url`, `raw_input`, `status`, `missing_fields`, **`snapshot` (JSON)**, geocode fields, `confidence_score`, timestamps.

**`PropertySnapshotV1` (in `snapshot` jsonb):**

| Mock field | Supported today? | Notes |
|------------|------------------|--------|
| `fullAddress` | **Partial** | `formatted_address` on row + `snapshot.address.formatted` / line1, city, state, zip |
| `propertyType` | **Partial** | `snapshot.structure.propertyType` (string \| null) |
| `numberOfUnits` | **Partial** | Normalized `unitCount` exists in **scoring domain**; snapshot normalize currently sets **`unitCount: 1`** unless user overrides in assumptions — **not** reliably from import |
| `squareFootage` | **Partial** | `snapshot.structure.sqft` |
| `estimatedTotalRent` | **Yes** | `snapshot.financials.rentEstimateMonthly` → `monthlyRentGross` |
| `purchasePrice` | **Partial** | Mapped from `lastSalePrice` in normalize — not always “list/purchase” |
| `estimatedMortgage` | **Computed, not stored** | Derived from LTV / rate / amortization in financing helpers when assumptions allow — not a persisted snapshot field |
| `investmentStrategy` | **No** | Must be added (snapshot extension + UI state) or stored in `scenarios`/profile |
| Buy & hold metrics (NOI, cap, CoC, cash flow, etc.) | **Partial** | Engine produces related metrics; labels/layout differ from mock; cash flow coloring is possible |
| Fix & flip metrics (ARV as flip context, MAO, ROI, DOM, LTV, LTC) | **No / partial** | ARV exists in engine; **MAO, flip ROI, DOM, LTC** not modeled as first-class metrics |
| Renovation breakdown | **No** | Only aggregate `rehabBudget` + stress; no category lines |
| Market data | **Placeholder only** | No live comps/trends in schema |

### Safest way to extend without breaking rows

1. **Prefer snapshot JSON evolution** over new top-level DB columns for display-only / provider fields: e.g. add optional `snapshot.analysisContext: { strategy: 'buy_hold' \| 'fix_flip', renovationLineItems?: [...] }` with **backward-compatible** defaults (omit = behave as today).
2. **Version bump:** either bump `PropertySnapshotV1.version` to `'2'` with migration path in Edge + client normalizer, **or** nest under `snapshot.extensions` so v1 parsers ignore unknown keys.
3. **Do not require DB migration for strategy-only UI** until you want sync across devices — could start with **local state** + optional later sync to `scenarios.patch` or `properties.snapshot` merge.
4. **Fix & flip math:** add **new pure functions** + metric keys in `src/scoring` with tests; keep existing buy-hold path as default when strategy missing.

---

## 4. Staged implementation plan

### Stage A — Design system refactor

- Define tokens for **modal card** (radius, shadow, padding), **segmented control**, **list row** (icon + label + value), **primary/secondary buttons** to match renders (navy text, gold CTA, white fields).
- Add variants to existing components (`AppButton`, `AppTextField`, `Card`, `TabPill` or new `SegmentedControl`) rather than one-off screens.
- Document in `style-guide` or Storybook-style screen.

### Stage B — Auth UI (Welcome + Sign In + Create Account)

- **Welcome:** layout to match render (house icon asset, typography, bottom-fixed buttons, optional subtle shadow on buttons).
- **Auth:** either present auth routes as **modal** (`presentation: 'modal'`) with shared `AuthModalLayout` (title, X, divider) or restyle full-screen to **look** like modal — product decision.
- Wire **icons in fields** via existing `AppTextField` `leftAccessory` (Ionicons).
- Password **eye toggle** — replace text “Show/Hide” with icon to match mock if desired.

### Stage C — Portfolio + Import

- **Portfolio:** add **“My Portfolio”** section title; align card layout to mock (rent prominent, value secondary, bottom row with tier + metric); consider extracting `PortfolioPropertyCard` internals to subcomponents.
- **Header:** simplify icons if mock uses plain `+` (already close).
- **Import:** replace tab UX with **two option cards** + navigation into existing link vs address flows (keep same services); **do not** claim “Zillow API” unless legally/technically true — use approved copy.
- **Cancel** styling to match bordered secondary button.

### Stage D — Strategy-aware analysis

- Introduce **`InvestmentStrategy`** type and **UI state** (persist in snapshot extension or local + later sync).
- **Buy & hold:** map existing `ScoreBreakdown.primaryMetrics` into mock sections; add **accordion** for secondary metrics (GRM, DSCR, etc. — some keys exist as `gross_rent_multiplier_hint`, `dscr`).
- **Fix & flip:** implement metric calculators **in scoring layer** (tests required) then surface in UI when strategy = fix_flip.
- **Property info card:** build `PropertyFactRow` list from `PropertyRow` + snapshot + normalized merged inputs.

### Stage E — Renovation tab (both strategies)

- **Phase 1:** keep aggregate rehab + optional simple line items in **local/scenario JSON** only.
- **Phase 2:** optional sync to `scenarios` table or snapshot extension.
- UI: accordion list; totals roll up to `rehabBudget` for engine.

### Stage F — Settings

- Align with mock: **Back + Settings title + Done** (or rely on stack header only — iOS pattern).
- Group cards + **Preferences** rows with **value** column (Currency, Theme) — may be static “USD” / “Light” until features exist.
- Add **Help center** / **Contact support** rows if product wants parity (mailto already partially there).

### Stage G — QA / polish

- Keyboards, safe areas, long addresses, empty portfolio, error states, VoiceOver labels.
- Visual diff against saved PNG renders in `assets/`.

---

## 5. Risks

| Risk | Mitigation |
|------|------------|
| Strategy + flip metrics change **confidence scoring** semantics | Keep score engine strategy-aware or scope flip UI to “analysis only” until scoring spec updated |
| Snapshot schema drift (Edge vs app) | Single shared type + contract tests or JSON schema |
| Duplicate persistence (AsyncStorage vs `scenarios` table) | Plan migration path; one write path |
| Import copy / “Zillow API” claims | Legal + engineering review |
| Large `PropertyDetailView` refactor regressions | Split into section components + snapshot tests for metric keys |

---

## 6. Recommended order of execution

1. **Types + scoring plan** for strategy and flip metrics (no UI yet, or feature-flagged).
2. **Design tokens + shared layout components** (modal shell, segmented control, fact row).
3. **Welcome + Auth** (isolated screens).
4. **Portfolio + Import** (user-facing funnel).
5. **Property detail** restructure (info card + tabs + strategy switch).
6. **Renovation line items** + rollup.
7. **Settings** polish.
8. **QA pass** against renders.

---

## 7. Schema / type changes before heavy UI?

**Recommended before building strategy-specific analysis UI:**

- Decide **`investmentStrategy`** storage (snapshot v2 / `extensions` / scenario patch).
- List **fix & flip metric definitions** (formulas) and add **`PrimaryMetricKey` (or parallel `FlipMetricKey`)** + tests in `src/scoring`.

**Can wait until after first UI pass:**

- DB sync for scenarios (if AsyncStorage is acceptable short-term).
- Renovation line-item persistence (start in memory + local JSON).

**Not required for Welcome/Auth/Portfolio shell refresh:**

- No DB migration mandatory if only visual/layout changes.

---

*Generated as architecture-audit phase; implement UI changes in follow-on tasks per stages above.*
