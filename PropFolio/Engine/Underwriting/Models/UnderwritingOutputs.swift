//
//  UnderwritingOutputs.swift
//  PropFolio
//
//  All computed underwriting metrics. Nil when required inputs are missing.
//  Money in USD; ratios as decimals (e.g. 0.06 = 6%).
//

import Foundation

/// Result of running the underwriting engine. All values optional; nil = missing inputs or invalid.
struct UnderwritingOutputs: Sendable {
    // Income & expense flow
    var grossScheduledRentAnnual: Decimal?
    var vacancyAdjustedGrossIncome: Decimal?
    var otherIncomeAnnual: Decimal?
    var effectiveGrossIncome: Decimal?
    var operatingExpensesAnnual: Decimal?
    var noi: Decimal?

    // Debt & cash flow
    var annualDebtService: Decimal?
    var monthlyCashFlow: Decimal?
    var annualCashFlow: Decimal?
    var dscr: Decimal?

    // Returns & multipliers
    var capRate: Decimal?
    var cashOnCashReturn: Decimal?
    var grm: Decimal?
    var expenseRatio: Decimal?
    var breakEvenRatio: Decimal?
    var debtYield: Decimal?
    var ltv: Decimal?

    // Per-unit / per-SF
    var pricePerUnit: Decimal?
    var pricePerSquareFoot: Decimal?

    // Occupancy & paydown
    var breakevenOccupancy: Decimal?
    var equityPaydown5Year: Decimal?
    /// IRR: scaffolding only; nil with reason when explicit schedule not provided.
    var irrPlaceholder: IRRPlaceholder?

    init(
        grossScheduledRentAnnual: Decimal? = nil,
        vacancyAdjustedGrossIncome: Decimal? = nil,
        otherIncomeAnnual: Decimal? = nil,
        effectiveGrossIncome: Decimal? = nil,
        operatingExpensesAnnual: Decimal? = nil,
        noi: Decimal? = nil,
        annualDebtService: Decimal? = nil,
        monthlyCashFlow: Decimal? = nil,
        annualCashFlow: Decimal? = nil,
        dscr: Decimal? = nil,
        capRate: Decimal? = nil,
        cashOnCashReturn: Decimal? = nil,
        grm: Decimal? = nil,
        expenseRatio: Decimal? = nil,
        breakEvenRatio: Decimal? = nil,
        debtYield: Decimal? = nil,
        ltv: Decimal? = nil,
        pricePerUnit: Decimal? = nil,
        pricePerSquareFoot: Decimal? = nil,
        breakevenOccupancy: Decimal? = nil,
        equityPaydown5Year: Decimal? = nil,
        irrPlaceholder: IRRPlaceholder? = nil
    ) {
        self.grossScheduledRentAnnual = grossScheduledRentAnnual
        self.vacancyAdjustedGrossIncome = vacancyAdjustedGrossIncome
        self.otherIncomeAnnual = otherIncomeAnnual
        self.effectiveGrossIncome = effectiveGrossIncome
        self.operatingExpensesAnnual = operatingExpensesAnnual
        self.noi = noi
        self.annualDebtService = annualDebtService
        self.monthlyCashFlow = monthlyCashFlow
        self.annualCashFlow = annualCashFlow
        self.dscr = dscr
        self.capRate = capRate
        self.cashOnCashReturn = cashOnCashReturn
        self.grm = grm
        self.expenseRatio = expenseRatio
        self.breakEvenRatio = breakEvenRatio
        self.debtYield = debtYield
        self.ltv = ltv
        self.pricePerUnit = pricePerUnit
        self.pricePerSquareFoot = pricePerSquareFoot
        self.breakevenOccupancy = breakevenOccupancy
        self.equityPaydown5Year = equityPaydown5Year
        self.irrPlaceholder = irrPlaceholder
    }
}

/// IRR is not computed in MVP; requires explicit cash flow schedule.
enum IRRPlaceholder: Sendable {
    case requiresExplicitSchedule
}
