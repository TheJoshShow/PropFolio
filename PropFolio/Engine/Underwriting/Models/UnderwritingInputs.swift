//
//  UnderwritingInputs.swift
//  PropFolio
//
//  All inputs to the underwriting engine. Use Decimal for money. Optional fields;
//  missing data causes dependent metrics to be nil per UNDERWRITING-FORMULA-SPEC.
//

import Foundation

/// Inputs for investment calculations. All amounts in USD; rates as decimals (e.g. 0.065 = 6.5%).
struct UnderwritingInputs: Sendable {
    // MARK: - Purchase / value
    /// Purchase price or value used for cap rate, LTV, GRM, price per unit/SF.
    var purchasePrice: Decimal?

    // MARK: - Financing
    /// Loan amount (used for LTV, debt yield, equity = purchasePrice - loanAmount).
    var loanAmount: Decimal?
    /// Annual interest rate (e.g. 0.065). Used to derive ADS and 5-year paydown if annualDebtService not provided.
    var interestRateAnnual: Decimal?
    /// Loan term in years. Used with loanAmount and rate to derive ADS and balance at 60 months.
    var termYears: Int?
    /// If set, used as Annual Debt Service instead of deriving from loan/rate/term.
    var annualDebtService: Decimal?

    // MARK: - Income
    /// Monthly gross rent (× 12 = GSR). Ignored if grossScheduledRentAnnual is set.
    var monthlyRent: Decimal?
    /// Annual gross scheduled rent. If set, used as GSR; else monthlyRent × 12.
    var grossScheduledRentAnnual: Decimal?
    /// Vacancy allowance, 0–100. Default 0.
    var vacancyPercent: Decimal?
    /// Other income (laundry, parking, etc.) per year. Default 0.
    var otherIncomeAnnual: Decimal?

    // MARK: - Expenses
    /// Total operating expenses per year.
    var operatingExpensesAnnual: Decimal?

    // MARK: - Property
    /// Number of units (for price per unit).
    var unitCount: Int?
    /// Square footage (for price per sq ft).
    var squareFeet: Int?

    init(
        purchasePrice: Decimal? = nil,
        loanAmount: Decimal? = nil,
        interestRateAnnual: Decimal? = nil,
        termYears: Int? = nil,
        annualDebtService: Decimal? = nil,
        monthlyRent: Decimal? = nil,
        grossScheduledRentAnnual: Decimal? = nil,
        vacancyPercent: Decimal? = nil,
        otherIncomeAnnual: Decimal? = nil,
        operatingExpensesAnnual: Decimal? = nil,
        unitCount: Int? = nil,
        squareFeet: Int? = nil
    ) {
        self.purchasePrice = purchasePrice
        self.loanAmount = loanAmount
        self.interestRateAnnual = interestRateAnnual
        self.termYears = termYears
        self.annualDebtService = annualDebtService
        self.monthlyRent = monthlyRent
        self.grossScheduledRentAnnual = grossScheduledRentAnnual
        self.vacancyPercent = vacancyPercent
        self.otherIncomeAnnual = otherIncomeAnnual
        self.operatingExpensesAnnual = operatingExpensesAnnual
        self.unitCount = unitCount
        self.squareFeet = squareFeet
    }
}
