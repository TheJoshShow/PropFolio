//
//  DashboardModels.swift
//  PropFolio
//
//  View models for Home/Dashboard. Aligned with backend: analyses, properties, portfolios.
//  Use Decimal for money. Replace with real DTOs when wiring to API.
//

import Foundation

// MARK: - Confidence (matches analyses.confidence_grade)

enum ConfidenceGrade: String, Codable, CaseIterable {
    case high
    case medium
    case low
    case veryLow
}

// MARK: - Recent analyses (analyses + property display)

struct AnalysisSummary: Identifiable {
    let id: UUID
    let propertyId: UUID
    let propertyAddress: String
    let name: String
    let confidenceScore: Decimal?
    let confidenceGrade: ConfidenceGrade?
    let createdAt: Date
    let primaryMetricDisplay: String
}

// MARK: - Featured metrics (from analysis outputs_json / underwriting)

struct FeaturedMetricsSummary {
    let noi: Decimal?
    let capRatePercent: Decimal?
    let cashFlow: Decimal?
}

// MARK: - Portfolio snapshot (portfolios + properties count)

struct PortfolioSnapshot {
    let propertyCount: Int
    let portfolioName: String?
    let latestPropertyAddress: String?
}

// MARK: - Confidence meter teaser (latest analysis score)

struct ConfidenceMeterTeaser {
    let score: Decimal
    let grade: ConfidenceGrade
    let subtitle: String
}
