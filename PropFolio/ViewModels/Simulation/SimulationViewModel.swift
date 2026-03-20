//
//  SimulationViewModel.swift
//  PropFolio
//
//  Real-time what-if: every change to inputs recomputes all metrics. Holds current inputs,
//  baseline + comparison scenarios, and exposes save/compare.
//

import Foundation
import Combine

@MainActor
final class SimulationViewModel: ObservableObject {
    /// Current editing inputs. Any change triggers immediate recompute.
    @Published var inputs: SimulationInputs {
        didSet { recompute() }
    }

    /// Latest result (recomputed on every inputs change).
    @Published private(set) var result: SimulationResult

    /// All saved scenarios (one baseline, rest comparisons).
    @Published var scenarios: [Scenario]

    /// Baseline scenario, if any.
    var baselineScenario: Scenario? { ScenarioManager.baseline(from: scenarios) }

    /// Comparison scenarios (non-baseline).
    var comparisonScenarios: [Scenario] { ScenarioManager.comparisonScenarios(from: scenarios) }

    private func recompute() {
        result = SimulationEngine.run(inputs)
    }

    init(initialInputs: SimulationInputs = SimulationInputs(), scenarios: [Scenario] = []) {
        self.inputs = initialInputs
        self.result = SimulationEngine.run(initialInputs)
        self.scenarios = scenarios
    }

    // MARK: - Scenario actions

    /// Save current inputs as a new scenario. Optionally set as baseline.
    func saveScenario(name: String, asBaseline: Bool) {
        let (saved, next) = ScenarioManager.saveScenario(name: name, inputs: inputs, isBaseline: asBaseline, into: scenarios)
        scenarios = next
        Task {
            await UsageTrackingService.shared.trackSavedScenario(
                scenarioId: saved.id,
                name: saved.name,
                asBaseline: asBaseline
            )
        }
    }

    /// Set the scenario with the given id as the baseline.
    func setBaseline(id: UUID) {
        scenarios = ScenarioManager.setBaseline(id: id, in: scenarios)
    }

    /// Remove a saved scenario.
    func removeScenario(id: UUID) {
        scenarios = ScenarioManager.removeScenario(id: id, from: scenarios)
    }

    /// Load a scenario's inputs into the current editing state (does not replace saved scenario).
    func loadScenario(_ scenario: Scenario) {
        inputs = scenario.inputs
    }

    /// Compare baseline to the given scenario. Returns nil if no baseline.
    func compare(to scenario: Scenario) -> ScenarioComparison? {
        guard let base = baselineScenario else { return nil }
        return ScenarioManager.compare(baseline: base, comparison: scenario)
    }
}
