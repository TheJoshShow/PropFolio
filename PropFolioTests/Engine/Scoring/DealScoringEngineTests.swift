//
//  DealScoringEngineTests.swift
//  PropFolioTests
//
//  Deal score 0–100: bands, sub-scores, guardrails, insufficient data.
//

import XCTest
@testable import PropFolio

final class DealScoringEngineTests: XCTestCase {

    // MARK: - Insufficient data

    func testInsufficientData_noDSCR_returnsInsufficientData() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.06
        inputs.dataConfidence = 0.8
        let result = DealScoringEngine.score(inputs)
        XCTAssertEqual(result.band, .insufficientData)
        XCTAssertNil(result.totalScore)
        XCTAssertFalse(result.explanationSummary.isEmpty)
    }

    func testInsufficientData_noConfidence_returnsInsufficientData() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.06
        inputs.dscr = 1.25
        let result = DealScoringEngine.score(inputs)
        XCTAssertEqual(result.band, .insufficientData)
        XCTAssertNil(result.totalScore)
    }

    func testInsufficientData_noProfitability_returnsInsufficientData() {
        var inputs = DealScoreInputs()
        inputs.dscr = 1.25
        inputs.dataConfidence = 0.8
        let result = DealScoringEngine.score(inputs)
        XCTAssertEqual(result.band, .insufficientData)
        XCTAssertNil(result.totalScore)
    }

    // MARK: - Valid score and bands

    func testValidScore_strongDeal_bandAndTotalInRange() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.07
        inputs.monthlyCashFlow = 800
        inputs.annualCashFlow = 9600
        inputs.cashOnCashReturn = 0.06
        inputs.dscr = 1.4
        inputs.expenseRatio = 0.40
        inputs.breakevenOccupancy = 0.75
        inputs.dataConfidence = 0.85
        let result = DealScoringEngine.score(inputs)
        XCTAssertNotNil(result.totalScore)
        let score = (result.totalScore! as NSDecimalNumber).doubleValue
        XCTAssertGreaterThanOrEqual(score, 0)
        XCTAssertLessThanOrEqual(score, 100)
        XCTAssertNotEqual(result.band, .insufficientData)
    }

    func testScoreBands_exceptionalAt90() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.10
        inputs.monthlyCashFlow = 2000
        inputs.annualCashFlow = 24000
        inputs.cashOnCashReturn = 0.10
        inputs.dscr = 2
        inputs.expenseRatio = 0.30
        inputs.breakevenOccupancy = 0.60
        inputs.dataConfidence = 1.0
        inputs.marketTailwinds = 80
        inputs.stressDSCR = 1.5
        let result = DealScoringEngine.score(inputs)
        XCTAssertNotNil(result.totalScore)
        let score = (result.totalScore! as NSDecimalNumber).doubleValue
        XCTAssertGreaterThanOrEqual(score, 90)
        XCTAssertEqual(result.band, .exceptional)
    }

    func testScoreBands_poorWhenWeakMetrics() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.02
        inputs.monthlyCashFlow = 0
        inputs.dscr = 1.05
        inputs.expenseRatio = 0.65
        inputs.dataConfidence = 0.6
        let result = DealScoringEngine.score(inputs)
        XCTAssertNotNil(result.totalScore)
        let score = (result.totalScore! as NSDecimalNumber).doubleValue
        XCTAssertLessThan(score, 60)
    }

    // MARK: - Guardrail: low confidence caps score

    func testGuardrail_lowConfidence_capsAt60() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.10
        inputs.monthlyCashFlow = 2000
        inputs.dscr = 2
        inputs.expenseRatio = 0.30
        inputs.dataConfidence = 0.30 // low
        let result = DealScoringEngine.score(inputs)
        XCTAssertNotNil(result.totalScore)
        let score = (result.totalScore! as NSDecimalNumber).doubleValue
        XCTAssertEqual(score, 60)
        XCTAssertTrue(result.wasCappedByConfidence)
    }

    func testGuardrail_highConfidence_noCap() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.08
        inputs.monthlyCashFlow = 1200
        inputs.dscr = 1.5
        inputs.dataConfidence = 0.9
        let result = DealScoringEngine.score(inputs)
        XCTAssertFalse(result.wasCappedByConfidence)
    }

    // MARK: - Sub-scores present

    func testComponents_subScoresAndWeightsPresent() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.06
        inputs.dscr = 1.25
        inputs.dataConfidence = 0.8
        let result = DealScoringEngine.score(inputs)
        XCTAssertFalse(result.components.isEmpty)
        for comp in result.components {
            XCTAssertGreaterThanOrEqual((comp.subScore as NSDecimalNumber).doubleValue, 0)
            XCTAssertLessThanOrEqual((comp.subScore as NSDecimalNumber).doubleValue, 100)
            XCTAssertGreaterThan((comp.weight as NSDecimalNumber).doubleValue, 0)
        }
    }

    func testCashFlow_singleFactorWhenBothPresent_noDoubleCount() {
        var inputs = DealScoreInputs()
        inputs.capRate = 0.06
        inputs.monthlyCashFlow = 500
        inputs.annualCashFlow = 6000
        inputs.dscr = 1.25
        inputs.dataConfidence = 0.8
        let result = DealScoringEngine.score(inputs)
        let cashFlowComponents = result.components.filter { $0.id == .monthlyCashFlow || $0.id == .annualCashFlow }
        XCTAssertEqual(cashFlowComponents.count, 1)
        XCTAssertEqual(cashFlowComponents.first?.id, .annualCashFlow)
    }

    // MARK: - Builder from underwriting

    func testBuilder_fromUnderwriting_populatesInputs() {
        var out = UnderwritingOutputs()
        out.capRate = 0.065
        out.monthlyCashFlow = 500
        out.annualCashFlow = 6000
        out.dscr = 1.3
        out.expenseRatio = 0.45
        out.breakevenOccupancy = 0.82
        out.grossScheduledRentAnnual = 36000
        out.annualDebtService = 28000
        let inputs = DealScoreInputs.from(
            underwriting: out,
            totalCashToClose: 120_000,
            renovationTotal: 15_000,
            purchasePrice: 300_000,
            dataConfidence: 0.75
        )
        XCTAssertEqual(inputs.capRate, 0.065)
        XCTAssertEqual(inputs.dscr, 1.3)
        XCTAssertEqual(inputs.dataConfidence, 0.75)
        XCTAssertNotNil(inputs.renovationBurdenRatio) // 15000/120000
        XCTAssertNotNil(inputs.rentCoverageStrength)  // 36000/28000
        let result = DealScoringEngine.score(inputs)
        XCTAssertNotNil(result.totalScore)
    }

    // MARK: - Explanations

    func testExplanations_insufficientDataReason_nonEmpty() {
        let s = DealScoreExplanations.insufficientDataReason()
        XCTAssertFalse(s.isEmpty)
    }

    func testExplanations_factorNameAndDescription_everyFactor() {
        for factor in DealScoreFactor.allCases {
            XCTAssertFalse(DealScoreExplanations.factorName(factor).isEmpty)
            XCTAssertFalse(DealScoreExplanations.factorExplanation(factor).isEmpty)
        }
    }

    func testExplanations_bandDescription_everyBand() {
        for band in [DealScoreBand.exceptional, .strong, .good, .fair, .weak, .poor, .insufficientData] {
            XCTAssertFalse(DealScoreExplanations.bandDescription(band).isEmpty)
        }
    }

    // MARK: - Deal archetypes

    func testArchetype_fromScore_mapsToRiskyStableStrongExceptional() {
        XCTAssertEqual(DealArchetype.from(score: 0), .risky)
        XCTAssertEqual(DealArchetype.from(score: 44), .risky)
        XCTAssertEqual(DealArchetype.from(score: 45), .stable)
        XCTAssertEqual(DealArchetype.from(score: 74), .stable)
        XCTAssertEqual(DealArchetype.from(score: 75), .strong)
        XCTAssertEqual(DealArchetype.from(score: 89), .strong)
        XCTAssertEqual(DealArchetype.from(score: 90), .exceptional)
        XCTAssertEqual(DealArchetype.from(score: 100), .exceptional)
        XCTAssertEqual(DealArchetype.from(score: nil), .unknown)
    }

    func testArchetype_fromBand_mapsCorrectly() {
        XCTAssertEqual(DealArchetype.from(band: .poor), .risky)
        XCTAssertEqual(DealArchetype.from(band: .weak), .risky)
        XCTAssertEqual(DealArchetype.from(band: .fair), .stable)
        XCTAssertEqual(DealArchetype.from(band: .good), .stable)
        XCTAssertEqual(DealArchetype.from(band: .strong), .strong)
        XCTAssertEqual(DealArchetype.from(band: .exceptional), .exceptional)
        XCTAssertEqual(DealArchetype.from(band: .insufficientData), .unknown)
    }

    func testArchetype_allCopyNonEmpty() {
        for arch in DealArchetype.allCases {
            XCTAssertFalse(arch.scoreRange.isEmpty)
            XCTAssertFalse(arch.emotionalLabel.isEmpty)
            XCTAssertFalse(arch.practicalExplanation.isEmpty)
            XCTAssertFalse(arch.expectedInvestorProfile.isEmpty)
            XCTAssertFalse(arch.badgeCopy.isEmpty)
            XCTAssertFalse(arch.calloutText.isEmpty)
        }
    }
}
