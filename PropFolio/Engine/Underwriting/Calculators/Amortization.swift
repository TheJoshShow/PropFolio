//
//  Amortization.swift
//  PropFolio
//
//  Pure functions for loan amortization. Decimal-based; no side effects.
//

import Foundation

/// Decimal power for positive integer exponent (deterministic, no Float).
private func decimalPow(_ base: Decimal, _ exp: Int) -> Decimal {
    guard exp > 0 else { return exp == 0 ? 1 : 0 }
    var result: Decimal = 1
    var b = base
    var e = exp
    while e > 0 {
        if e % 2 == 1 { result *= b }
        b *= b
        e /= 2
    }
    return result
}

enum Amortization {
    /// Monthly payment (P&I): P * (r(1+r)^n) / ((1+r)^n - 1).
    /// - Parameters:
    ///   - principal: Loan amount (P).
    ///   - annualRate: Annual interest rate as decimal (e.g. 0.065).
    ///   - termYears: Loan term in years.
    /// - Returns: Monthly payment, or nil if invalid inputs (principal ≤ 0, term ≤ 0, or rate < 0).
    static func monthlyPayment(principal: Decimal, annualRate: Decimal, termYears: Int) -> Decimal? {
        guard principal > 0, termYears > 0, annualRate >= 0 else { return nil }
        let n = termYears * 12
        let r = annualRate / 12
        if r == 0 { return principal / Decimal(n) }
        // (1+r)^n
        let onePlusR = 1 + r
        let onePlusRPowN = decimalPow(onePlusR, n)
        let numerator = principal * r * onePlusRPowN
        let denominator = onePlusRPowN - 1
        guard denominator != 0 else { return nil }
        return numerator / denominator
    }

    /// Outstanding balance after k months (0-indexed). Payment is the fixed monthly P&I.
    static func balanceAfter(months: Int, principal: Decimal, annualRate: Decimal, monthlyPayment: Decimal) -> Decimal? {
        guard principal >= 0, months >= 0 else { return nil }
        if months == 0 { return principal }
        let r = annualRate / 12
        if r == 0 {
            let paid = monthlyPayment * Decimal(months)
            return max(0, principal - paid)
        }
        // B_k = P(1+r)^k - PMT * (((1+r)^k - 1) / r)
        let onePlusR = 1 + r
        let onePlusRPowK = decimalPow(onePlusR, months)
        let first = principal * onePlusRPowK
        let second = monthlyPayment * ((onePlusRPowK - 1) / r)
        let bal = first - second
        return max(0, bal)
    }

    /// Annual debt service = monthly payment × 12. Returns nil if monthly payment cannot be computed.
    static func annualDebtService(principal: Decimal, annualRate: Decimal, termYears: Int) -> Decimal? {
        guard let pmt = monthlyPayment(principal: principal, annualRate: annualRate, termYears: termYears) else { return nil }
        return pmt * 12
    }
}
