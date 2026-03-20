# PropFolio — Cross-Platform Migration Audit (Phase 1)

**Date:** As of audit  
**Scope:** Full codebase inspection to support migration to a single codebase (iOS + Android + Web).  
**Objective:** Determine current framework, reusable vs rewrite-required components, blockers, and recommended target architecture.

---

## 1. Current framework summary

| Aspect | Finding |
|--------|---------|
| **Primary UI** | **SwiftUI only** (no UIKit UI; one file uses `UIKit` for keyboard dismiss only) |
| **Language** | Swift 5.x |
| **Entry point** | `PropFolioApp.swift` — `@main`, `WindowGroup`, auth gate then `RootTabView` |
| **Platform** | **iOS-only** (macOS/Android/Web not targeted) |
| **Existing “web”** | Separate **Vite + React + TypeScript** app — was in `/web`, now in **`_archive_review/web`** (archived). **Not** shared codebase; duplicate screens and demo data. Current web is expo-app (RN Web). |

**Verdict:** The app is **iOS-native SwiftUI** with a **separate React web shell**. There is no shared core; business logic lives entirely in Swift.

---

## 2. Routing and navigation

| Area | Implementation |
|------|----------------|
| **Root** | `TabView` with 4 tabs: Home, Import, Portfolio, Settings. Selection in `@State`; `NotificationCenter` used to switch to Import tab from Home CTA. |
| **Stacks** | `NavigationStack` per tab (e.g. `HomeScreen` → `HomeDashboardScreen`; `ImportScreen` → `PropertyImportFlowView` with internal phase state). |
| **Modal / sheet** | `fullScreenCover` for What-If simulator; `.sheet` for Renovation planner, Save scenario, etc. |
| **Deep links** | None implemented. |
| **Web (current)** | Client-side only: tab state in React `useState`; no URL routing (no React Router). |

**Reusable:** Tab set and screen list are well-defined. Logic is view-state driven (phases, selected deal).  
**Rewrite:** Navigation must be re-expressed in the target stack (e.g. Expo Router file-based or React Navigation).

---

## 3. State management

| Area | Implementation |
|------|----------------|
| **Auth** | `AuthViewModel` (ObservableObject): session, `shouldShowLogin`, `signIn`/`signUp`/`signOut`. Uses Supabase auth; observes `authStateChanges`. |
| **Tabs / demo** | `@AppStorage("useDemoData")`; `selectedTab` in `RootTabView`; `UserDefaults` for demo default in DEBUG. |
| **Import flow** | `ImportFlowViewModel`: phase (start, linkInput, addressInput, importing, result, error, editing), linkInput string, owns `AddressAutocompleteViewModel`. |
| **Simulation (What-If)** | `SimulationViewModel`: holds `SimulationInputs`, `SimulationResult`, `ScenarioManager`; recomputes via `SimulationEngine.run(inputs)`. |
| **Portfolio** | Data passed down: `DemoData.dealsForPortfolio()` or `PortfolioMockData.sampleDeals`; selected deal drives Analysis/What-If (state in parent or fullScreenCover). |
| **Analysis dashboard** | Receives `AnalysisDashboardState` (precomputed); no local heavy state. |

**Reusable:** State *shape* and flows (auth, import phases, simulation inputs/outputs, portfolio list) are clear and can be reimplemented in TypeScript/React (e.g. context + hooks or Zustand).  
**Rewrite:** All state management must be reimplemented in the new stack; no direct reuse of Swift types.

---

## 4. Networking

| Area | Implementation |
|------|----------------|
| **Supabase** | `SupabaseClientManager` (Swift); `SupabaseAuthProviding` for sign-in/up/out and session. Client uses anon key only. |
| **Property data** | `PropertyDataService`: async `importProperty(from:)`, `suggestAddresses`. Uses adapters (Zillow, Redfin, mock); `URLSession`-based where implemented. |
| **Market context** | `BackendMarketContextAdapter`: optional backend URL, `URLSession`, cache. |
| **Usage events** | `UsageTrackingService`: sends to Supabase when signed in; no-op otherwise. |

**Reusable:** Supabase is already used from the **web** app (`@supabase/supabase-js`). Auth and DB patterns can be shared. Adapter *interfaces* (parse → fetch → normalize) should be recreated in TypeScript; implementations will be new (fetch/axios).  
**Rewrite:** All Swift networking (Supabase Swift SDK, URLSession, adapters) replaced by JS/TS equivalents (Supabase JS, fetch, or axios).

---

## 5. API integrations

| Integration | iOS (current) | Web (current) | Cross-platform note |
|-------------|---------------|---------------|---------------------|
| **Supabase** | Swift SDK (auth + DB) | supabase-js | Same backend; client lib differs by platform. |
| **Zillow** | `ZillowAdapter` (stub/key-based) | None | Prefer backend proxy; single API surface. |
| **Redfin** | `RedfinAdapter` (proxy flag) | None | Same. |
| **Address autocomplete** | `AddressAutocompleteProvider` (mock + Google Places key) | None | Use Google Places or backend in shared layer. |
| **RentCast** | `RentCastAdapter` (scaffold) | None | Optional; backend or direct key in shared code. |
| **ATTOM** | `ATTOMAdapter` (scaffold) | None | Same. |
| **Market context** | `BackendMarketContextAdapter` (URL + cache) | None | Backend URL; shared logic. |
| **RevenueCat / Stripe** | Not present | Not present | To be added; RevenueCat for mobile, Stripe (or abstraction) for web. |

**Reusable:** API *contracts* (what we send/expect) and caching/retry strategy can be mirrored.  
**Rewrite:** All client calls reimplemented in TypeScript; recommend backend proxy for any paid or sensitive keys.

---

## 6. Calculation engine (critical)

| Component | Location | Dependencies | Tests |
|-----------|----------|--------------|-------|
| **UnderwritingEngine** | `Engine/Underwriting/` | Foundation only | `UnderwritingEngineTests` |
| **DealScoringEngine** | `Engine/Scoring/` | Foundation only | `DealScoringEngineTests` |
| **ConfidenceMeterEngine** | `Engine/ConfidenceMeter/` | Foundation only | `ConfidenceMeterEngineTests` |
| **SimulationEngine** | `Engine/Simulation/` | Underwriting + models | `SimulationEngineTests` |
| **ScenarioManager** | `Engine/Simulation/` | Foundation only | `ScenarioManagerTests` |
| **Renovation (totals, templates)** | `Engine/Renovation/` | Foundation only | `RenovationPlanTests` |
| **Amortization** | Underwriting/Calculators | Foundation only | Via Underwriting tests |
| **Income/Debt/Return/Unit calcs** | Underwriting/Calculators | Foundation only | Via Underwriting tests |

All engines use **Foundation only** (no SwiftUI/UIKit). Input/output types are structs/enums (Decimal, optional values). Logic is **deterministic** and fully unit-tested.

**Reusable:** **Algorithms and formulas are 100% portable.** They must be **reimplemented in TypeScript** and kept in a **shared** package (or `/src/lib` / `/packages/core`) so iOS, Android, and Web all call the same functions. No duplicate formula logic across platforms.

**Rewrite:** New TypeScript modules that mirror the Swift engines; Swift remains the source of truth until migration is validated (then Swift can be deprecated or kept for iOS-only fallback during transition).

---

## 7. Auth flow

| Step | Implementation |
|------|----------------|
| **Config** | `AppConfiguration.isSupabaseConfigured` (URL + anon key). If not set, app skips login. |
| **Gate** | `AuthViewModel.shouldShowLogin` → show `LoginScreen` else `RootTabView`. |
| **Login screen** | Email + password, Sign in / Create account mode, error banner, `SupabaseAuthProviding.signIn` / `signUp`. |
| **Session** | Observed via `authStateChanges`; `currentSession` on init and after events. |
| **Sign out** | Settings → Sign out; `signOut()`; session clears → login shown again. |
| **Apple Sign In** | Placeholder in `SupabaseAuthProviding`; not wired in UI. |

**Reusable:** Flow and UX (email/password, optional Apple) map directly to Supabase JS auth on web and React Native (Expo) with Supabase.  
**Rewrite:** Login UI and auth state in React/RN; same Supabase project and RLS.

---

## 8. UI structure

| Layer | Content |
|-------|---------|
| **Design system** | `AppTheme` (light/dark), `AppTypography`, `AppSpacing`, `AppRadius`, `Colors`, `Shadows`. Semantic tokens (primary, surface, textPrimary, etc.). |
| **Components** | Buttons (`PrimaryButton`, `SecondaryButton`), `AppCard`, `AppTextField`, `MetricChip`, `ConfidenceMeterTeaserView`, `HeadlineMetricCard`, `FutureValueSummaryView`, `CalloutCardView`, `EmptyStateView`, etc. |
| **Screens** | Home (`HomeDashboardScreen`), Import (`PropertyImportFlowView`, `AddPropertyStartView`, `LinkInputView`, `AddressInputView`, `PropertyImportResultView`, `EditImportedPropertyView`), Portfolio (`PortfolioScreen`, `PortfolioDealCard`), Analysis (`AnalysisDashboardScreen`), What-If (`WhatIfSimulatorScreen`), Renovation (`RenovationPlannerScreen`), Settings (`SettingsScreen`), Auth (`LoginScreen`). |
| **UIKit usage** | **Only** in `EditImportedPropertyView`: `#if canImport(UIKit)` + `UIApplication.shared.sendAction(resignFirstResponder)` to dismiss keyboard. Trivial to replace. |

**Reusable:** Design tokens (scale, colors, spacing) and component *concepts* (cards, chips, metric tiles, empty state).  
**Rewrite:** All views reimplemented in React/React Native using a shared design system (e.g. theme + styled components or Tamagui/NativeWind). No SwiftUI code can be reused.

---

## 9. Reusable logic (non-UI)

| Category | Swift location | Portable? | Action |
|----------|----------------|-----------|--------|
| **Underwriting formulas** | `Engine/Underwriting/` + Calculators | Yes | Reimplement in TypeScript; centralize in shared lib. |
| **Deal scoring** | `Engine/Scoring/` | Yes | Same. |
| **Confidence meter** | `Engine/ConfidenceMeter/` | Yes | Same. |
| **Simulation (what-if)** | `Engine/Simulation/` | Yes | Same. |
| **Renovation totals/templates** | `Engine/Renovation/` | Yes | Same. |
| **URL parsing (Zillow/Redfin)** | `Services/PropertyData/Parsers/` | Yes | Reimplement in TS; same rules. |
| **Address parsing** | `AddressInputParser` | Yes | Same. |
| **Property normalizer** | `PropertyNormalizer` | Yes | Same (input/output types in TS). |
| **Cache/retry/throttle** | `PropertyImportCache`, `RetryPolicy`, `RequestCoordinator` | Concept only | Reimplement in TS where needed. |
| **Future value copy** | `FutureValueInsightCopy`, `MarketContextProvider` | Yes | Copy rules and adapter contract to TS. |
| **Usage event schema** | `UsageEventSchema` | Yes | Same event types in TS. |

---

## 10. iOS-specific dependencies

| Dependency | Purpose | Cross-platform replacement |
|------------|---------|----------------------------|
| **SwiftUI** | All UI | React Native + React Native Web (or Flutter if chosen). |
| **Combine** | Used in RootTabView (NotificationCenter publisher) | Event emitter or React state/context. |
| **Foundation** | Decimal, Date, URL, Result, etc. | JS/TS: decimal.js or number, Date, URL, Result type. |
| **Supabase Swift SDK** | Auth + DB | Supabase JS (same backend). |
| **Bundle.main / ProcessInfo** | Config (env, Info.plist) | Env vars (e.g. Expo Constants, Vite import.meta.env). |
| **UserDefaults** | useDemoData, etc. | AsyncStorage (RN), localStorage (web). |
| **NotificationCenter** | switchToImportTab | In-memory event bus or React context. |
| **UIKit (minimal)** | Keyboard dismiss | RN: Keyboard.dismiss(); web: blur(). |
| **OSLog** | Structured logging | Same concept in TS (e.g. Sentry, console, or logger). |

No other platform-locked frameworks (e.g. StoreKit, Core Data) are used in the audited code. Subscriptions (RevenueCat) and crash reporting (Sentry) are to be added in the new stack.

---

## 11. Blockers to cross-platform support

| Blocker | Severity | Mitigation |
|---------|----------|------------|
| **Business logic in Swift only** | High | Extract to TypeScript shared package; reimplement formulas and parsers; keep single source of truth. |
| **No shared codebase** | High | New monorepo or app (e.g. Expo) with `/src` shared; iOS and Android from same bundle; web via RN Web or separate React app that imports shared lib. |
| **Separate web app** | Medium | Either migrate web to React Native Web or have web consume the same shared logic package and redesign screens to match. |
| **Native-only config** | Low | Replace Bundle/ProcessInfo with env (Expo, Vite); document in README. |
| **RevenueCat / Stripe not integrated** | Low | Add in new stack per preferred stack (RevenueCat mobile, Stripe or abstraction web). |

No architectural blocker prevents a React Native + Expo + shared TypeScript core; the main work is migration of logic and UI, not removal of impossible dependencies.

---

## 12. Migration risk report

| Risk | Level | Notes |
|------|-------|------|
| **Formula drift** | High | If TS and Swift both exist, they can diverge. Mitigation: Single source of truth in TS; comprehensive unit tests; deprecate Swift engines after parity. |
| **Regression in scoring/confidence** | High | Mitigation: Port exact specs (DEAL-SCORING-SPEC, etc.); replicate tests in Jest/Vitest; compare outputs for same inputs (Swift vs TS). |
| **Import/parser bugs** | Medium | Mitigation: Port parser tests; same test vectors in TS. |
| **UI/UX regression** | Medium | Mitigation: Design system first; component checklist; manual QA on all three platforms. |
| **Auth/session edge cases** | Medium | Mitigation: Use Supabase JS consistently; test sign-in, sign-out, token refresh on each platform. |
| **Performance (large lists, heavy recompute)** | Low–Medium | Mitigation: Reuse existing patterns (e.g. debounce What-If); profile on low-end devices. |

---

## 13. Reusable components list (conceptual)

These exist as SwiftUI views today; rebuild in React/RN with same behavior and design:

- **Layout:** Tab bar, navigation bar, scroll containers, cards, sections.
- **Forms:** Text input, secure input, labeled field, error message.
- **Buttons:** Primary, secondary, destructive; loading state.
- **Data display:** Metric chip, metric card, score hero, confidence ring/teaser, future value summary, callout card (risk/opportunity), empty state.
- **Lists:** Portfolio deal card, recent analysis row, scenario row.
- **Feedback:** Progress/loading, error banner, toast (if any).
- **Modals/sheets:** Renovation planner, save scenario, edit property.

---

## 14. Rewrite-required components list

- **All screens:** Rebuild in React/RN; no SwiftUI reuse.
- **All view models:** Reimplement as hooks + context or state store (Zustand/Redux).
- **App shell:** New entry (Expo Router or React Navigation); auth gate and tab layout.
- **Design system:** New theme and components in TS/JS (tokens + primitives).
- **Supabase client:** Already have JS client for web; use same for RN (Expo).
- **Property/import adapters:** New TS implementations (or backend-only calls); keep adapter abstraction.
- **RevenueCat / Stripe:** New integrations.

---

## 15. Recommended target architecture

**Recommended stack: React Native + Expo + TypeScript + shared core.**

| Choice | Reason |
|--------|--------|
| **React Native + Expo** | Single codebase for iOS and Android; Expo simplifies build and OTA; large ecosystem; team can leverage existing web (React) experience. |
| **TypeScript** | Strict typing for formulas and API contracts; shared types between app and any Node backend. |
| **Expo Router** | File-based routing; aligns with “app” and “features” structure; supports auth gate and tabs. |
| **React Native Web** | One codebase for web as well; same components and logic; responsive layout and desktop-friendly UX. |
| **Shared domain logic in TypeScript** | All underwriting, scoring, confidence, simulation, renovation, and parsers in a **shared package** or `/src/lib` (or `/packages/core`). No duplicate formulas. |
| **Supabase** | Already in use; same backend for auth and DB on all platforms. |
| **RevenueCat** | Standard for mobile subscriptions; Expo-compatible. |
| **Stripe** | For web subscriptions or hybrid; abstraction so paywall logic is shared. |
| **Sentry** | Cross-platform error/crash reporting. |
| **Modular feature-based structure** | `/src/features/{auth,onboarding,property-import,...}` plus shared `/src/lib`, `/src/components`, `/src/theme`. |

**Why not Flutter:**  
The current app is Swift + React (web). Flutter would require rewriting the entire UI and all state management in Dart; the existing React web app and any React familiarity would not transfer. React Native allows reuse of React patterns, TypeScript, and a path to share code with the current web app (or to fold web into RN Web). Formula and engine logic is framework-agnostic and will be reimplemented in TypeScript regardless; Flutter does not reduce that work and increases UI rewrite surface (Dart + new widget set).

**Why not “keep Swift and add Android/web separately”:**  
Two native codebases (Swift + Kotlin) plus web triples maintenance and doubles the risk of logic drift. A single TypeScript core with RN + RN Web keeps one formula set and one product surface.

---

## 16. Step-by-step migration plan (high level)

1. **Phase 2 — Target architecture**  
   Create Expo app with `/app`, `/src/features`, `/src/lib`, `/src/components`, `/src/theme`, etc. No business logic yet; placeholder screens and routing.

2. **Phase 3 — Extract shared business logic**  
   Implement in TypeScript: underwriting, scoring, confidence, simulation, renovation, URL/address parsers, property normalizer, and types. Add unit tests; optionally add snapshot tests vs Swift output.

3. **Phase 4 — Shared design system**  
   Theme (tokens), typography, spacing, colors, and core components (buttons, cards, inputs, chips, etc.) for RN and web.

4. **Phase 5 — Migrate navigation and screens**  
   Auth, onboarding, home, import (all phases), portfolio, analysis, what-if, renovation, settings, paywall. Use shared logic and design system; platform-specific only where necessary.

5. **Phase 6 — API and platform integration**  
   Supabase (auth + DB), address autocomplete (Google or backend), property/market adapters, Sentry, RevenueCat, Stripe (or billing abstraction).

6. **Phase 7 — Responsive web**  
   Layout rules, container widths, desktop nav, keyboard/focus, URL routing, no mobile-only assumptions.

7. **Phase 8 — Testing and validation**  
   Unit tests (formulas, parsers), integration tests (flows), smoke tests per platform, regression checklist.

8. **Phase 9 — Runnable dev setup**  
   Scripts: `npm run ios`, `android`, `web`, `test`, `lint`, `typecheck`. README with env vars and launch instructions.

9. **Phase 10 — Polish**  
   Consistency, performance, cleanup, validation, and trust/clarity in analysis screens.

10. **Decommission or keep Swift**  
    After parity and validation, either retire the Swift app or keep it as a legacy iOS build while new development happens in Expo.

---

## 17. Summary

- **Current:** iOS-only SwiftUI app with deterministic, well-tested engines (Foundation only); separate Vite+React web app; Supabase backend.
- **Reusable:** All calculation and parser logic (reimplemented in TypeScript); state and flow design; API contracts and caching strategy.
- **Rewrite:** All UI and view models; navigation; platform config and native integrations.
- **Recommended:** React Native + Expo + TypeScript + shared core; Expo Router; React Native Web; Supabase; RevenueCat + Stripe; Sentry; feature-based modular structure.
- **Blockers:** None that prevent the recommended path; main risks are formula drift and regression, mitigated by a single TS core and strong tests.

Phase 1 is complete. Next: **Phase 2 — Create the target architecture** (scaffold Expo app and folder structure).
