//
//  ConfidenceMeterInputs+Builders.swift
//  PropFolio
//
//  Build ConfidenceMeterInputs from property/import/simulation context (optional).
//

import Foundation

extension ConfidenceMeterInputs {
    /// Build from normalized property and override count. Maps completeness and rent/expense confidence from available metadata.
    static func from(
        propertyDataCompleteness: Decimal? = nil,
        rentEstimateConfidence: Decimal? = nil,
        expenseAssumptionsConfidence: Decimal? = nil,
        renovationBudgetCertainty: Decimal? = nil,
        financingAssumptionsStability: Decimal? = nil,
        marketDataReliabilityFreshness: Decimal? = nil,
        manualOverrideCount: Int? = nil
    ) -> ConfidenceMeterInputs {
        ConfidenceMeterInputs(
            propertyDataCompleteness: propertyDataCompleteness,
            rentEstimateConfidence: rentEstimateConfidence,
            expenseAssumptionsConfidence: expenseAssumptionsConfidence,
            renovationBudgetCertainty: renovationBudgetCertainty,
            financingAssumptionsStability: financingAssumptionsStability,
            marketDataReliabilityFreshness: marketDataReliabilityFreshness,
            manualOverrideCount: manualOverrideCount
        )
    }
}
