//
//  IncomeFlowCalculator.swift
//  PropFolio
//
//  GSR, vacancy-adjusted gross income, other income, EGI, operating expenses, NOI.
//  All amounts annual USD. Missing required inputs → nil.
//

import Foundation

enum IncomeFlowCalculator {
    /// Gross Scheduled Rent: grossScheduledRentAnnual if set, else monthlyRent × 12. Negative → nil.
    static func grossScheduledRentAnnual(monthlyRent: Decimal?, grossScheduledRentAnnual input: Decimal?) -> Decimal? {
        if let g = input, g >= 0 { return g }
        guard let m = monthlyRent, m >= 0 else { return nil }
        return m * 12
    }

    /// Vacancy percent clamped to [0, 100]. Missing → 0.
    static func vacancyMultiplier(vacancyPercent: Decimal?) -> Decimal {
        guard let v = vacancyPercent else { return 1 }
        let clamped = min(100, max(0, v))
        return 1 - (clamped / 100)
    }

    /// Vacancy-adjusted gross income = GSR × (1 - vacancy/100). Missing GSR → nil.
    static func vacancyAdjustedGrossIncome(grossScheduledRentAnnual gsr: Decimal?, vacancyPercent: Decimal?) -> Decimal? {
        guard let g = gsr, g >= 0 else { return nil }
        return g * vacancyMultiplier(vacancyPercent: vacancyPercent)
    }

    /// Other income; negative → 0.
    static func otherIncomeAnnual(_ input: Decimal?) -> Decimal {
        guard let x = input, x >= 0 else { return 0 }
        return x
    }

    /// EGI = vacancy-adjusted gross + other income. Missing adjusted → nil.
    static func effectiveGrossIncome(vacancyAdjustedGrossIncome: Decimal?, otherIncomeAnnual: Decimal?) -> Decimal? {
        guard let v = vacancyAdjustedGrossIncome else { return nil }
        return v + otherIncomeAnnual(otherIncomeAnnual)
    }

    /// Operating expenses; negative → nil.
    static func operatingExpensesAnnual(_ input: Decimal?) -> Decimal? {
        guard let x = input else { return nil }
        return x >= 0 ? x : nil
    }

    /// NOI = EGI - operating expenses. Either missing → nil.
    static func noi(effectiveGrossIncome egi: Decimal?, operatingExpensesAnnual oe: Decimal?) -> Decimal? {
        guard let e = egi, let o = oe else { return nil }
        return e - o
    }
}
