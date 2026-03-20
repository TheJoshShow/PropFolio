//
//  UnderwritingEngineTests.swift
//  PropFolioTests
//
//  Deterministic unit tests for underwriting formulas and engine.
//

import XCTest
@testable import PropFolio

final class UnderwritingEngineTests: XCTestCase {

    // MARK: - Amortization

    func testMonthlyPayment_zeroRate() {
        let pmt = Amortization.monthlyPayment(principal: 100_000, annualRate: 0, termYears: 30)
        XCTAssertNotNil(pmt)
        assertEqual(pmt, 100_000 / 360, accuracy: 0.01)
    }

    func testMonthlyPayment_positiveRate() {
        let pmt = Amortization.monthlyPayment(principal: 400_000, annualRate: 0.065, termYears: 30)
        XCTAssertNotNil(pmt)
        // ~$2,528/month
        XCTAssertTrue((pmt ?? 0) > 2500 && (pmt ?? 0) < 2600)
    }

    func testMonthlyPayment_invalidInputs() {
        XCTAssertNil(Amortization.monthlyPayment(principal: 0, annualRate: 0.06, termYears: 30))
        XCTAssertNil(Amortization.monthlyPayment(principal: 100_000, annualRate: 0.06, termYears: 0))
        XCTAssertNil(Amortization.monthlyPayment(principal: 100_000, annualRate: -0.01, termYears: 30))
    }

    func testBalanceAfter60Months() {
        let principal: Decimal = 400_000
        let rate: Decimal = 0.065
        let term = 30
        guard let pmt = Amortization.monthlyPayment(principal: principal, annualRate: rate, termYears: term),
              let bal = Amortization.balanceAfter(months: 60, principal: principal, annualRate: rate, monthlyPayment: pmt) else {
            XCTFail("Expected non-nil payment and balance")
            return
        }
        XCTAssertTrue(bal < principal)
        XCTAssertTrue(bal > 350_000) // After 5 years, balance still most of loan
    }

    func testAnnualDebtService_derived() {
        let ads = Amortization.annualDebtService(principal: 400_000, annualRate: 0.065, termYears: 30)
        XCTAssertNotNil(ads)
        assertEqual(ads, (Amortization.monthlyPayment(principal: 400_000, annualRate: 0.065, termYears: 30) ?? 0) * 12, accuracy: 1)
    }

    // MARK: - Income flow

    func testGSR_fromMonthlyRent() {
        let gsr = IncomeFlowCalculator.grossScheduledRentAnnual(monthlyRent: 3500, grossScheduledRentAnnual: nil)
        assertEqual(gsr, 42_000)
    }

    func testGSR_preferAnnualInput() {
        let gsr = IncomeFlowCalculator.grossScheduledRentAnnual(monthlyRent: 3500, grossScheduledRentAnnual: 50_000)
        assertEqual(gsr, 50_000)
    }

    func testGSR_missingReturnsNil() {
        assertNil(IncomeFlowCalculator.grossScheduledRentAnnual(monthlyRent: nil, grossScheduledRentAnnual: nil))
    }

    func testVacancyAdjustedGrossIncome() {
        let adj = IncomeFlowCalculator.vacancyAdjustedGrossIncome(grossScheduledRentAnnual: 42_000, vacancyPercent: 5)
        assertEqual(adj, 39_900, accuracy: 1) // 42_000 * 0.95
    }

    func testVacancyClamped() {
        let adjHigh = IncomeFlowCalculator.vacancyAdjustedGrossIncome(grossScheduledRentAnnual: 100_000, vacancyPercent: 150)
        assertEqual(adjHigh, 0) // clamped to 100% vacancy
        let adjNeg = IncomeFlowCalculator.vacancyAdjustedGrossIncome(grossScheduledRentAnnual: 100_000, vacancyPercent: -10)
        assertEqual(adjNeg, 100_000) // clamped to 0% vacancy
    }

    func testNOI() {
        let egi = IncomeFlowCalculator.effectiveGrossIncome(vacancyAdjustedGrossIncome: 40_000, otherIncomeAnnual: 1_200)
        assertEqual(egi, 41_200)
        let noi = IncomeFlowCalculator.noi(effectiveGrossIncome: egi, operatingExpensesAnnual: 18_000)
        assertEqual(noi, 23_200)
    }

    // MARK: - Debt and cash flow

    func testADS_useInputWhenProvided() {
        let ads = DebtAndCashFlowCalculator.annualDebtService(input: 28_000, loanAmount: 400_000, interestRateAnnual: 0.065, termYears: 30)
        assertEqual(ads, 28_000)
    }

    func testMonthlyAndAnnualCashFlow() {
        let monthly = DebtAndCashFlowCalculator.monthlyCashFlow(noi: 23_200, annualDebtService: 20_000)
        assertEqual(monthly, 266.67, accuracy: 0.01) // (23200-20000)/12
        let annual = DebtAndCashFlowCalculator.annualCashFlow(noi: 23_200, annualDebtService: 20_000)
        assertEqual(annual, 3_200)
    }

    func testDSCR() {
        let dscr = DebtAndCashFlowCalculator.dscr(noi: 25_000, annualDebtService: 20_000)
        assertEqual(dscr, 1.25)
        assertNil(DebtAndCashFlowCalculator.dscr(noi: 25_000, annualDebtService: 0))
    }

    // MARK: - Return multipliers

    func testCapRate() {
        let cap = ReturnMultiplierCalculator.capRate(noi: 30_000, purchasePrice: 500_000)
        assertEqual(cap, 0.06)
        assertNil(ReturnMultiplierCalculator.capRate(noi: 30_000, purchasePrice: 0))
    }

    func testCashOnCash() {
        let coc = ReturnMultiplierCalculator.cashOnCashReturn(annualCashFlow: 3_200, purchasePrice: 500_000, loanAmount: 400_000)
        assertEqual(coc, 0.032, accuracy: 0.001) // 3200/100000 = 3.2%
    }

    func testGRM() {
        let grm = ReturnMultiplierCalculator.grm(purchasePrice: 500_000, grossScheduledRentAnnual: 42_000)
        assertEqual(grm, 500_000 / 42_000, accuracy: 0.01)
    }

    func testLTV() {
        let ltv = ReturnMultiplierCalculator.ltv(loanAmount: 375_000, purchasePrice: 500_000)
        assertEqual(ltv, 0.75)
    }

    // MARK: - Unit and occupancy

    func testPricePerUnit() {
        let ppu = UnitAndOccupancyCalculator.pricePerUnit(purchasePrice: 500_000, unitCount: 4)
        assertEqual(ppu, 125_000)
    }

    func testBreakevenOccupancy() {
        let be = UnitAndOccupancyCalculator.breakevenOccupancy(
            operatingExpensesAnnual: 18_000,
            annualDebtService: 20_000,
            grossScheduledRentAnnual: 42_000,
            otherIncomeAnnual: 1_200
        )
        assertEqual(be, (18_000 + 20_000) / (42_000 + 1_200), accuracy: 0.001)
    }

    // MARK: - Full engine

    func testEngine_fullInputs_producesAllKeyMetrics() {
        let inputs = UnderwritingFixtures.fullInputs
        let out = UnderwritingEngine.calculate(inputs)

        XCTAssertNotNil(out.grossScheduledRentAnnual) // 3500*12 = 42000
        XCTAssertNotNil(out.vacancyAdjustedGrossIncome)
        XCTAssertNotNil(out.effectiveGrossIncome)
        XCTAssertNotNil(out.noi)
        XCTAssertNotNil(out.annualDebtService)
        XCTAssertNotNil(out.monthlyCashFlow)
        XCTAssertNotNil(out.annualCashFlow)
        XCTAssertNotNil(out.dscr)
        XCTAssertNotNil(out.capRate)
        XCTAssertNotNil(out.cashOnCashReturn)
        XCTAssertNotNil(out.grm)
        XCTAssertNotNil(out.expenseRatio)
        XCTAssertNotNil(out.breakEvenRatio)
        XCTAssertNotNil(out.debtYield)
        XCTAssertNotNil(out.ltv)
        XCTAssertNotNil(out.pricePerUnit)
        XCTAssertNotNil(out.pricePerSquareFoot)
        XCTAssertNotNil(out.breakevenOccupancy)
        XCTAssertNotNil(out.equityPaydown5Year)
        XCTAssertEqual(out.irrPlaceholder, .requiresExplicitSchedule)
    }

    func testEngine_fullInputs_deterministicValues() {
        let inputs = UnderwritingFixtures.fullInputs
        let out = UnderwritingEngine.calculate(inputs)

        assertEqual(out.grossScheduledRentAnnual, 42_000)
        assertEqual(out.vacancyAdjustedGrossIncome, 39_900, accuracy: 1)
        assertEqual(out.effectiveGrossIncome, 41_100, accuracy: 1) // 39900 + 1200
        assertEqual(out.noi, 23_100, accuracy: 1) // 41100 - 18000
        assertEqual(out.pricePerUnit, 125_000)
        assertEqual(out.pricePerSquareFoot, 500_000 / 2400, accuracy: 1)
        assertEqual(out.ltv, 0.8) // 400k/500k
    }

    func testEngine_minimalInputs_onlyIncomeMetrics() {
        let inputs = UnderwritingFixtures.minimalIncomeInputs
        let out = UnderwritingEngine.calculate(inputs)

        XCTAssertNotNil(out.grossScheduledRentAnnual)
        XCTAssertNotNil(out.noi)
        assertEqual(out.grossScheduledRentAnnual, 24_000) // 2000*12
        assertEqual(out.noi, 12_000) // 24000 - 12000

        XCTAssertNil(out.capRate)
        XCTAssertNil(out.annualDebtService)
        XCTAssertNil(out.monthlyCashFlow)
        XCTAssertNil(out.ltv)
    }

    func testEngine_noVacancyNoOther_deterministic() {
        let inputs = UnderwritingFixtures.noVacancyNoOther
        let out = UnderwritingEngine.calculate(inputs)

        assertEqual(out.grossScheduledRentAnnual, 30_000) // 2500*12
        assertEqual(out.vacancyAdjustedGrossIncome, 30_000)
        assertEqual(out.effectiveGrossIncome, 30_000)
        assertEqual(out.noi, 20_000)
        XCTAssertNotNil(out.annualDebtService)
        XCTAssertNotNil(out.capRate)
        assertEqual(out.capRate, 20_000 / 300_000, accuracy: 0.0001)
    }

    // MARK: - Missing data

    func testEngine_allNilInputs_allOutputsNilOrPlaceholder() {
        let inputs = UnderwritingInputs()
        let out = UnderwritingEngine.calculate(inputs)

        XCTAssertNil(out.grossScheduledRentAnnual)
        XCTAssertNil(out.noi)
        XCTAssertNil(out.capRate)
        XCTAssertNil(out.monthlyCashFlow)
        XCTAssertNil(out.ltv)
        XCTAssertEqual(out.irrPlaceholder, .requiresExplicitSchedule)
    }

    // MARK: - Zero / edge (quant review)

    func testCapRate_whenNOI_zero() {
        let cap = ReturnMultiplierCalculator.capRate(noi: 0, purchasePrice: 100_000)
        assertEqual(cap, 0)
    }

    func testExpenseRatio_whenOE_zero() {
        let ratio = ReturnMultiplierCalculator.expenseRatio(operatingExpensesAnnual: 0, effectiveGrossIncome: 50_000)
        assertEqual(ratio, 0)
    }

    func testDSCR_whenNOI_lessThanADS() {
        let dscr = DebtAndCashFlowCalculator.dscr(noi: 15_000, annualDebtService: 20_000)
        assertEqual(dscr, 0.75)
    }

    func testBreakevenOccupancy_whenRatioExceedsOne_cappedAtOne() {
        let be = UnitAndOccupancyCalculator.breakevenOccupancy(
            operatingExpensesAnnual: 30_000,
            annualDebtService: 25_000,
            grossScheduledRentAnnual: 40_000,
            otherIncomeAnnual: 0
        )
        assertEqual(be, 1) // 55000/40000 = 1.375 → capped at 1
    }

    // MARK: - Explanations

    func testMetricExplanations_allMetricsHaveNameAndFormula() {
        for metric in UnderwritingMetric.allCases {
            let name = MetricExplanations.name(for: metric)
            let formula = MetricExplanations.formula(for: metric)
            XCTAssertFalse(name.isEmpty)
            XCTAssertFalse(formula.isEmpty)
        }
    }
}
