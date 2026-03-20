# Simulation (What-If) Engine

Real-time what-if simulation: user-adjustable inputs drive immediate recompute of all underwriting metrics. Scenarios can be saved and compared to a baseline.

## Components

- **SimulationInputs** — User-adjustable fields: purchase price, down payment (% or amount), rate, term, closing costs, rent per unit, unit count, vacancy, taxes, insurance, management, repairs, utilities, capital reserves, renovation by category. All optional for stable behavior with incomplete data.
- **SimulationEngine** — Maps simulation inputs to `UnderwritingInputs`, runs `UnderwritingEngine.calculate`, returns `SimulationResult` (underwriting outputs + total cash to close, equity invested, renovation total).
- **Scenario** — Saved snapshot: name, isBaseline, inputs, createdAt.
- **ScenarioManager** — Pure logic: save scenario, set baseline, remove, compare(baseline, comparison) → `ScenarioComparison` (side-by-side + deltas).
- **SimulationViewModel** — `@Published inputs` and `@Published result`; every change to `inputs` triggers `SimulationEngine.run` and updates `result`. Holds scenarios and exposes save/load/compare.

## Usage

1. **Real-time recompute:** Bind UI to `SimulationViewModel.inputs`; display `SimulationViewModel.result.underwriting` (NOI, cap rate, cash flow, etc.) and `result.totalCashToClose`, `result.equityInvested`.
2. **Save scenario:** `viewModel.saveScenario(name: "Optimistic", asBaseline: false)`.
3. **Set baseline:** `viewModel.setBaseline(id: scenario.id)`.
4. **Compare:** `viewModel.compare(to: scenario)` returns `ScenarioComparison` with left/right results and `delta(metric:)` for key metrics.

## Rules

- No SwiftUI/UIKit in Engine (SimulationEngine, ScenarioManager). ViewModel may depend on Combine/SwiftUI for reactivity.
- All money in `Decimal`; calculations deterministic and unit-tested.
