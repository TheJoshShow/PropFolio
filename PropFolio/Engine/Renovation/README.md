# Renovation Planning Model

Line-item renovation planning with low/base/high estimates, region multiplier placeholder, contingency, and effect on total cash and returns.

## Data structures

- **RenovationCategory** — Enum of 14 major categories: roof, windows, electrical, plumbing, HVAC, foundation/structural, flooring, kitchens, bathrooms, paint, exterior envelope, landscaping/site work, permits/contingency, general labor/demo.
- **RenovationLineItem** — One category with optional `low`, `base`, `high` (USD). `value(for: RenovationEstimateTier)` and `setValue(_:for:)`.
- **RenovationEstimateTier** — `.low`, `.base`, `.high` for which estimate to use in totals.
- **RenovationPlan** — `lineItems: [RenovationLineItem]`, `regionMultiplier: Decimal?`, `contingencyPercent: Decimal`. Methods: `subtotal(for:)`, `subtotalWithRegion(for:)`, `contingencyAmount(for:)`, `total(for:)` (region-adjusted subtotal + contingency). Use `total(for: tier)` for total cash needed and simulation.

## Default templates

- **DefaultRenovationTemplates** — Static low/base/high (USD) per category (national averages). `defaults(for: category)`, `lineItem(for: category)`, `plan(regionMultiplier:contingencyPercent:)` for a full plan, or `plan(categories:regionMultiplier:contingencyPercent:)` for a subset.

## Contingency and region

- **Contingency:** Applied as a percent of the (region-adjusted) line-item subtotal. E.g. 10% contingency on $50k subtotal = $5k; total = $55k.
- **Region multiplier:** Placeholder for local cost adjustment. 1.0 = national average; e.g. 1.15 multiplies subtotal by 15% before contingency. Replace with real regional data when available.

## Effect on simulation

- **SimulationInputs** has `renovationPlan: RenovationPlan?` and `renovationEstimateTier: RenovationEstimateTier` (default `.base`). When `renovationPlan` is set, `SimulationEngine` uses `plan.total(for: renovationEstimateTier)` for renovation total and total cash to close; otherwise falls back to legacy `renovationCosts?.total`.
- Renovation total increases **total cash to close** (down + closing + renovation). It does not change NOI or debt service; it increases **equity/cash required** and thus can lower **cash-on-cash return** for the same NOI.

## Explanations (novice users)

- **RenovationExplanations** — `categoryExplanation(_ category)` (what the category is and why it matters), `tierTip(_ tier)`, `regionMultiplierExplanation()`, `contingencyExplanation()`.

## Rules

- All amounts `Decimal`; no SwiftUI/UIKit in Engine. Deterministic and testable.
