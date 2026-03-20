# Models

**What belongs here:** **Shared** domain and data-transfer types used by **two or more** of: Engine, Services, UI. Do not put domain-owned types here.

- **Placement rule:** If a type is owned by a single domain, it lives in that domain (e.g. `UnderwritingInputs`, `UnderwritingOutputs`, `ConfidenceScore` → **Engine/Underwriting/Models/**). Only types shared across domains (e.g. `TrackedValue<T>`, `ImportMetadata`, or DTOs used by both app and backend) go here.
- **Property:** `NormalizedProperty`, `TrackedValue<T>`, `ImportMetadata`, `ImportConfidence`, address types (if shared).
- **Market:** `MarketSignal`, geography types (if shared across MarketIntelligence and UI).
- **Portfolio:** `SavedProperty`, `AnalysisSummary` (if not just Supabase DTOs).

Use `Decimal` for all money. Keep types pure (no business logic). Prefer value types (struct, enum).
