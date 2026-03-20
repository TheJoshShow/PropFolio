//
//  PortfolioMockData.swift
//  PropFolio
//
//  Mock saved deals for portfolio list. Replace with API/store when wired.
//

import Foundation

enum PortfolioMockData {
    static var sampleDeals: [PortfolioDeal] {
        let now = Date()
        let calendar = Calendar.current
        return [
            PortfolioDeal(
                propertyId: UUID(),
                propertyAddress: "123 Oak St, Austin, TX",
                analysisName: "Oak St duplex",
                dealScore: 82,
                dealArchetype: .strong,
                confidenceScore: 72,
                confidenceGrade: .medium,
                noi: 18_400,
                capRatePercent: 6.2,
                annualCashFlow: 12_400,
                status: .watching,
                updatedAt: now,
                createdAt: calendar.date(byAdding: .day, value: -5, to: now) ?? now
            ),
            PortfolioDeal(
                propertyId: UUID(),
                propertyAddress: "456 Elm Dr, Round Rock, TX",
                analysisName: "Elm SFR",
                dealScore: 58,
                dealArchetype: .stable,
                confidenceScore: 55,
                confidenceGrade: .medium,
                noi: 14_200,
                capRatePercent: 5.8,
                annualCashFlow: 8_100,
                status: .offer,
                updatedAt: calendar.date(byAdding: .day, value: -1, to: now) ?? now,
                createdAt: calendar.date(byAdding: .day, value: -14, to: now) ?? now
            ),
            PortfolioDeal(
                propertyId: UUID(),
                propertyAddress: "789 Pine Ave, Pflugerville, TX",
                analysisName: "Pine triplex",
                dealScore: 91,
                dealArchetype: .exceptional,
                confidenceScore: 78,
                confidenceGrade: .high,
                noi: 32_000,
                capRatePercent: 7.1,
                annualCashFlow: 22_500,
                status: .underContract,
                updatedAt: calendar.date(byAdding: .hour, value: -3, to: now) ?? now,
                createdAt: calendar.date(byAdding: .day, value: -3, to: now) ?? now
            ),
            PortfolioDeal(
                propertyId: UUID(),
                propertyAddress: "100 Cedar Ln, Georgetown, TX",
                analysisName: "Cedar fourplex",
                dealScore: 38,
                dealArchetype: .risky,
                confidenceScore: 42,
                confidenceGrade: .low,
                noi: 9_800,
                capRatePercent: 4.9,
                annualCashFlow: 2_200,
                status: .passed,
                updatedAt: calendar.date(byAdding: .day, value: -7, to: now) ?? now,
                createdAt: calendar.date(byAdding: .day, value: -21, to: now) ?? now
            ),
        ]
    }

    /// Use for empty-state testing (no deals).
    static var emptyDeals: [PortfolioDeal] { [] }
}
