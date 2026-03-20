# PropFolio Delivery Roadmap

**Document owner:** PropFolio Program Director  
**Audience:** Beginner-friendly; optimized for use in Cursor  
**Last updated:** As of roadmap creation

---

## Product Intent (Summary)

- **Primary promise:** Help buyers feel confident they will make money on an investment property.
- **Core flows:** Import property data (Zillow/Redfin links or typed address) → Analyze with investor metrics → Run what-if scenarios in real time → See confidence meter and future value predictor → Track analyzed deals in a portfolio.

---

## 1. Recommended Repository File Tree

Use this structure from day one so phases drop into the right places. Create folders as you reach each phase; you don’t need every folder on day one.

```
PropFolio/
├── .cursor/
│   ├── agents/                    # Builder and reviewer agent definitions
│   │   ├── propfolio-program-director.md
│   │   ├── ios-frontend-builder.md
│   │   ├── backend-platform-builder.md
│   │   ├── property-data-builder.md
│   │   ├── underwriting-engine-builder.md
│   │   ├── market-intelligence-builder.md
│   │   ├── architecture-reviewer.md
│   │   ├── quant-reviewer.md
│   │   ├── ux-reviewer.md
│   │   └── qa-reviewer.md
│   └── rules/
│       └── propfolio-global.mdc
│
├── docs/                          # Planning and specs (this file lives here)
│   ├── PROPFOLIO-ROADMAP.md
│   └── phase-handoffs/             # Optional: copy handoffs here for reference
│
├── PropFolio/                     # Main iOS app target (Xcode project root)
│   ├── App/
│   │   └── PropFolioApp.swift
│   ├── ViewModels/               # Subfolders: Onboarding, Dashboard, PropertyImport, PropertyDetail, WhatIf, Portfolio
│   ├── Screens/
│   │   ├── Onboarding/
│   │   ├── Dashboard/
│   │   ├── PropertyImport/
│   │   ├── PropertyDetail/
│   │   ├── WhatIf/
│   │   └── Portfolio/
│   ├── Components/                # Reusable SwiftUI (buttons, cards, feedback)
│   ├── DesignSystem/             # Colors, typography, spacing
│   ├── Models/                    # Shared types only (domain-owned types in Engine/.../Models, Services/...)
│   ├── Engine/Underwriting/
│   │   ├── Models/                # UnderwritingInputs, Outputs, ConfidenceScore
│   │   └── ...                    # Calculators, confidence engine
│   ├── Services/
│   │   ├── PropertyData/Adapters/  # All third-party property API calls
│   │   ├── MarketIntelligence/Adapters/
│   │   └── Sync/                  # Auth, fetch property, portfolio (no keys in client)
│   ├── Supabase/                  # Client init and auth config only
│   ├── Extensions/
│   └── Resources/                 # Assets, Localizable.strings
│
├── PropFolioTests/
│   ├── Unit/
│   │   ├── Engine/                 # UnderwritingTests
│   │   └── Services/               # PropertyDataTests, MarketIntelligenceTests
│   └── Helpers/
│
├── supabase/                      # Backend (when you add it)
│   ├── migrations/
│   ├── functions/
│   └── config.toml
│
├── .gitignore
├── README.md
└── PropFolio.xcodeproj/           # Or Package.swift if SPM-only
```

**Beginner note:** Create the iOS project in Xcode first, then add these folders to the correct targets. Full tree and placement rules: docs/FILE-TREE.md.

---

## 2. Build Phases (Correct Order)

Phases are ordered so that each one has the dependencies it needs. Do not skip phases; get reviewer signoff before moving on.

---

### Phase 1: Project Scaffolding & Design System

| Field | Value |
|-------|--------|
| **Builder** | iOS Frontend Builder |
| **Depends on** | None |
| **Scope** | Small–Medium |
| **Reviewer** | Architecture Reviewer |

**Deliverables**

- [ ] Xcode project (or SPM package) with a single iOS app target.
- [ ] Minimum iOS version set (e.g. iOS 17); iPhone-only.
- [ ] Folder structure under `PropFolio/` matching the canonical file tree (App, Models, Engine, Services, Supabase, ViewModels, Screens, Components, DesignSystem, Extensions, Resources). See `docs/FILE-TREE.md`.
- [ ] `DesignSystem/`: `Colors.swift`, `Typography.swift`, `Spacing.swift` (tokens only; no screens yet).
- [ ] `App/PropFolioApp.swift` launches a simple placeholder root view (e.g. “PropFolio” text).
- [ ] README with how to open and run the app.

**Acceptance criteria**

- App builds and runs in Simulator (e.g. iPhone 15).
- No compiler warnings.
- All UI will eventually use DesignSystem tokens (document that intent in a short comment in DesignSystem).
- File and group names match the recommended tree.

**Risks / dependencies**

- Risk: Xcode and Cursor disagree on folder structure. Mitigation: Keep “groups” in Xcode in sync with folders on disk so Cursor and Xcode both see the same layout.

---

### Phase 2: Core Data Models & Underwriting Inputs/Outputs

| Field | Value |
|-------|--------|
| **Builder** | Underwriting Engine Builder + iOS Frontend Builder (models only) |
| **Depends on** | Phase 1 |
| **Scope** | Small |
| **Reviewer** | Architecture Reviewer |

**Deliverables**

- [ ] Shared models used across the app (no UI):
  - `UnderwritingInputs` (purchase price, rent, expenses, financing, etc.).
  - `UnderwritingOutputs` (NOI, cap rate, cash flow, DSCR, etc.).
  - `ConfidenceScore` / `ImportConfidence` (score, grade, signals).
- [ ] `NormalizedProperty` (or equivalent) with address, basic facts, and slots for tracked values (e.g. `TrackedValue<T>` with source/timestamp/confidence).
- [ ] Place under `Engine/Underwriting/Models/` and/or a shared `Models/` used by both Engine and Services.
- [ ] All money fields use `Decimal`; no `Float`/`Double` for currency.

**Acceptance criteria**

- Types compile and are usable from Swift (e.g. from a unit test or a tiny test view).
- No business logic in models (plain value types / DTOs).
- Document in a one-line comment where each model is used (e.g. “Used by UnderwritingEngine and PropertyDetailView”).

**Risks / dependencies**

- Dependency: These types will be extended in later phases; avoid over-building. Only add fields that v1 needs.

---

### Phase 3: Underwriting Engine (Formulas & Confidence)

| Field | Value |
|-------|--------|
| **Builder** | Underwriting Engine Builder |
| **Depends on** | Phase 2 |
| **Scope** | Medium |
| **Reviewer** | Quant Reviewer, then Architecture Reviewer |

**Deliverables**

- [ ] Pure, deterministic calculators (one file per metric is fine):
  - NOI, Cap Rate, Cash Flow, Cash on Cash, DSCR, Break-Even Ratio, GRM.
- [ ] One entry point (e.g. `UnderwritingEngine.calculate(inputs) -> UnderwritingOutputs`).
- [ ] Confidence score engine: takes input confidence (and optionally market confidence) and produces a single ConfidenceScore (e.g. 0–100 + grade).
- [ ] All formulas use `Decimal`; explicit rounding rules; formula source cited in comments (e.g. CCIM).
- [ ] Unit tests: golden master, edge cases (zero, negative, division by zero), rounding.

**Acceptance criteria**

- Every formula has at least one golden-master test with a hand-calculated expected value.
- Edge cases: no crashes; defined behavior (e.g. 0 or error) for invalid inputs.
- No AI/ML in the calculation path.
- Quant Reviewer signoff on formulas and tests; Architecture Reviewer signoff on structure.

**Risks / dependencies**

- Risk: Scope creep (e.g. IRR). Mitigation: v1 = scaffolding only for IRR (interface/data shape); full IRR in a later phase.

---

### Phase 4: Property Data — URL Parsing & Normalization

| Field | Value |
|-------|--------|
| **Builder** | Property Data Builder |
| **Depends on** | Phase 2 |
| **Scope** | Medium |
| **Reviewer** | Architecture Reviewer |

**Deliverables**

- [ ] URL parsers: Zillow and Redfin listing URL → structured identifier + optional address.
- [ ] Address normalizer (e.g. USPS-style: street, city, state, zip).
- [ ] `NormalizedProperty` (or equivalent) populated from parser + normalizer; every imported value has source, timestamp, confidence.
- [ ] Adapters are interfaces/protocols; no live API calls yet (mock or stub implementations only for v1 if you don’t have keys).
- [ ] Caching contract: e.g. “normalized property cache” interface so Phase 5 or 6 can add real caching.

**Acceptance criteria**

- Given a Zillow or Redfin URL, parser returns listing ID (and optional address) or a clear error.
- Given an address string, normalizer returns structured address components.
- All fetched/derived values are wrapped with source + timestamp + confidence.
- Unit tests for parser with 3–5 sample URLs per source; tests for normalizer with edge cases.

**Risks / dependencies**

- Risk: Zillow/Redfin change URL format. Mitigation: Encapsulate in adapters; tests document expected format.
- Dependency: Real Zillow/Redfin APIs may be separate (Phase 5 or later); this phase is parsing + normalization only.

---

### Phase 5: Property Data — Hydration & Import Confidence

| Field | Value |
|-------|--------|
| **Builder** | Property Data Builder |
| **Depends on** | Phase 4 |
| **Scope** | Medium |
| **Reviewer** | Architecture Reviewer, QA Reviewer |

**Deliverables**

- [ ] Property “hydration”: from listing ID or address, produce one `NormalizedProperty` (or equivalent).
- [ ] Integrate at least one real data source behind an adapter (e.g. Zillow API, or a backend you call). If no API key: keep mock adapter that returns realistic `NormalizedProperty` with confidence.
- [ ] Import confidence: rules for scoring confidence from source freshness, completeness, and number of sources.
- [ ] Cache: store normalized property by some key (e.g. listing ID + address hash); avoid duplicate network calls for same property.
- [ ] Partial-result fallback: if one source fails, return what’s available and mark confidence accordingly.

**Acceptance criteria**

- Hydration returns a single normalized property with all v1-required fields populated or explicitly “missing” with low confidence.
- Every field has source, timestamp, and confidence.
- Cache is used on repeated requests for same property.
- Unit/integration tests for success, partial, and failure paths; QA Reviewer signoff.

**Risks / dependencies**

- Risk: Third-party API rate limits and keys. Mitigation: All calls go through backend (Phase 7) in production; app uses backend endpoint, not raw API keys in the client.
- Dependency: Phase 7 (Backend) can provide a single “fetch property” endpoint that calls your adapters server-side.

---

### Phase 6: Market Intelligence — Signals & Future Value Scaffolding

| Field | Value |
|-------|--------|
| **Builder** | Market Intelligence Builder |
| **Depends on** | Phase 2 (models only) |
| **Scope** | Medium |
| **Reviewer** | Architecture Reviewer |

**Deliverables**

- [ ] Market signal types and metadata (e.g. population growth, permits, income, supply/demand); each signal has source, date range, confidence.
- [ ] At least one real or mock adapter that returns 1–2 signals (e.g. population growth, permits) for a geography (ZIP or city).
- [ ] Future value predictor: data structures and a simple rule-based or trend-based “scenario” (e.g. base/optimistic/pessimistic) with clear caveat text. No AI.
- [ ] Explanation text: rule-based short summaries per signal (e.g. “Population growth +2.3% — supports demand”).

**Acceptance criteria**

- For a given geography, the app can obtain at least one market signal with provenance.
- Future value predictor returns structured scenarios with disclaimer.
- All explanations are rule-based (no AI-generated text for numbers).
- Unit tests for aggregator/scoring logic if present.

**Risks / dependencies**

- Risk: Data sources (Census, etc.) need keys or have rate limits. Mitigation: Prefer backend to call these (Phase 7); app consumes backend.
- Dependency: Confidence meter in UI (Phase 10) will consume both underwriting confidence and market confidence.

---

### Phase 7: Backend — Supabase Setup, Auth, and Property API

| Field | Value |
|-------|--------|
| **Builder** | Backend Platform Builder |
| **Depends on** | Phase 2, 4, 5 (data shapes known) |
| **Scope** | Medium |
| **Reviewer** | Architecture Reviewer |

**Deliverables**

- [ ] Supabase project: migrations for `profiles` (or users), `properties`, `analyses` (or saved deals). RLS: users see only their own rows.
- [ ] Auth: Sign up / Sign in (email+password or OTP); session handling.
- [ ] One Edge Function (or Postgres RPC) that the app can call to “fetch property” (by URL or address). It uses your property adapters server-side and returns normalized property + confidence. No paid APIs called directly from the iOS client.
- [ ] Environment variables for API keys; documented in `.env.example`.

**Acceptance criteria**

- User can sign up and sign in; session persists.
- App can call “fetch property” and get back a normalized property (or error).
- All tables have RLS; no user can read another user’s data.
- Architecture Reviewer signoff on schema and RLS.

**Risks / dependencies**

- Risk: Supabase and Edge Function cold starts. Mitigation: Document; add loading state in app.
- Dependency: iOS app will use Supabase Swift client (Phase 8 or 9) to call this backend.

---

### Phase 8: Onboarding & Dashboard Shell

| Field | Value |
|-------|--------|
| **Builder** | iOS Frontend Builder |
| **Depends on** | Phase 1, 7 (auth exists) |
| **Scope** | Medium |
| **Reviewer** | UX Reviewer, Architecture Reviewer |

**Deliverables**

- [ ] Onboarding: 1–3 screens (value prop, maybe one permissions or sign-in CTA); then navigate to main app.
- [ ] Dashboard shell: tab or single root with placeholders for “Add property,” “Portfolio,” and “Settings” (or equivalent). Confidence meter and future value are not required on dashboard yet.
- [ ] Navigation structure that can host: Property Import, Property Detail, What-If, Portfolio.
- [ ] Loading, empty, success, error states for any screen that shows data (even if data is stub).
- [ ] Design system used throughout; 44pt touch targets; VoiceOver labels on interactive elements.

**Acceptance criteria**

- New user can complete onboarding and land on dashboard.
- Signed-in user sees dashboard with correct navigation.
- All four states (loading, empty, success, error) are implemented for dashboard content.
- UX Reviewer signoff on hierarchy and iPhone fit; Architecture Reviewer signoff on structure.

**Risks / dependencies**

- Dependency: Auth UI can use Supabase Swift Auth (Phase 7).

---

### Phase 9: Property Import UI & Integration

| Field | Value |
|-------|--------|
| **Builder** | iOS Frontend Builder |
| **Depends on** | Phase 5, 7, 8 |
| **Scope** | Medium |
| **Reviewer** | UX Reviewer, QA Reviewer |

**Deliverables**

- [ ] Property Import screen: input = Zillow URL, Redfin URL, or typed address (with optional autocomplete stub).
- [ ] Call backend “fetch property” (or local Property Data service with mock) and show loading → success (property summary) or error (message + retry).
- [ ] Display normalized property summary and import confidence; show source and “last updated” where appropriate.
- [ ] “Analyze” or “Save” CTA that stores the property for the user (via Supabase) and navigates to Property Detail (Phase 10).

**Acceptance criteria**

- User can paste a Zillow or Redfin URL and see a property summary (or clear error).
- User can enter an address and see a property summary (or clear error).
- Confidence and source are visible.
- Saving/analyzing persists the property and navigates to detail; QA Reviewer signoff on happy path and error path.

**Risks / dependencies**

- Dependency: Property Detail (Phase 10) must accept a property ID or model so navigation works.

---

### Phase 10: Property Detail — Metrics, Confidence Meter, Future Value

| Field | Value |
|-------|--------|
| **Builder** | iOS Frontend Builder |
| **Depends on** | Phase 3, 6, 9 |
| **Scope** | Large |
| **Reviewer** | UX Reviewer, Quant Reviewer (for displayed metrics) |

**Deliverables**

- [ ] Property Detail screen: show key underwriting metrics (NOI, cap rate, cash flow, CoC, DSCR, etc.) using `UnderwritingEngine` and stored/edited inputs.
- [ ] Confidence meter: prominent display of overall confidence score and grade; optional drill-down (e.g. which inputs are weak).
- [ ] Future value predictor: show scenarios (e.g. base/optimistic/pessimistic) with clear disclaimer; use Market Intelligence scaffolding from Phase 6.
- [ ] Assumptions surfaced: e.g. vacancy, expenses, financing; user can see what’s assumed and that they can change them in What-If (Phase 11).
- [ ] Loading, empty, success, error states; all numbers formatted (currency, %).

**Acceptance criteria**

- All v1 metrics are calculated by Underwriting Engine and displayed correctly.
- Confidence meter reflects current input and (if available) market data confidence.
- Future value shows at least one scenario with disclaimer.
- Assumptions are visible; no hidden assumptions. Quant Reviewer spot-checks displayed math; UX Reviewer signoff on hierarchy and readability.

**Risks / dependencies**

- Risk: Information overload. Mitigation: Hierarchy — Confidence first, then key metrics, then details; use expand/collapse if needed.

---

### Phase 11: What-If Scenarios (Real-Time)

| Field | Value |
|-------|--------|
| **Builder** | iOS Frontend Builder |
| **Depends on** | Phase 3, 10 |
| **Scope** | Medium |
| **Reviewer** | UX Reviewer, QA Reviewer |

**Deliverables**

- [ ] What-If screen or sheet: sliders/inputs for key levers (e.g. purchase price, rent, vacancy, expenses, rate, term).
- [ ] Changes update underwriting outputs in real time (re-run `UnderwritingEngine` on change; no server round-trip for math).
- [ ] Confidence score updates when inputs change (e.g. user override = different confidence).
- [ ] Optional: “Save scenario” or “Compare to base” so user can see delta vs. original.

**Acceptance criteria**

- User can change at least 4–5 key inputs and see metrics and confidence update immediately.
- No laggy UI (throttle or debounce if needed).
- QA Reviewer signoff: sliders at min/mid/max produce sensible numbers; no crashes.

**Risks / dependencies**

- Dependency: Underwriting Engine must be fast enough for real-time use (already required in Phase 3).

---

### Phase 12: Portfolio — List & Persistence

| Field | Value |
|-------|--------|
| **Builder** | iOS Frontend Builder |
| **Depends on** | Phase 7, 9, 10 |
| **Scope** | Medium |
| **Reviewer** | UX Reviewer, QA Reviewer |

**Deliverables**

- [ ] Portfolio screen: list of user’s saved/analyzed properties (from Supabase).
- [ ] Each row: address (or title), confidence score, key metric (e.g. cap rate or cash flow), last updated.
- [ ] Tap row → Property Detail (Phase 10).
- [ ] Pull-to-refresh; loading, empty (no properties yet), success, error states.
- [ ] Optional: delete or archive from list.

**Acceptance criteria**

- User sees all properties they’ve saved; list stays in sync with Supabase (on load and after refresh).
- Tapping a property opens Property Detail with correct data.
- Empty state explains how to add a property (link to Property Import).
- QA Reviewer signoff on list + navigation + error handling.

**Risks / dependencies**

- Dependency: Supabase tables and RLS from Phase 7; app uses same auth session.

---

### Phase 13: Integration, Polish & Release Prep

| Field | Value |
|-------|--------|
| **Builder** | iOS Frontend Builder + Backend Platform Builder (as needed) |
| **Depends on** | Phases 1–12 |
| **Scope** | Medium |
| **Reviewer** | Architecture Reviewer, UX Reviewer, QA Reviewer |

**Deliverables**

- [ ] End-to-end flow: Onboarding → Import property → Analyze → What-If → Save to Portfolio → View in Portfolio → Re-open detail.
- [ ] All external data shows source/timestamp/confidence where relevant.
- [ ] Error handling: network failures, auth expiry, validation errors; no silent failures.
- [ ] Accessibility: VoiceOver, Dynamic Type, 44pt targets; contrast checked.
- [ ] App icon and launch screen; TestFlight or build for internal test.
- [ ] README updated: how to run, env vars, and “what’s in v1.”

**Acceptance criteria**

- One full path (Zillow URL → saved in portfolio → what-if → back to detail) works without crashes.
- No blocker or major open issues from the three reviewers.
- README and (if applicable) `.env.example` document setup for a new developer.

**Risks / dependencies**

- Risk: Scope creep. Mitigation: Only bug fixes and integration; no new features in this phase.

---

## 3. Acceptance Criteria Summary Table

| Phase | Must pass before “Done” |
|-------|--------------------------|
| 1 | App runs; design system in place; folder structure matches tree |
| 2 | Models compile; money as Decimal; documented use |
| 3 | All formulas unit-tested; golden master + edge cases; Quant + Arch review |
| 4 | Zillow/Redfin URL parsed; address normalized; provenance on all values |
| 5 | Hydration returns normalized property; cache; partial fallback; tests |
| 6 | ≥1 market signal with provenance; future value scenarios + disclaimer |
| 7 | Auth works; “fetch property” endpoint; RLS on all tables |
| 8 | Onboarding + dashboard shell; four states; navigation in place |
| 9 | Import by URL/address; confidence visible; save → detail |
| 10 | All metrics from engine; confidence meter; future value; assumptions visible |
| 11 | What-if sliders; real-time metrics + confidence; sensible at min/mid/max |
| 12 | Portfolio list from Supabase; open detail; empty/error states |
| 13 | E2E flow works; accessibility; README; no open blocker/major |

---

## 4. Risks and Dependencies

### Cross-Cutting Risks

| Risk | Impact | Mitigation |
|------|--------|-------------|
| Third-party API changes (Zillow/Redfin) | Import breaks | Adapters + tests; backend as single caller |
| Supabase/backend downtime | App degraded | Clear error states; optional offline cache later |
| Scope creep (IRR, renovation, etc.) | Delayed v1 | Strict v1 backlog; “future” backlog for rest |
| Formula or UX disagreements | Rework | Quant + UX review early and at each phase |

### Dependency Graph (Simplified)

- **Phase 1** → 2, 8  
- **Phase 2** → 3, 4, 6, 10  
- **Phase 3** → 10, 11  
- **Phase 4** → 5  
- **Phase 5** → 9, 10  
- **Phase 6** → 10  
- **Phase 7** → 8, 9, 12  
- **Phase 8** → 9, 12  
- **Phase 9** → 10, 12  
- **Phase 10** → 11, 12  
- **Phase 11, 12** → 13  

---

## 5. Builder Agent per Phase

| Phase | Builder agent |
|-------|----------------|
| 1 | iOS Frontend Builder |
| 2 | Underwriting Engine Builder + iOS Frontend Builder (models) |
| 3 | Underwriting Engine Builder |
| 4 | Property Data Builder |
| 5 | Property Data Builder |
| 6 | Market Intelligence Builder |
| 7 | Backend Platform Builder |
| 8 | iOS Frontend Builder |
| 9 | iOS Frontend Builder |
| 10 | iOS Frontend Builder |
| 11 | iOS Frontend Builder |
| 12 | iOS Frontend Builder |
| 13 | iOS Frontend Builder, Backend Platform Builder (as needed) |

---

## 6. Reviewer Subagent per Phase

| Phase | Primary reviewer(s) | Secondary (if needed) |
|-------|--------------------|------------------------|
| 1 | Architecture Reviewer | — |
| 2 | Architecture Reviewer | — |
| 3 | Quant Reviewer, then Architecture Reviewer | QA Reviewer (tests) |
| 4 | Architecture Reviewer | — |
| 5 | Architecture Reviewer, QA Reviewer | — |
| 6 | Architecture Reviewer | — |
| 7 | Architecture Reviewer | — |
| 8 | UX Reviewer, Architecture Reviewer | — |
| 9 | UX Reviewer, QA Reviewer | — |
| 10 | UX Reviewer, Quant Reviewer | — |
| 11 | UX Reviewer, QA Reviewer | — |
| 12 | UX Reviewer, QA Reviewer | — |
| 13 | Architecture Reviewer, UX Reviewer, QA Reviewer | — |

**Rule:** Do not mark a phase complete until its assigned reviewer(s) have given PASS (or PASS WITH CONDITIONS with follow-up tracked).

---

## 7. Initial Backlog: v1 vs Future Releases

### v1 (Must Have for “Production-Grade” First Release)

- All 13 phases above.
- Property import: Zillow link, Redfin link, typed address (with or without autocomplete).
- Full underwriting metrics: NOI, cap rate, cash flow, cash on cash, DSCR, break-even, GRM.
- Confidence meter driven by input + (if available) market data.
- Future value predictor: at least one scenario (e.g. base) with disclaimer.
- What-if: real-time sliders for main levers.
- Portfolio: save and list analyzed deals; open from list to detail.
- Auth: sign up / sign in; data scoped to user.
- All four UI states (loading, empty, success, error) on every data screen.
- Source, timestamp, and confidence on all imported data.
- Unit tests for all financial formulas; reviewer signoff per phase.

### Future Releases (Backlog — Not in v1)

- **Address autocomplete** (full integration with a provider).
- **Renovation UI**: dedicated renovation assumptions and impact on numbers.
- **IRR**: full implementation (v1 has scaffolding only).
- **Multiple scenarios**: save and name what-if scenarios (e.g. “Conservative”, “Aggressive”).
- **Market intelligence**: more signals (permits, migration, income) and richer explanations.
- **Offline / caching**: analyze and view recently opened properties without network.
- **Export**: PDF or share link of analysis.
- **iPad layout**: optimize layouts for larger screens.
- **Notifications**: e.g. price or status change for saved properties (if data source allows).
- **Multi-currency or multi-region**: if you expand beyond one market.

---

## How to Use This Roadmap in Cursor (Beginner)

1. **Start with Phase 1**  
   In Cursor, say: “I’m following the PropFolio roadmap. Implement Phase 1: Project Scaffolding & Design System. Use the iOS Frontend Builder agent and the repo structure in docs/PROPFOLIO-ROADMAP.md.”

2. **Hand off with the agent handoff template**  
   Copy the “Phase [N] Handoff” section from the Program Director agent into the chat and fill in deliverables and acceptance criteria from this doc.

3. **Request review before moving on**  
   When Phase N is done, paste the “Review Request” template and tag the reviewer(s) listed in section 6 (e.g. “Run Architecture Reviewer on Phase 1”).

4. **Track in one place**  
   Keep a simple checklist (e.g. in `docs/phase-handoffs/phase-status.md`) with Phase 1–13 and check off “Builder done” and “Reviewer signoff” so you don’t skip the gate.

5. **If stuck**  
   Check “Risks and dependencies” and “Acceptance criteria” for the current phase; simplify scope (e.g. mock an API) rather than adding scope.

---

*This roadmap is the single source of truth for the PropFolio v1 build order, agents, and review gates. Update it when you change phase scope or add phases.*
