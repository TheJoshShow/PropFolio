//
//  DebtAndCashFlowCalculator.swift
//  PropFolio
//
//  ADS (input or derived), monthly/annual cash flow, DSCR.
//

import Foundation

enum DebtAndCashFlowCalculator {
    /// Annual Debt Service: use input if provided; else derive from loan/rate/term. Invalid → nil.
    static func annualDebtService(
        input: Decimal?,
        loanAmount: Decimal?,
        interestRateAnnual: Decimal?,
        termYears: Int?
    ) -> Decimal? {
        if let ads = input, ads >= 0 { return ads }
        guard let loan = loanAmount, let rate = interestRateAnnual, let term = termYears,
              loan > 0, term > 0, rate >= 0 else { return nil }
        return Amortization.annualDebtService(principal: loan, annualRate: rate, termYears: term)
    }

    /// Monthly cash flow = (NOI - ADS) / 12. Either missing → nil.
    static func monthlyCashFlow(noi: Decimal?, annualDebtService ads: Decimal?) -> Decimal? {
        guard let n = noi, let a = ads else { return nil }
        return (n - a) / 12
    }

    /// Annual cash flow = NOI - ADS. Either missing → nil.
    static func annualCashFlow(noi: Decimal?, annualDebtService ads: Decimal?) -> Decimal? {
        guard let n = noi, let a = ads else { return nil }
        return n - a
    }

    /// DSCR = NOI / ADS. ADS ≤ 0 or missing → nil.
    static func dscr(noi: Decimal?, annualDebtService ads: Decimal?) -> Decimal? {
        guard let n = noi, let a = ads, a > 0 else { return nil }
        return n / a
    }
}
