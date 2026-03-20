//
//  TestHelpers.swift
//  PropFolioTests
//
//  Fixture builders and Decimal assertion helpers for underwriting tests.
//

import XCTest
@testable import PropFolio

// MARK: - Decimal assertions

extension XCTestCase {
    func assertEqual(_ a: Decimal?, _ b: Decimal?, accuracy: Decimal = 0.0001, file: StaticString = #file, line: UInt = #line) {
        switch (a, b) {
        case (nil, nil): return
        case (nil, _), (_, nil): XCTFail("Expected \(String(describing: b)), got \(String(describing: a))", file: file, line: line)
        case let (x?, y?):
            if abs(x - y) > accuracy {
                XCTFail("Expected \(y), got \(x)", file: file, line: line)
            }
        }
    }

    func assertNil(_ value: Decimal?, file: StaticString = #file, line: UInt = #line) {
        XCTAssertNil(value, file: file, line: line)
    }
}

// MARK: - Underwriting fixtures

enum UnderwritingFixtures {
    /// Full set of inputs that yield all metrics (deterministic).
    static var fullInputs: UnderwritingInputs {
        UnderwritingInputs(
            purchasePrice: 500_000,
            loanAmount: 400_000,
            interestRateAnnual: 0.065,
            termYears: 30,
            annualDebtService: nil,
            monthlyRent: 3_500,
            grossScheduledRentAnnual: nil,
            vacancyPercent: 5,
            otherIncomeAnnual: 1_200,
            operatingExpensesAnnual: 18_000,
            unitCount: 4,
            squareFeet: 2_400
        )
    }

    /// Minimal inputs: only rent and expenses (NOI only, no financing).
    static var minimalIncomeInputs: UnderwritingInputs {
        UnderwritingInputs(
            purchasePrice: nil,
            loanAmount: nil,
            interestRateAnnual: nil,
            termYears: nil,
            annualDebtService: nil,
            monthlyRent: 2_000,
            grossScheduledRentAnnual: nil,
            vacancyPercent: 0,
            otherIncomeAnnual: nil,
            operatingExpensesAnnual: 12_000,
            unitCount: nil,
            squareFeet: nil
        )
    }

    /// Zero vacancy, no other income.
    static var noVacancyNoOther: UnderwritingInputs {
        UnderwritingInputs(
            purchasePrice: 300_000,
            loanAmount: 240_000,
            interestRateAnnual: 0.06,
            termYears: 30,
            annualDebtService: nil,
            monthlyRent: 2_500,
            grossScheduledRentAnnual: nil,
            vacancyPercent: 0,
            otherIncomeAnnual: 0,
            operatingExpensesAnnual: 10_000,
            unitCount: 1,
            squareFeet: 1_200
        )
    }
}
