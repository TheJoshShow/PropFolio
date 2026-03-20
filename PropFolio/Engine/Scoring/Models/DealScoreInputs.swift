//
//  DealScoreInputs.swift
//  PropFolio
//
//  All inputs to the deal scoring engine. Optional; missing inputs omit from sub-scores or trigger guardrails.
//

import Foundation

/// Inputs for deal score (0–100). All optional; decimals as specified in DEAL-SCORING-SPEC.
struct DealScoreInputs: Sendable {
    /// Cap rate (e.g. 0.06). Required for valid score if no cash flow.
    var capRate: Decimal?
    /// Monthly cash flow (USD).
    var monthlyCashFlow: Decimal?
    /// Annual cash flow (USD).
    var annualCashFlow: Decimal?
    /// Cash on cash return (e.g. 0.05).
    var cashOnCashReturn: Decimal?
    /// DSCR (e.g. 1.25). Required.
    var dscr: Decimal?
    /// Expense ratio (e.g. 0.45).
    var expenseRatio: Decimal?
    /// Breakeven occupancy 0–1 (e.g. 0.85). Lower = better.
    var breakevenOccupancy: Decimal?
    /// Renovation total / purchase price or total cash (e.g. 0.05). Lower = better.
    var renovationBurdenRatio: Decimal?
    /// (Est. value − price) / value (e.g. 0.10). Optional.
    var purchaseDiscountVsValue: Decimal?
    /// GSR / ADS. Optional.
    var rentCoverageStrength: Decimal?
    /// Data confidence 0–1. Required; used as guardrail.
    var dataConfidence: Decimal?
    /// Market tailwinds 0–100 or 0–1. Optional.
    var marketTailwinds: Decimal?
    /// Stress scenario DSCR (e.g. after 5% rent drop). Optional.
    var stressDSCR: Decimal?

    init(
        capRate: Decimal? = nil,
        monthlyCashFlow: Decimal? = nil,
        annualCashFlow: Decimal? = nil,
        cashOnCashReturn: Decimal? = nil,
        dscr: Decimal? = nil,
        expenseRatio: Decimal? = nil,
        breakevenOccupancy: Decimal? = nil,
        renovationBurdenRatio: Decimal? = nil,
        purchaseDiscountVsValue: Decimal? = nil,
        rentCoverageStrength: Decimal? = nil,
        dataConfidence: Decimal? = nil,
        marketTailwinds: Decimal? = nil,
        stressDSCR: Decimal? = nil
    ) {
        self.capRate = capRate
        self.monthlyCashFlow = monthlyCashFlow
        self.annualCashFlow = annualCashFlow
        self.cashOnCashReturn = cashOnCashReturn
        self.dscr = dscr
        self.expenseRatio = expenseRatio
        self.breakevenOccupancy = breakevenOccupancy
        self.renovationBurdenRatio = renovationBurdenRatio
        self.purchaseDiscountVsValue = purchaseDiscountVsValue
        self.rentCoverageStrength = rentCoverageStrength
        self.dataConfidence = dataConfidence
        self.marketTailwinds = marketTailwinds
        self.stressDSCR = stressDSCR
    }
}
