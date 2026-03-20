//
//  DealScoreResult.swift
//  PropFolio
//
//  Result of deal scoring: total score, band, sub-scores, and explanation.
//

import Foundation

/// Score band for display.
enum DealScoreBand: String, Sendable {
    case exceptional  // 90–100
    case strong       // 75–89
    case good         // 60–74
    case fair         // 45–59
    case weak         // 30–44
    case poor         // 0–29
    case insufficientData

    /// Band from numeric score (0–100). Use when reconstructing from stored score (e.g. portfolio).
    static func from(score: Decimal) -> DealScoreBand {
        let s = (score as NSDecimalNumber).doubleValue
        if s >= 90 { return .exceptional }
        if s >= 75 { return .strong }
        if s >= 60 { return .good }
        if s >= 45 { return .fair }
        if s >= 30 { return .weak }
        return .poor
    }
}

/// One component: name, raw value, sub-score 0–100, weight, contribution to total.
struct DealScoreComponent: Sendable {
    let id: DealScoreFactor
    let rawValue: String?
    let subScore: Decimal
    let weight: Decimal
    let contribution: Decimal
}

/// Factors used in scoring (for sub-score lookup and explanation).
enum DealScoreFactor: String, CaseIterable, Sendable {
    case capRate
    case monthlyCashFlow
    case annualCashFlow
    case cashOnCashReturn
    case dscr
    case expenseRatio
    case vacancySensitivity
    case renovationBurden
    case purchaseDiscount
    case rentCoverageStrength
    case dataConfidence
    case marketTailwinds
    case downsideResilience
}

/// Result of deal scoring.
struct DealScoreResult: Sendable {
    /// 0–100; nil when insufficient data.
    let totalScore: Decimal?
    let band: DealScoreBand
    /// Sub-scores that were present; contribution = subScore × weight (before renormalization).
    let components: [DealScoreComponent]
    /// Whether score was capped by low data confidence.
    let wasCappedByConfidence: Bool
    /// Human-readable summary (why this score).
    let explanationSummary: String
}
