//
//  ConfidenceMeterInputs.swift
//  PropFolio
//
//  Inputs for the Confidence Meter: how grounded and dependable the analysis is.
//  All confidence/certainty values 0–1 (higher = more confidence). Optional; missing = excluded from score.
//

import Foundation

/// Inputs to the Confidence Meter. Each factor 0–1 except manualOverrideCount.
struct ConfidenceMeterInputs: Sendable {
    /// Completeness of imported property data (address, units, sq ft, etc.). 0–1.
    var propertyDataCompleteness: Decimal?

    /// Confidence in rent estimates (source, recency, comparables). 0–1.
    var rentEstimateConfidence: Decimal?

    /// Confidence in expense assumptions (taxes, insurance, maintenance, etc.). 0–1.
    var expenseAssumptionsConfidence: Decimal?

    /// Certainty around renovation budget (quotes, scope, contingency). 0–1.
    var renovationBudgetCertainty: Decimal?

    /// Stability of financing assumptions (rate lock, terms, lender). 0–1.
    var financingAssumptionsStability: Decimal?

    /// Reliability and freshness of market data (comps, trends). 0–1.
    var marketDataReliabilityFreshness: Decimal?

    /// Number of assumptions the user manually overrode. More overrides → lower confidence. Used to derive a 0–1 score.
    var manualOverrideCount: Int?

    init(
        propertyDataCompleteness: Decimal? = nil,
        rentEstimateConfidence: Decimal? = nil,
        expenseAssumptionsConfidence: Decimal? = nil,
        renovationBudgetCertainty: Decimal? = nil,
        financingAssumptionsStability: Decimal? = nil,
        marketDataReliabilityFreshness: Decimal? = nil,
        manualOverrideCount: Int? = nil
    ) {
        self.propertyDataCompleteness = propertyDataCompleteness
        self.rentEstimateConfidence = rentEstimateConfidence
        self.expenseAssumptionsConfidence = expenseAssumptionsConfidence
        self.renovationBudgetCertainty = renovationBudgetCertainty
        self.financingAssumptionsStability = financingAssumptionsStability
        self.marketDataReliabilityFreshness = marketDataReliabilityFreshness
        self.manualOverrideCount = manualOverrideCount
    }
}
