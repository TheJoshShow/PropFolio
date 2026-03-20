//
//  UnderwritingEngine.swift
//  PropFolio
//
//  Single entry point: calculate(inputs) → outputs. All formulas in domain calculators.
//

import Foundation

enum UnderwritingEngine {
    /// Compute all underwriting metrics from inputs. Nil outputs where required inputs are missing.
    static func calculate(_ inputs: UnderwritingInputs) -> UnderwritingOutputs {
        // Income flow
        let gsr = IncomeFlowCalculator.grossScheduledRentAnnual(
            monthlyRent: inputs.monthlyRent,
            grossScheduledRentAnnual: inputs.grossScheduledRentAnnual
        )
        let vacancyAdjusted = IncomeFlowCalculator.vacancyAdjustedGrossIncome(
            grossScheduledRentAnnual: gsr,
            vacancyPercent: inputs.vacancyPercent
        )
        let otherIncome = IncomeFlowCalculator.otherIncomeAnnual(inputs.otherIncomeAnnual)
        let egi = IncomeFlowCalculator.effectiveGrossIncome(
            vacancyAdjustedGrossIncome: vacancyAdjusted,
            otherIncomeAnnual: inputs.otherIncomeAnnual
        )
        let oe = IncomeFlowCalculator.operatingExpensesAnnual(inputs.operatingExpensesAnnual)
        let noi = IncomeFlowCalculator.noi(effectiveGrossIncome: egi, operatingExpensesAnnual: oe)

        // Debt service (input or derived)
        let ads = DebtAndCashFlowCalculator.annualDebtService(
            input: inputs.annualDebtService,
            loanAmount: inputs.loanAmount,
            interestRateAnnual: inputs.interestRateAnnual,
            termYears: inputs.termYears
        )

        // Cash flow & DSCR
        let monthlyCf = DebtAndCashFlowCalculator.monthlyCashFlow(noi: noi, annualDebtService: ads)
        let annualCf = DebtAndCashFlowCalculator.annualCashFlow(noi: noi, annualDebtService: ads)
        let dscr = DebtAndCashFlowCalculator.dscr(noi: noi, annualDebtService: ads)

        // Returns & multipliers
        let capRate = ReturnMultiplierCalculator.capRate(noi: noi, purchasePrice: inputs.purchasePrice)
        let coc = ReturnMultiplierCalculator.cashOnCashReturn(
            annualCashFlow: annualCf,
            purchasePrice: inputs.purchasePrice,
            loanAmount: inputs.loanAmount
        )
        let grm = ReturnMultiplierCalculator.grm(purchasePrice: inputs.purchasePrice, grossScheduledRentAnnual: gsr)
        let expenseRatio = ReturnMultiplierCalculator.expenseRatio(operatingExpensesAnnual: oe, effectiveGrossIncome: egi)
        let breakEvenRatio = ReturnMultiplierCalculator.breakEvenRatio(
            operatingExpensesAnnual: oe,
            annualDebtService: ads,
            effectiveGrossIncome: egi
        )
        let debtYield = ReturnMultiplierCalculator.debtYield(noi: noi, loanAmount: inputs.loanAmount)
        let ltv = ReturnMultiplierCalculator.ltv(loanAmount: inputs.loanAmount, purchasePrice: inputs.purchasePrice)

        // Per-unit / per-SF
        let pricePerUnit = UnitAndOccupancyCalculator.pricePerUnit(purchasePrice: inputs.purchasePrice, unitCount: inputs.unitCount)
        let pricePerSqFt = UnitAndOccupancyCalculator.pricePerSquareFoot(purchasePrice: inputs.purchasePrice, squareFeet: inputs.squareFeet)

        // Occupancy & paydown
        let breakevenOcc = UnitAndOccupancyCalculator.breakevenOccupancy(
            operatingExpensesAnnual: oe,
            annualDebtService: ads,
            grossScheduledRentAnnual: gsr,
            otherIncomeAnnual: inputs.otherIncomeAnnual
        )
        let paydown5 = UnitAndOccupancyCalculator.equityPaydown5Year(
            loanAmount: inputs.loanAmount,
            interestRateAnnual: inputs.interestRateAnnual,
            termYears: inputs.termYears
        )

        return UnderwritingOutputs(
            grossScheduledRentAnnual: gsr,
            vacancyAdjustedGrossIncome: vacancyAdjusted,
            otherIncomeAnnual: otherIncome > 0 ? otherIncome : nil,
            effectiveGrossIncome: egi,
            operatingExpensesAnnual: oe,
            noi: noi,
            annualDebtService: ads,
            monthlyCashFlow: monthlyCf,
            annualCashFlow: annualCf,
            dscr: dscr,
            capRate: capRate,
            cashOnCashReturn: coc,
            grm: grm,
            expenseRatio: expenseRatio,
            breakEvenRatio: breakEvenRatio,
            debtYield: debtYield,
            ltv: ltv,
            pricePerUnit: pricePerUnit,
            pricePerSquareFoot: pricePerSqFt,
            breakevenOccupancy: breakevenOcc,
            equityPaydown5Year: paydown5,
            irrPlaceholder: .requiresExplicitSchedule
        )
    }
}
