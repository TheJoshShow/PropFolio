//
//  ScenarioManager.swift
//  PropFolio
//
//  Manages baseline and comparison scenarios: save, set baseline, compare.
//  Pure logic; state held by caller (e.g. SimulationViewModel).
//

import Foundation

struct ScenarioManager {
    /// Create a new scenario and add to list. If isBaseline, this becomes the only baseline.
    static func saveScenario(name: String, inputs: SimulationInputs, isBaseline: Bool, into scenarios: [Scenario]) -> (Scenario, [Scenario]) {
        let scenario = Scenario(name: name, isBaseline: isBaseline, inputs: inputs)
        let next = addScenario(scenario, to: scenarios)
        return (scenario, next)
    }

    /// Add scenario to list. If it is baseline, becomes the only baseline.
    static func addScenario(_ scenario: Scenario, to scenarios: [Scenario]) -> [Scenario] {
        var next = scenarios
        if scenario.isBaseline {
            next = next.map { var s = $0; s.isBaseline = false; return s }
        }
        next.append(scenario)
        if scenario.isBaseline {
            return setBaseline(id: scenario.id, in: next)
        }
        return next
    }

    /// Set the scenario with the given id as the only baseline.
    static func setBaseline(id: UUID, in scenarios: [Scenario]) -> [Scenario] {
        scenarios.map { var s = $0; s.isBaseline = (s.id == id); return s }
    }

    /// Remove scenario by id.
    static func removeScenario(id: UUID, from scenarios: [Scenario]) -> [Scenario] {
        scenarios.filter { $0.id != id }
    }

    /// Current baseline (first scenario marked isBaseline).
    static func baseline(from scenarios: [Scenario]) -> Scenario? {
        scenarios.first { $0.isBaseline }
    }

    /// All scenarios except the baseline.
    static func comparisonScenarios(from scenarios: [Scenario]) -> [Scenario] {
        scenarios.filter { !$0.isBaseline }
    }

    /// Build a comparison between two scenarios (e.g. baseline vs what-if).
    static func compare(baseline: Scenario, comparison: Scenario) -> ScenarioComparison {
        let resultLeft = SimulationEngine.run(baseline.inputs)
        let resultRight = SimulationEngine.run(comparison.inputs)
        return ScenarioComparison(left: baseline, right: comparison, resultLeft: resultLeft, resultRight: resultRight)
    }
}
