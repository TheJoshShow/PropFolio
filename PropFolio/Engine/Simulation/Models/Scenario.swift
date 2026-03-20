//
//  Scenario.swift
//  PropFolio
//
//  Saved scenario state for comparison. Baseline + named comparison scenarios.
//

import Foundation

/// A saved what-if scenario: name, optional baseline flag, and snapshot of inputs.
struct Scenario: Identifiable, Equatable, Sendable {
    let id: UUID
    var name: String
    var isBaseline: Bool
    var inputs: SimulationInputs
    var createdAt: Date

    init(id: UUID = UUID(), name: String, isBaseline: Bool = false, inputs: SimulationInputs, createdAt: Date = Date()) {
        self.id = id
        self.name = name
        self.isBaseline = isBaseline
        self.inputs = inputs
        self.createdAt = createdAt
    }
}
