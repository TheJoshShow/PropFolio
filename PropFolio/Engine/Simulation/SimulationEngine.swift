//
//  SimulationEngine.swift
//  PropFolio
//
//  Maps simulation inputs to underwriting inputs, runs underwriting, returns result.
//  Stable with incomplete inputs: no crashes; missing data yields nil metrics.
//

import Foundation

enum SimulationEngine {
    /// Run what-if simulation. Every call recomputes from inputs; safe with partial data.
    static func run(_ inputs: SimulationInputs) -> SimulationResult {
        let uw = toUnderwritingInputs(inputs)
        let outputs = UnderwritingEngine.calculate(uw)
        let (totalCash, equity, renoTotal) = cashMetrics(inputs)
        return SimulationResult(
            underwriting: outputs,
            totalCashToClose: totalCash,
            equityInvested: equity,
            renovationTotal: renoTotal
        )
    }

    // MARK: - Map simulation → underwriting

    static func toUnderwritingInputs(_ s: SimulationInputs) -> UnderwritingInputs {
        let purchasePrice = s.purchasePrice
        let loanAmount = loanAmount(from: s)
        let monthlyRent = monthlyRentTotal(from: s)
        let operatingExpenses = annualOperatingExpenses(from: s)

        return UnderwritingInputs(
            purchasePrice: purchasePrice,
            loanAmount: loanAmount,
            interestRateAnnual: s.interestRateAnnual,
            termYears: s.amortizationTermYears,
            annualDebtService: nil,
            monthlyRent: monthlyRent,
            grossScheduledRentAnnual: nil,
            vacancyPercent: s.vacancyRatePercent,
            otherIncomeAnnual: s.otherIncomeAnnual,
            operatingExpensesAnnual: operatingExpenses,
            unitCount: s.unitCount,
            squareFeet: s.squareFeet
        )
    }

    /// Loan = price - down payment. Down from amount (if set) or from percent of price. Never negative.
    private static func loanAmount(from s: SimulationInputs) -> Decimal? {
        guard let price = s.purchasePrice, price > 0 else { return nil }
        let down: Decimal?
        if let amount = s.downPaymentAmount, amount >= 0 {
            down = amount
        } else if let pct = s.downPaymentPercent, pct >= 0 {
            let clamped = min(100, pct)
            down = price * clamped / 100
        } else {
            down = nil
        }
        guard let d = down else { return nil }
        let loan = price - d
        return loan > 0 ? loan : nil
    }

    /// Total monthly rent = rentPerUnit × unitCount. Requires both.
    private static func monthlyRentTotal(from s: SimulationInputs) -> Decimal? {
        guard let perUnit = s.monthlyRentPerUnit, let units = s.unitCount, units > 0, perUnit >= 0 else { return nil }
        return perUnit * Decimal(units)
    }

    /// Sum of all operating expense line items. Nil items treated as 0; sum can be 0.
    private static func annualOperatingExpenses(from s: SimulationInputs) -> Decimal? {
        let items: [Decimal?] = [
            s.taxesAnnual,
            s.insuranceAnnual,
            s.propertyManagementAnnual,
            s.repairsAndMaintenanceAnnual,
            s.utilitiesAnnual,
            s.capitalReservesAnnual
        ]
        let sum = items.map { $0 ?? 0 }.reduce(0, +)
        return sum >= 0 ? sum : nil
    }

    /// Total cash to close, equity invested, renovation total. Uses renovationPlan (with tier) when set; else legacy renovationCosts.
    private static func cashMetrics(_ s: SimulationInputs) -> (totalCashToClose: Decimal?, equityInvested: Decimal?, renovationTotal: Decimal?) {
        let renoTotal: Decimal = {
            if let plan = s.renovationPlan {
                return plan.total(for: s.renovationEstimateTier)
            }
            return s.renovationCosts?.total ?? 0
        }()
        let renoOptional: Decimal? = renoTotal > 0 ? renoTotal : nil

        guard let price = s.purchasePrice, price > 0 else { return (nil, nil, renoOptional) }

        let down: Decimal?
        if let amount = s.downPaymentAmount, amount >= 0 {
            down = min(amount, price)
        } else if let pct = s.downPaymentPercent, pct >= 0 {
            let clamped = min(100, pct)
            down = price * clamped / 100
        } else {
            down = nil
        }

        guard let downPayment = down else { return (nil, nil, renoOptional) }

        let closing = (s.closingCosts ?? 0)
        let equity = downPayment + closing
        let totalCash = downPayment + closing + renoTotal
        return (totalCash, equity, renoOptional)
    }
}
