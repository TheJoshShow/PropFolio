# PropFolio — Full File Tree (Canonical)

This is the **canonical** structure. Align roadmap and scaffold with this tree. Placeholder files have comments explaining what belongs in each folder. See `ARCHITECTURE-REVIEW-ROADMAP-AND-SCAFFOLD.md` for placement rules (models, adapters, Supabase vs Sync).

```
PropFolio/                                    # Repo root
├── .cursor/
│   ├── agents/
│   └── rules/
│
├── docs/
│   ├── PROPFOLIO-ROADMAP.md
│   ├── FILE-TREE.md                          # This file (canonical tree)
│   ├── ARCHITECTURE-REVIEW-ROADMAP-AND-SCAFFOLD.md
│   └── phase-handoffs/
│       └── phase-status.md
│
├── PropFolio/                                # iOS app source root
│   ├── App/
│   │   └── PropFolioApp.swift
│   │
│   ├── Models/                               # Shared only (used by 2+ domains)
│   │   ├── README.md                        # Rule: domain-owned types in domain (Engine/..., Services/...)
│   │   └── DomainModelsPlaceholder.swift
│   │
│   ├── Engine/
│   │   └── Underwriting/
│   │       ├── Models/                      # UnderwritingInputs, UnderwritingOutputs, ConfidenceScore
│   │       │   └── README.md
│   │       ├── README.md                    # Rule: no SwiftUI/UIKit; pure, Decimal, tested
│   │       └── UnderwritingEnginePlaceholder.swift
│   │
│   ├── Services/
│   │   ├── PropertyData/
│   │   │   ├── Adapters/                    # All third-party property API calls here
│   │   │   │   └── README.md
│   │   │   ├── README.md
│   │   │   └── PropertyDataServicePlaceholder.swift
│   │   ├── MarketIntelligence/
│   │   │   ├── Adapters/                    # All third-party market API calls here
│   │   │   │   └── README.md
│   │   │   ├── README.md
│   │   │   └── MarketIntelligenceServicePlaceholder.swift
│   │   └── Sync/                            # Auth, fetch property, portfolio CRUD (no keys in client)
│   │       ├── README.md
│   │       └── SyncServicePlaceholder.swift
│   │
│   ├── Supabase/                            # Client init and auth config only (no business logic)
│   │   ├── README.md
│   │   └── SupabaseClientPlaceholder.swift
│   │
│   ├── ViewModels/                          # Subfolders mirror Screens/
│   │   ├── Onboarding/
│   │   ├── Dashboard/
│   │   ├── PropertyImport/
│   │   ├── PropertyDetail/
│   │   ├── WhatIf/
│   │   ├── Portfolio/
│   │   ├── README.md
│   │   └── ViewModelPlaceholder.swift
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
│   ├── Extensions/                          # Extensions + small helpers (was Utilities)
│   │   ├── README.md
│   │   └── ExtensionsPlaceholder.swift
│   │
│   └── Resources/
│       └── README.md
│
├── PropFolioTests/
│   ├── Unit/
│   │   ├── Engine/                          # UnderwritingTests, etc.
│   │   ├── Services/                        # PropertyDataTests, MarketIntelligenceTests
│   │   ├── README.md
│   │   └── UnitTestPlaceholder.swift
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

## Placement rules (summary)

- **Models:** Shared types only in root `Models/`. Underwriting types in `Engine/Underwriting/Models/`.
- **Engine:** No SwiftUI/UIKit; pure logic, Decimal, unit-tested.
- **Adapters:** All third-party API implementations under `Services/PropertyData/Adapters/` and `Services/MarketIntelligence/Adapters/`; used only via the service.
- **Supabase vs Sync:** `Supabase/` = client config only. `Services/Sync/` = auth flows, API calls, persistence.
- **ViewModels:** Subfolders mirror Screens (Onboarding, Dashboard, …).

## Next steps

1. Create the Xcode project (app target `PropFolio`, test target `PropFolioTests`) and add these folders to the correct targets.
2. Remove placeholder Swift files as you add real implementations; keep READMEs.
3. Follow `docs/PROPFOLIO-ROADMAP.md` phase by phase.
