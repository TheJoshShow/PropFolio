# Architecture Review: Roadmap & Repo Scaffold

**Reviewer:** Architecture Reviewer  
**Scope:** Proposed roadmap (docs/PROPFOLIO-ROADMAP.md) and repo scaffold (PropFolio/, PropFolioTests/, supabase/, docs/FILE-TREE.md)  
**Date:** As of review

---

## Verdict: **PASS WITH CONDITIONS**

The module structure is suitable for a beginner and scalable for production. Financial calculations are isolated from UI, and third-party integrations are behind adapters. **Conditions:** Align roadmap and scaffold on one canonical file tree, add explicit placement rules for models and adapters, and document the final structure in one place to avoid future bugs.

---

## 1. Module structure: simple for beginner, scalable for production

| Criterion | Status | Notes |
|-----------|--------|--------|
| Clear entry point | ✅ | App/PropFolioApp.swift; single root. |
| Domain-driven areas | ✅ | Engine, Services (PropertyData, MarketIntelligence, Sync), Screens/Features. |
| Flat enough to navigate | ✅ | One level of feature folders (Onboarding, Dashboard, …); no deep nesting. |
| Room to grow | ✅ | Services and Engine can add files without new top-level folders; tests mirror structure. |
| Single source of truth for tree | ⚠️ | Roadmap and scaffold differ (Features vs Screens, Extensions vs Utilities). Must reconcile. |

**Recommendation:** Adopt the **final revised structure** below and update both the roadmap and FILE-TREE.md so there is one canonical tree.

---

## 2. Financial calculations isolated from UI

| Criterion | Status | Notes |
|-----------|--------|--------|
| Calculations in dedicated layer | ✅ | Engine/Underwriting holds all formula and confidence logic. |
| No UI in Engine | ✅ | Scaffold has no SwiftUI/UIKit in Engine; README states “deterministic calculation logic only.” |
| UI only consumes results | ✅ | Screens and ViewModels call Engine; they don’t implement formulas. |
| Testable without UI | ✅ | Engine can be unit-tested with no app or UI target. |

**Recommendation:** Add an explicit rule in Engine/Underwriting/README and in propfolio-global.mdc: **“Engine must not import SwiftUI or UIKit. It may only depend on Foundation and types it owns or receives (e.g. Models).”** That prevents accidental UI coupling.

---

## 3. Third-party data integrations behind adapters

| Criterion | Status | Notes |
|-----------|--------|--------|
| Property data behind abstraction | ✅ | Services/PropertyData README: “Adapters: wrap external APIs”; single PropertyDataService API. |
| Market data behind abstraction | ✅ | Services/MarketIntelligence README: adapters and “signal” types; no raw API types in UI. |
| Backend/Supabase behind abstraction | ✅ | Services/Sync for auth and API calls; Supabase/ for client config only. |
| Explicit adapter folder | ⚠️ | READMEs mention adapters but scaffold doesn’t show Adapters/ subfolders; naming could drift. |

**Recommendation:** In the canonical tree, show **Adapters/** under Services/PropertyData and Services/MarketIntelligence, and state in READMEs: **“All third-party API calls must live in Adapters/ and be called only via the service (PropertyDataService / MarketIntelligenceService).”** That keeps integrations isolated and reduces “where do I put this?” mistakes.

---

## 4. Folder and naming changes to reduce future bugs

| Issue | Risk | Fix |
|-------|------|-----|
| Roadmap says **Features/** and **Extensions/**; scaffold has **Screens/** and **Utilities/** | Builders may create Features/ and Extensions/ while code lives in Screens/ and Utilities/; duplicate or misplaced files. | Pick one naming scheme. Recommended: keep **Screens/** and **ViewModels/** (clear roles), and rename **Utilities/** → **Extensions/** to match roadmap and Swift convention for extension files. |
| **Models** placement ambiguous (“or in Engine/Underwriting/Models”) | Underwriting types end up in both Models/ and Engine; inconsistent imports and ownership. | **Rule:** Underwriting input/output and confidence types live in **Engine/Underwriting/Models/**. **Models/** at root is only for types shared across multiple domains (e.g. TrackedValue, or DTOs used by both app and backend). Document in Models/README and Engine README. |
| ViewModels in one flat folder | Many ViewModels in one directory; harder to find and easy to misname. | Use **ViewModels/Onboarding/**, **ViewModels/Dashboard/**, etc., mirroring **Screens/** so each feature has a clear ViewModel path. |
| Supabase/ vs Sync/ responsibility unclear | Config (keys, URL) mixed with sync logic, or vice versa. | **Rule:** **Supabase/** = client initialization and auth config only (no business logic). **Services/Sync/** = auth flows, fetch property, portfolio CRUD, caching. Document in both READMEs. |
| Test structure doesn’t mirror Engine/Services | Harder to find tests for a given module. | Add **PropFolioTests/Unit/Engine/** and **PropFolioTests/Unit/Services/** (or keep Unit/UnderwritingTests, Unit/PropertyDataTests as subfolders) and state in README: “Test folder names mirror source (Engine, Services).” |

---

## Blockers

**None.** No structural blocker prevents starting Phase 1. The conditions above are clarifications and one naming alignment (Utilities → Extensions) so the structure stays consistent as the team grows.

---

## Recommended fixes (before or during Phase 1)

1. **Adopt the final revised structure** below and update:
   - `docs/PROPFOLIO-ROADMAP.md` (Section 1 “Recommended Repository File Tree”)
   - `docs/FILE-TREE.md`
   so both reference the same tree.

2. **Rename** `PropFolio/Utilities/` → `PropFolio/Extensions/` and update README to: “Extensions (e.g. Date+Format, Decimal+Currency) and small pure helpers. No business logic.”

3. **Add** `Engine/Underwriting/Models/` to the tree and README; add rule in `Engine/Underwriting/README.md`: “Underwriting-specific types (UnderwritingInputs, UnderwritingOutputs, ConfidenceScore) live in Engine/Underwriting/Models/. This module must not import SwiftUI or UIKit.”

4. **Add** `Models/README.md` rule: “Shared types only (used by two or more of: Engine, Services, UI). Domain-owned types live in their domain (e.g. Engine/Underwriting/Models, Services/PropertyData/Models if needed).”

5. **Add** `Services/PropertyData/Adapters/` and `Services/MarketIntelligence/Adapters/` to the tree and READMEs: “All third-party API implementations live under Adapters/ and are used only via the service.”

6. **Use** `ViewModels/Onboarding/`, `ViewModels/Dashboard/`, … (mirroring Screens/) and document in ViewModels/README.

7. **Document** Supabase/ vs Services/Sync in both READMEs (config vs sync logic).

---

## Final revised structure

Single canonical tree to use in the roadmap and in FILE-TREE.md:

```
PropFolio/                                    # Repo root
├── .cursor/
│   ├── agents/
│   └── rules/
│
├── docs/
│   ├── PROPFOLIO-ROADMAP.md
│   ├── FILE-TREE.md
│   ├── ARCHITECTURE-REVIEW-ROADMAP-AND-SCAFFOLD.md
│   └── phase-handoffs/
│       └── phase-status.md
│
├── PropFolio/                                # iOS app source root
│   ├── App/
│   │   └── PropFolioApp.swift
│   │
│   ├── Models/                               # Shared only: types used by 2+ domains
│   │   └── README.md                        # Rule: domain-owned types live in domain (Engine/..., Services/...)
│   │
│   ├── Engine/
│   │   └── Underwriting/
│   │       ├── Models/                      # UnderwritingInputs, UnderwritingOutputs, ConfidenceScore
│   │       ├── README.md                    # Rule: no SwiftUI/UIKit; pure, Decimal, tested
│   │       └── ... (calculators, confidence engine)
│   │
│   ├── Services/
│   │   ├── PropertyData/
│   │   │   ├── Adapters/                    # Zillow, Redfin, etc. — all third-party calls here
│   │   │   ├── README.md
│   │   │   └── ... (parsers, normalizers, PropertyDataService)
│   │   ├── MarketIntelligence/
│   │   │   ├── Adapters/                    # Census, BLS, etc. — all third-party calls here
│   │   │   ├── README.md
│   │   │   └── ... (signals, predictors, explainers)
│   │   └── Sync/                            # Auth, fetch property, portfolio CRUD (no keys; call backend)
│   │       └── README.md
│   │
│   ├── Supabase/                            # Client init and auth config only (no business logic)
│   │   └── README.md
│   │
│   ├── ViewModels/                          # Per-feature; subfolders mirror Screens
│   │   ├── Onboarding/
│   │   ├── Dashboard/
│   │   ├── PropertyImport/
│   │   ├── PropertyDetail/
│   │   ├── WhatIf/
│   │   └── Portfolio/
│   │   └── README.md
│   │
│   ├── Screens/
│   │   ├── Onboarding/
│   │   ├── Dashboard/
│   │   ├── PropertyImport/
│   │   ├── PropertyDetail/
│   │   ├── WhatIf/
│   │   └── Portfolio/
│   │
│   ├── Components/
│   ├── DesignSystem/
│   ├── Extensions/                          # Was Utilities: Date+, Decimal+, formatters, small helpers
│   └── Resources/
│
├── PropFolioTests/
│   ├── Unit/
│   │   ├── Engine/                          # UnderwritingTests, etc.
│   │   ├── Services/                        # PropertyDataTests, MarketIntelligenceTests
│   │   └── README.md
│   ├── Mocks/
│   └── Helpers/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## Summary

- **Verdict:** PASS WITH CONDITIONS.
- **Blockers:** None.
- **Fixes:** Align roadmap and scaffold on the final revised structure; rename Utilities → Extensions; add Engine/Underwriting/Models and Services/*/Adapters; document model/adapter/Supabase vs Sync rules; mirror ViewModels subfolders to Screens.
- **Financial isolation:** Satisfied; Engine is UI-free and testable.
- **Adapter isolation:** Satisfied; explicit Adapters/ and service-only API keep third-party integrations behind clear boundaries.
- **Final structure:** Use the tree above as the single source of truth and update PROPFOLIO-ROADMAP.md and FILE-TREE.md accordingly.
