//
//  HomeMockData.swift
//  PropFolio
//
//  Structured mock data for Home dashboard. Matches DashboardModels; replace with API when wired.
//

import Foundation

enum HomeMockData {
    static let confidenceTeaser = ConfidenceMeterTeaser(
        score: 78,
        grade: .high,
        subtitle: "123 Oak St, Austin"
    )

    static let featuredMetrics = FeaturedMetricsSummary(
        noi: 18_400,
        capRatePercent: 6.2,
        cashFlow: 1_240
    )

    static let portfolioSnapshot = PortfolioSnapshot(
        propertyCount: 3,
        portfolioName: "My Deals",
        latestPropertyAddress: "456 Pine Ave, Austin"
    )

    static let recentAnalyses: [AnalysisSummary] = [
        AnalysisSummary(
            id: UUID(),
            propertyId: UUID(),
            propertyAddress: "123 Oak St, Austin, TX",
            name: "Base case",
            confidenceScore: 78,
            confidenceGrade: .high,
            createdAt: Date().addingTimeInterval(-86400 * 1),
            primaryMetricDisplay: "6.2% cap"
        ),
        AnalysisSummary(
            id: UUID(),
            propertyId: UUID(),
            propertyAddress: "456 Pine Ave, Austin, TX",
            name: "After reno",
            confidenceScore: 62,
            confidenceGrade: .medium,
            createdAt: Date().addingTimeInterval(-86400 * 3),
            primaryMetricDisplay: "7.1% cap"
        ),
        AnalysisSummary(
            id: UUID(),
            propertyId: UUID(),
            propertyAddress: "789 Elm Dr, Round Rock, TX",
            name: "Analysis",
            confidenceScore: 41,
            confidenceGrade: .low,
            createdAt: Date().addingTimeInterval(-86400 * 7),
            primaryMetricDisplay: "5.4% cap"
        ),
    ]
}
