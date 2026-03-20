//
//  ConfidenceMeterEngineTests.swift
//  PropFolioTests
//
//  Confidence Meter: score, bands, explanation, recommended actions.
//

import XCTest
@testable import PropFolio

final class ConfidenceMeterEngineTests: XCTestCase {

    // MARK: - Score and bands

    func testAllHighInputs_scoreNear100_bandHigh() {
        var inputs = ConfidenceMeterInputs()
        inputs.propertyDataCompleteness = 1
        inputs.rentEstimateConfidence = 1
        inputs.expenseAssumptionsConfidence = 1
        inputs.renovationBudgetCertainty = 1
        inputs.financingAssumptionsStability = 1
        inputs.marketDataReliabilityFreshness = 1
        inputs.manualOverrideCount = 0
        let result = ConfidenceMeterEngine.evaluate(inputs)
        XCTAssertGreaterThanOrEqual((result.score as NSDecimalNumber).doubleValue, 95)
        XCTAssertEqual(result.band, .high)
    }

    func testAllLowInputs_scoreLow_bandVeryLowOrLow() {
        var inputs = ConfidenceMeterInputs()
        inputs.propertyDataCompleteness = 0.2
        inputs.rentEstimateConfidence = 0.2
        inputs.expenseAssumptionsConfidence = 0.2
        inputs.manualOverrideCount = 8
        let result = ConfidenceMeterEngine.evaluate(inputs)
        XCTAssertLessThan((result.score as NSDecimalNumber).doubleValue, 50)
        XCTAssertTrue(result.band == .low || result.band == .veryLow)
    }

    func testNoInputs_scoreZero_bandVeryLow() {
        let inputs = ConfidenceMeterInputs()
        let result = ConfidenceMeterEngine.evaluate(inputs)
        XCTAssertEqual(result.score, 0)
        XCTAssertEqual(result.band, .veryLow)
    }

    // MARK: - Manual overrides reduce confidence

    func testManualOverrides_reduceScore() {
        var inputs = ConfidenceMeterInputs()
        inputs.propertyDataCompleteness = 0.8
        inputs.rentEstimateConfidence = 0.8
        inputs.expenseAssumptionsConfidence = 0.8
        inputs.manualOverrideCount = 0
        let resultZero = ConfidenceMeterEngine.evaluate(inputs)

        inputs.manualOverrideCount = 10
        let resultTen = ConfidenceMeterEngine.evaluate(inputs)

        XCTAssertGreaterThan((resultZero.score as NSDecimalNumber).doubleValue, (resultTen.score as NSDecimalNumber).doubleValue)
    }

    // MARK: - Band boundaries

    func testBandBoundaries() {
        XCTAssertEqual(ConfidenceMeterEngine.evaluate(inputsWithScore(76)).band, .high)
        XCTAssertEqual(ConfidenceMeterEngine.evaluate(inputsWithScore(74)).band, .medium)
        XCTAssertEqual(ConfidenceMeterEngine.evaluate(inputsWithScore(50)).band, .medium)
        XCTAssertEqual(ConfidenceMeterEngine.evaluate(inputsWithScore(49)).band, .low)
        XCTAssertEqual(ConfidenceMeterEngine.evaluate(inputsWithScore(25)).band, .low)
        XCTAssertEqual(ConfidenceMeterEngine.evaluate(inputsWithScore(24)).band, .veryLow)
    }

    private func inputsWithScore(_ target: Int) -> ConfidenceMeterInputs {
        // Single factor at 0-1 maps to 0-100 with that weight; approximate target score
        let v = Decimal(target) / 100
        var inputs = ConfidenceMeterInputs()
        inputs.propertyDataCompleteness = v
        inputs.rentEstimateConfidence = v
        inputs.expenseAssumptionsConfidence = v
        inputs.renovationBudgetCertainty = v
        inputs.financingAssumptionsStability = v
        inputs.marketDataReliabilityFreshness = v
        return inputs
    }

    // MARK: - Explanation and actions

    func testExplanation_hasSummaryAndFactors() {
        var inputs = ConfidenceMeterInputs()
        inputs.propertyDataCompleteness = 0.9
        inputs.rentEstimateConfidence = 0.3
        inputs.expenseAssumptionsConfidence = 0.8
        let result = ConfidenceMeterEngine.evaluate(inputs)
        XCTAssertFalse(result.explanation.summary.isEmpty)
        XCTAssertFalse(result.explanation.supportingFactors.isEmpty)
        XCTAssertFalse(result.explanation.limitingFactors.isEmpty)
    }

    func testRecommendedActions_lowFactorsProduceActions() {
        var inputs = ConfidenceMeterInputs()
        inputs.propertyDataCompleteness = 0.3
        inputs.rentEstimateConfidence = 0.4
        inputs.manualOverrideCount = 5
        let result = ConfidenceMeterEngine.evaluate(inputs)
        XCTAssertFalse(result.recommendedActions.isEmpty)
        XCTAssertTrue(result.recommendedActions.count <= 5)
    }

    func testRecommendedActions_highScoresNoActions() {
        var inputs = ConfidenceMeterInputs()
        inputs.propertyDataCompleteness = 0.9
        inputs.rentEstimateConfidence = 0.9
        inputs.expenseAssumptionsConfidence = 0.9
        inputs.manualOverrideCount = 0
        let result = ConfidenceMeterEngine.evaluate(inputs)
        XCTAssertTrue(result.recommendedActions.isEmpty)
    }

    // MARK: - Copy

    func testCopy_bandLabelsAndDescriptionsNonEmpty() {
        for band in [ConfidenceMeterBand.high, .medium, .low, .veryLow] {
            XCTAssertFalse(ConfidenceMeterCopy.bandLabel(band).isEmpty)
            XCTAssertFalse(ConfidenceMeterCopy.bandDescription(band).isEmpty)
        }
    }

    func testCopy_factorSupportingAndLimitingNonEmpty() {
        for factor in ConfidenceMeterFactor.allCases {
            XCTAssertFalse(ConfidenceMeterCopy.factorSupporting(factor, value: 0.8).isEmpty)
            XCTAssertFalse(ConfidenceMeterCopy.factorLimiting(factor, value: 0.3).isEmpty)
        }
    }
}
