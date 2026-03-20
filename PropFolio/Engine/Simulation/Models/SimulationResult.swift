//
//  SimulationResult.swift
//  PropFolio
//
//  Result of a simulation run: underwriting outputs plus simulation-specific metrics.
//

import Foundation

/// Result of running the simulation engine. Stable with incomplete inputs (nils).
struct SimulationResult: Sendable {
    let underwriting: UnderwritingOutputs
    /// Total cash required at close: down payment + closing costs + renovation total.
    let totalCashToClose: Decimal?
    /// Equity invested (down payment + closing; excludes renovation for return metrics).
    let equityInvested: Decimal?
    /// Total one-time renovation (sum of categories).
    let renovationTotal: Decimal?

    init(underwriting: UnderwritingOutputs, totalCashToClose: Decimal? = nil, equityInvested: Decimal? = nil, renovationTotal: Decimal? = nil) {
        self.underwriting = underwriting
        self.totalCashToClose = totalCashToClose
        self.equityInvested = equityInvested
        self.renovationTotal = renovationTotal
    }
}
