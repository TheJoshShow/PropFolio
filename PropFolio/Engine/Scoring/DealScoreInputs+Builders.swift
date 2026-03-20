//
//  DealScoreInputs+Builders.swift
//  PropFolio
//
//  Build DealScoreInputs from underwriting + simulation + optional confidence/tailwinds/stress.
//

import Foundation

extension DealScoreInputs {
    /// Build scoring inputs from underwriting outputs, optional simulation result, and optional extras.
    static func from(
        underwriting: UnderwritingOutputs,
        totalCashToClose: Decimal? = nil,
        renovationTotal: Decimal? = nil,
        purchasePrice: Decimal? = nil,
        dataConfidence: Decimal? = nil,
        marketTailwinds: Decimal? = nil,
        stressDSCR: Decimal? = nil,
        purchaseDiscountVsValue: Decimal? = nil
    ) -> DealScoreInputs {
        var rentCoverage: Decimal?
        if let gsr = underwriting.grossScheduledRentAnnual, let ads = underwriting.annualDebtService, ads > 0 {
            rentCoverage = gsr / ads
        }

        var renovationBurden: Decimal?
        if let reno = renovationTotal, reno > 0 {
            let denom = totalCashToClose ?? purchasePrice ?? 1
            if denom > 0 { renovationBurden = reno / denom }
        }

        return DealScoreInputs(
            capRate: underwriting.capRate,
            monthlyCashFlow: underwriting.monthlyCashFlow,
            annualCashFlow: underwriting.annualCashFlow,
            cashOnCashReturn: underwriting.cashOnCashReturn,
            dscr: underwriting.dscr,
            expenseRatio: underwriting.expenseRatio,
            breakevenOccupancy: underwriting.breakevenOccupancy,
            renovationBurdenRatio: renovationBurden,
            purchaseDiscountVsValue: purchaseDiscountVsValue,
            rentCoverageStrength: rentCoverage,
            dataConfidence: dataConfidence,
            marketTailwinds: marketTailwinds,
            stressDSCR: stressDSCR
        )
    }

    /// Build from SimulationResult (underwriting + total cash + reno) and optional confidence/tailwinds/stress/discount.
    static func from(
        simulationResult: SimulationResult,
        purchasePrice: Decimal? = nil,
        dataConfidence: Decimal? = nil,
        marketTailwinds: Decimal? = nil,
        stressDSCR: Decimal? = nil,
        purchaseDiscountVsValue: Decimal? = nil
    ) -> DealScoreInputs {
        from(
            underwriting: simulationResult.underwriting,
            totalCashToClose: simulationResult.totalCashToClose,
            renovationTotal: simulationResult.renovationTotal,
            purchasePrice: purchasePrice,
            dataConfidence: dataConfidence,
            marketTailwinds: marketTailwinds,
            stressDSCR: stressDSCR,
            purchaseDiscountVsValue: purchaseDiscountVsValue
        )
    }
}
