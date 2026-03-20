//
//  SimulationEngineTests.swift
//  PropFolioTests
//
//  Deterministic tests: mapping, stability with incomplete inputs, down payment modes, expense breakdown.
//

import XCTest
@testable import PropFolio

final class SimulationEngineTests: XCTestCase {

    // MARK: - Stability with incomplete inputs

    func testEmptyInputs_doesNotCrash_returnsNils() {
        let inputs = SimulationInputs()
        let result = SimulationEngine.run(inputs)
        XCTAssertNotNil(result.underwriting)
        XCTAssertNil(result.underwriting.noi)
        XCTAssertNil(result.underwriting.capRate)
        XCTAssertNil(result.underwriting.monthlyCashFlow)
        XCTAssertNil(result.totalCashToClose)
        XCTAssertNil(result.equityInvested)
    }

    func testOnlyPurchasePrice_stable() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 300_000
        let result = SimulationEngine.run(inputs)
        XCTAssertNil(result.underwriting.noi)
        XCTAssertNil(result.underwriting.capRate)
        XCTAssertNil(result.totalCashToClose)
    }

    func testOnlyRentAndExpenses_noCrash() {
        var inputs = SimulationInputs()
        inputs.monthlyRentPerUnit = 1_500
        inputs.unitCount = 2
        inputs.taxesAnnual = 4_000
        inputs.insuranceAnnual = 1_200
        let result = SimulationEngine.run(inputs)
        XCTAssertNotNil(result.underwriting.grossScheduledRentAnnual)
        assertEqual(result.underwriting.grossScheduledRentAnnual, 36_000)
        XCTAssertNotNil(result.underwriting.noi)
        assertEqual(result.underwriting.operatingExpensesAnnual, 5_200)
    }

    // MARK: - Down payment: percent vs amount

    func testDownPaymentPercent_derivesLoan() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 500_000
        inputs.downPaymentPercent = 20
        inputs.interestRateAnnual = 0.06
        inputs.amortizationTermYears = 30
        let result = SimulationEngine.run(inputs)
        assertEqual(result.underwriting.ltv, 0.8)
        XCTAssertNotNil(result.underwriting.annualDebtService)
    }

    func testDownPaymentAmount_derivesLoan() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 500_000
        inputs.downPaymentAmount = 100_000
        inputs.interestRateAnnual = 0.06
        inputs.amortizationTermYears = 30
        let result = SimulationEngine.run(inputs)
        assertEqual(result.underwriting.ltv, 0.8)
        XCTAssertNotNil(result.underwriting.annualDebtService)
    }

    func testDownPaymentAmount_overridesPercent() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 500_000
        inputs.downPaymentPercent = 20
        inputs.downPaymentAmount = 125_000
        inputs.interestRateAnnual = 0.06
        inputs.amortizationTermYears = 30
        let result = SimulationEngine.run(inputs)
        assertEqual(result.underwriting.ltv, 375_000 / 500_000, accuracy: 0.001)
    }

    // MARK: - Operating expenses sum

    func testOperatingExpenses_sumOfCategories() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 400_000
        inputs.monthlyRentPerUnit = 2_000
        inputs.unitCount = 1
        inputs.vacancyRatePercent = 0
        inputs.taxesAnnual = 5_000
        inputs.insuranceAnnual = 1_500
        inputs.propertyManagementAnnual = 2_400
        inputs.repairsAndMaintenanceAnnual = 1_200
        inputs.utilitiesAnnual = 0
        inputs.capitalReservesAnnual = 600
        let result = SimulationEngine.run(inputs)
        assertEqual(result.underwriting.operatingExpensesAnnual, 10_700)
        assertEqual(result.underwriting.grossScheduledRentAnnual, 24_000)
        assertEqual(result.underwriting.noi, 13_300)
    }

    // MARK: - Total cash to close and equity

    func testTotalCashToClose_includesDownClosingReno() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 500_000
        inputs.downPaymentPercent = 20
        inputs.closingCosts = 10_000
        inputs.renovationCosts = RenovationCosts(kitchen: 5_000, bath: 3_000, other: 2_000)
        let result = SimulationEngine.run(inputs)
        assertEqual(result.totalCashToClose, 100_000 + 10_000 + 10_000)
        assertEqual(result.equityInvested, 100_000 + 10_000)
        assertEqual(result.renovationTotal, 10_000)
    }

    // MARK: - Full simulation round-trip

    func testFullSimulation_deterministicMetrics() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 400_000
        inputs.downPaymentPercent = 25
        inputs.interestRateAnnual = 0.065
        inputs.amortizationTermYears = 30
        inputs.closingCosts = 5_000
        inputs.monthlyRentPerUnit = 2_500
        inputs.unitCount = 2
        inputs.vacancyRatePercent = 5
        inputs.otherIncomeAnnual = 600
        inputs.taxesAnnual = 6_000
        inputs.insuranceAnnual = 1_800
        inputs.propertyManagementAnnual = 3_000
        inputs.repairsAndMaintenanceAnnual = 2_000
        inputs.utilitiesAnnual = 0
        inputs.capitalReservesAnnual = 1_200
        inputs.squareFeet = 2_000
        let result = SimulationEngine.run(inputs)

        assertEqual(result.underwriting.grossScheduledRentAnnual, 60_000)
        assertEqual(result.underwriting.ltv, 0.75)
        XCTAssertNotNil(result.underwriting.vacancyAdjustedGrossIncome)
        XCTAssertNotNil(result.underwriting.noi)
        XCTAssertNotNil(result.underwriting.monthlyCashFlow)
        XCTAssertNotNil(result.underwriting.capRate)
        assertEqual(result.equityInvested, 100_000 + 5_000)
    }

    // MARK: - Renovation plan (total cash and returns)

    func testTotalCashToClose_usesRenovationPlanWhenSet() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 500_000
        inputs.downPaymentPercent = 20
        inputs.closingCosts = 10_000
        var plan = RenovationPlan(lineItems: [], regionMultiplier: nil, contingencyPercent: 10)
        plan.lineItems = [
            RenovationLineItem(category: .kitchens, low: nil, base: 10_000, high: nil),
            RenovationLineItem(category: .bathrooms, low: nil, base: 5_000, high: nil)
        ]
        inputs.renovationPlan = plan
        inputs.renovationEstimateTier = .base
        let result = SimulationEngine.run(inputs)
        let renoSubtotal: Decimal = 15_000
        let contingency = renoSubtotal * 10 / 100
        assertEqual(result.renovationTotal, renoSubtotal + contingency)
        assertEqual(result.totalCashToClose, 100_000 + 10_000 + (renoSubtotal + contingency))
    }

    func testRenovationPlan_allNilForTier_totalZero_totalCashEqualsDownPlusClosing() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 300_000
        inputs.downPaymentPercent = 20
        inputs.closingCosts = 5_000
        var plan = RenovationPlan(lineItems: [], regionMultiplier: nil, contingencyPercent: 10)
        plan.lineItems = [
            RenovationLineItem(category: .kitchens, low: nil, base: nil, high: nil)
        ]
        inputs.renovationPlan = plan
        inputs.renovationEstimateTier = .base
        let result = SimulationEngine.run(inputs)
        XCTAssertNil(result.renovationTotal) // 0 reno is exposed as nil
        assertEqual(result.totalCashToClose, 60_000 + 5_000)
    }

    // MARK: - Map to underwriting inputs

    func testToUnderwritingInputs_rentFromPerUnitAndCount() {
        var s = SimulationInputs()
        s.monthlyRentPerUnit = 1_800
        s.unitCount = 4
        let uw = SimulationEngine.toUnderwritingInputs(s)
        assertEqual(uw.monthlyRent, 7_200)
        assertEqual(uw.unitCount, 4)
    }
}
