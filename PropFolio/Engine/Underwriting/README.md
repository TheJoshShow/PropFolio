# Engine / Underwriting

**What belongs here:** Deterministic financial calculation logic only.

- **Calculators:** NOI, cap rate, cash flow, cash on cash, DSCR, break-even, GRM (each in its own file or grouped).
- **Confidence score engine:** Aggregates input confidence into a single score/grade.
- **Input/output types** specific to underwriting (can live here or in shared Models).
- **Validation:** Input range checks, sanity checks.

**Rules:** Pure functions, `Decimal` for money, no AI/ML, no side effects. Every formula must be unit-tested. **This module must not import SwiftUI or UIKit** — it may depend only on Foundation and types it owns (e.g. Engine/Underwriting/Models) or receives. That keeps calculations testable and isolated from UI.
