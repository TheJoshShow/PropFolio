//
//  ScenarioComparison.swift
//  PropFolio
//
//  Side-by-side comparison of two scenarios (e.g. baseline vs what-if).
//

import Foundation

/// Result of comparing two scenarios: left (e.g. baseline) and right (e.g. comparison), plus optional deltas.
struct ScenarioComparison: Sendable {
    let left: Scenario
    let right: Scenario
    let resultLeft: SimulationResult
    let resultRight: SimulationResult

    init(left: Scenario, right: Scenario, resultLeft: SimulationResult, resultRight: SimulationResult) {
        self.left = left
        self.right = right
        self.resultLeft = resultLeft
        self.resultRight = resultRight
    }

    /// Delta for a numeric metric: right - left. Nil if either value is nil.
    func delta(metric: ComparisonMetric) -> Decimal? {
        let a = value(for: metric, result: resultLeft)
        let b = value(for: metric, result: resultRight)
        guard let va = a, let vb = b else { return nil }
        return vb - va
    }

    private func value(for metric: ComparisonMetric, result: SimulationResult) -> Decimal? {
        switch metric {
        case .noi: return result.underwriting.noi
        case .capRate: return result.underwriting.capRate
        case .monthlyCashFlow: return result.underwriting.monthlyCashFlow
        case .annualCashFlow: return result.underwriting.annualCashFlow
        case .dscr: return result.underwriting.dscr
        case .cashOnCashReturn: return result.underwriting.cashOnCashReturn
        case .totalCashToClose: return result.totalCashToClose
        case .equityInvested: return result.equityInvested
        }
    }
}

enum ComparisonMetric: String, CaseIterable, Sendable {
    case noi
    case capRate
    case monthlyCashFlow
    case annualCashFlow
    case dscr
    case cashOnCashReturn
    case totalCashToClose
    case equityInvested
}
