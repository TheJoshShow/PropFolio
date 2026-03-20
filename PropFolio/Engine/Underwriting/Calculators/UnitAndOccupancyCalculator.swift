//
//  UnitAndOccupancyCalculator.swift
//  PropFolio
//
//  Price per unit, price per sq ft, breakeven occupancy, 5-year equity paydown.
//

import Foundation

enum UnitAndOccupancyCalculator {
    /// Price per unit = purchase price / unit count. unitCount ≤ 0 → nil.
    static func pricePerUnit(purchasePrice: Decimal?, unitCount: Int?) -> Decimal? {
        guard let p = purchasePrice, let u = unitCount, u > 0 else { return nil }
        return p / Decimal(u)
    }

    /// Price per square foot = purchase price / square feet. squareFeet ≤ 0 → nil.
    static func pricePerSquareFoot(purchasePrice: Decimal?, squareFeet: Int?) -> Decimal? {
        guard let p = purchasePrice, let s = squareFeet, s > 0 else { return nil }
        return p / Decimal(s)
    }

    /// Breakeven occupancy = (OE + ADS) / (GSR + other income). Capped at 1.0. Denominator ≤ 0 → nil.
    static func breakevenOccupancy(
        operatingExpensesAnnual: Decimal?,
        annualDebtService: Decimal?,
        grossScheduledRentAnnual: Decimal?,
        otherIncomeAnnual: Decimal?
    ) -> Decimal? {
        guard let oe = operatingExpensesAnnual, let ads = annualDebtService,
              let gsr = grossScheduledRentAnnual else { return nil }
        let other = otherIncomeAnnual ?? 0
        let denominator = gsr + other
        guard denominator > 0 else { return nil }
        let ratio = (oe + ads) / denominator
        return min(1, max(0, ratio))
    }

    /// 5-year equity paydown = loan amount - balance at month 60. Missing loan/rate/term → nil.
    static func equityPaydown5Year(
        loanAmount: Decimal?,
        interestRateAnnual: Decimal?,
        termYears: Int?
    ) -> Decimal? {
        guard let loan = loanAmount, let rate = interestRateAnnual, let term = termYears,
              loan > 0, rate >= 0, term > 0 else { return nil }
        guard let pmt = Amortization.monthlyPayment(principal: loan, annualRate: rate, termYears: term) else { return nil }
        let months = min(60, term * 12)
        guard let balance = Amortization.balanceAfter(months: months, principal: loan, annualRate: rate, monthlyPayment: pmt) else { return nil }
        return loan - balance
    }
}
