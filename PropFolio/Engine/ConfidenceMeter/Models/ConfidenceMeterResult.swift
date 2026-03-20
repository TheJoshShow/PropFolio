//
//  ConfidenceMeterResult.swift
//  PropFolio
//
//  Output of the Confidence Meter: score, band, explanation, and recommended actions.
//

import Foundation

/// Confidence band for the meter (aligned with ConfidenceGrade for UI).
enum ConfidenceMeterBand: String, Sendable {
    case high    // 75–100
    case medium  // 50–74
    case low     // 25–49
    case veryLow // 0–24
}

/// Result of the Confidence Meter.
struct ConfidenceMeterResult: Sendable {
    /// 0–100: how confident PropFolio is that the analysis is grounded and dependable.
    let score: Decimal
    let band: ConfidenceMeterBand
    /// User-facing explanation: what is increasing or decreasing confidence.
    let explanation: ConfidenceMeterExplanation
    /// Recommended next actions to improve confidence.
    let recommendedActions: [String]
}

/// Structured explanation: what helps and what hurts.
struct ConfidenceMeterExplanation: Sendable {
    /// Factors that are supporting confidence (e.g. "Rent estimate from verified source").
    let supportingFactors: [String]
    /// Factors that are reducing confidence (e.g. "Several inputs were manually overridden").
    let limitingFactors: [String]
    /// One-line summary for teaser or header.
    let summary: String
}

/// Factor IDs for mapping to copy and weights.
enum ConfidenceMeterFactor: String, CaseIterable, Sendable {
    case propertyDataCompleteness
    case rentEstimateConfidence
    case expenseAssumptionsConfidence
    case renovationBudgetCertainty
    case financingAssumptionsStability
    case marketDataReliabilityFreshness
    case manualOverrideImpact
}
