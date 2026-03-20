//
//  ReturnMultiplierCalculator.swift
//  PropFolio
//
//  Cap rate, cash on cash, GRM, expense ratio, break-even ratio, debt yield, LTV.
//

import Foundation

enum ReturnMultiplierCalculator {
    /// Cap rate = NOI / purchase price. purchasePrice ≤ 0 or missing → nil.
    static func capRate(noi: Decimal?, purchasePrice: Decimal?) -> Decimal? {
        guard let n = noi, let p = purchasePrice, p > 0 else { return nil }
        return n / p
    }

    /// Cash on cash = annual cash flow / equity. equity = purchasePrice - loanAmount. equity ≤ 0 → nil.
    static func cashOnCashReturn(annualCashFlow: Decimal?, purchasePrice: Decimal?, loanAmount: Decimal?) -> Decimal? {
        guard let cf = annualCashFlow, let p = purchasePrice, let l = loanAmount else { return nil }
        let equity = p - l
        guard equity > 0 else { return nil }
        return cf / equity
    }

    /// GRM = purchase price / GSR (annual). GSR ≤ 0 or price ≤ 0 → nil.
    static func grm(purchasePrice: Decimal?, grossScheduledRentAnnual: Decimal?) -> Decimal? {
        guard let p = purchasePrice, let g = grossScheduledRentAnnual, p > 0, g > 0 else { return nil }
        return p / g
    }

    /// Expense ratio = operating expenses / EGI. EGI ≤ 0 → nil.
    static func expenseRatio(operatingExpensesAnnual: Decimal?, effectiveGrossIncome: Decimal?) -> Decimal? {
        guard let oe = operatingExpensesAnnual, let egi = effectiveGrossIncome, egi > 0 else { return nil }
        return oe / egi
    }

    /// Break-even ratio = (OE + ADS) / EGI. EGI ≤ 0 → nil.
    static func breakEvenRatio(
        operatingExpensesAnnual: Decimal?,
        annualDebtService: Decimal?,
        effectiveGrossIncome: Decimal?
    ) -> Decimal? {
        guard let oe = operatingExpensesAnnual, let ads = annualDebtService, let egi = effectiveGrossIncome, egi > 0 else { return nil }
        return (oe + ads) / egi
    }

    /// Debt yield = NOI / loan amount. loanAmount ≤ 0 → nil.
    static func debtYield(noi: Decimal?, loanAmount: Decimal?) -> Decimal? {
        guard let n = noi, let l = loanAmount, l > 0 else { return nil }
        return n / l
    }

    /// LTV = loan amount / purchase price. purchasePrice ≤ 0 → nil.
    static func ltv(loanAmount: Decimal?, purchasePrice: Decimal?) -> Decimal? {
        guard let l = loanAmount, let p = purchasePrice, p > 0 else { return nil }
        return l / p
    }
}
