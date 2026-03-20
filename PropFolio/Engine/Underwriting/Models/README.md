# Engine/Underwriting/Models

**What belongs here:** Underwriting-specific input/output and confidence types only.

- **UnderwritingInputs** — All inputs to the underwriting engine (purchase, income, expenses, financing).
- **UnderwritingOutputs** — All computed metrics (NOI, cap rate, cash flow, DSCR, etc.).
- **ConfidenceScore** — Score, grade, signals, limiting factors.

**Rule:** Types that are only used by the Engine live here. Types shared with Services or UI (e.g. a generic `TrackedValue`) live in root **Models/** or in the owning domain. This keeps the Engine self-contained and testable without pulling in the rest of the app.

Use `Decimal` for all money. No SwiftUI/UIKit; this module must not import UI frameworks.
