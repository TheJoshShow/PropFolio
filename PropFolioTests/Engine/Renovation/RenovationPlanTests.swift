//
//  RenovationPlanTests.swift
//  PropFolioTests
//
//  Line-item totals, contingency, region multiplier, default templates.
//

import XCTest
@testable import PropFolio

final class RenovationPlanTests: XCTestCase {

    func testSubtotalAndContingency() {
        var plan = RenovationPlan(lineItems: [], regionMultiplier: nil, contingencyPercent: 10)
        plan.lineItems = [
            RenovationLineItem(category: .roof, low: 5_000, base: 9_000, high: 18_000),
            RenovationLineItem(category: .kitchens, low: 4_000, base: 12_000, high: nil)
        ]
        XCTAssertEqual(plan.subtotal(for: .base), 21_000)
        XCTAssertEqual(plan.contingencyAmount(for: .base), 2_100)
        XCTAssertEqual(plan.total(for: .base), 23_100)
    }

    func testRegionMultiplier() {
        var plan = RenovationPlan(lineItems: [], regionMultiplier: 1.2, contingencyPercent: 10)
        plan.lineItems = [RenovationLineItem(category: .flooring, low: nil, base: 10_000, high: nil)]
        XCTAssertEqual(plan.subtotalWithRegion(for: .base), 12_000)
        XCTAssertEqual(plan.contingencyAmount(for: .base), 1_200)
        XCTAssertEqual(plan.total(for: .base), 13_200)
    }

    func testRegionMultiplier_zeroOrNegative_treatedAsOne_totalNonNegative() {
        var plan = RenovationPlan(lineItems: [], regionMultiplier: 0, contingencyPercent: 10)
        plan.lineItems = [RenovationLineItem(category: .paint, low: nil, base: 3_000, high: nil)]
        XCTAssertEqual(plan.subtotalWithRegion(for: .base), 3_000)
        XCTAssertEqual(plan.total(for: .base), 3_300)

        plan.regionMultiplier = -1
        XCTAssertEqual(plan.subtotalWithRegion(for: .base), 3_000)
        XCTAssertTrue(plan.total(for: .base) >= 0)
    }

    func testContingency_zeroPercent_totalEqualsSubtotalWithRegion() {
        var plan = RenovationPlan(lineItems: [], regionMultiplier: nil, contingencyPercent: 0)
        plan.lineItems = [RenovationLineItem(category: .roof, low: nil, base: 9_000, high: nil)]
        XCTAssertEqual(plan.contingencyAmount(for: .base), 0)
        XCTAssertEqual(plan.total(for: .base), 9_000)
    }

    func testContingency_100Percent_totalEqualsTwiceSubtotalWithRegion() {
        var plan = RenovationPlan(lineItems: [], regionMultiplier: nil, contingencyPercent: 100)
        plan.lineItems = [RenovationLineItem(category: .electrical, low: nil, base: 4_000, high: nil)]
        XCTAssertEqual(plan.contingencyAmount(for: .base), 4_000)
        XCTAssertEqual(plan.total(for: .base), 8_000)
    }

    func testDefaultTemplates_allCategoriesHaveDefaults() {
        for category in RenovationCategory.allCases {
            let triple = DefaultRenovationTemplates.defaults(for: category)
            XCTAssertNotNil(triple)
            XCTAssertTrue((triple?.low ?? 0) <= (triple?.base ?? 0))
            XCTAssertTrue((triple?.base ?? 0) <= (triple?.high ?? 0))
        }
    }

    func testDefaultTemplates_planSubtotalPositive() {
        let plan = DefaultRenovationTemplates.plan(regionMultiplier: nil, contingencyPercent: 10)
        let sub = plan.subtotal(for: .base)
        XCTAssertTrue(sub > 0)
        XCTAssertEqual(plan.total(for: .base), sub + sub * 10 / 100)
    }

    func testCategoryExplanations_nonEmpty() {
        for category in RenovationCategory.allCases {
            let text = RenovationExplanations.categoryExplanation(category)
            XCTAssertFalse(text.isEmpty)
        }
    }
}
