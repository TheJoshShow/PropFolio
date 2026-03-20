//
//  AnalysisDashboardModels.swift
//  PropFolio
//
//  Input model for the main analysis dashboard: score, metrics, confidence, future value, callouts.
//

import Foundation

/// Future value predictor summary for dashboard (score/band + one-liner).
struct FutureValueSummary: Sendable {
    let score: Int?           // 0–100; nil if insufficient data
    let bandLabel: String     // e.g. "Moderate tailwinds"
    let oneLiner: String      // e.g. "On balance, market data leans supportive for value."
}

/// Single risk or opportunity callout.
struct AnalysisCallout: Sendable, Identifiable {
    let id: UUID
    let title: String
    let body: String
    let isRisk: Bool          // true = risk (warning), false = opportunity (positive)

    init(id: UUID = UUID(), title: String, body: String, isRisk: Bool) {
        self.id = id
        self.title = title
        self.body = body
        self.isRisk = isRisk
    }
}

/// Full state for the analysis dashboard. All optional except what’s always shown.
struct AnalysisDashboardState: Sendable {
    let propertyAddress: String?
    let dealScoreResult: DealScoreResult?
    let confidenceMeterResult: ConfidenceMeterResult?
    let underwritingOutputs: UnderwritingOutputs?
    let futureValueSummary: FutureValueSummary?
    let risks: [AnalysisCallout]
    let opportunities: [AnalysisCallout]

    init(
        propertyAddress: String? = nil,
        dealScoreResult: DealScoreResult? = nil,
        confidenceMeterResult: ConfidenceMeterResult? = nil,
        underwritingOutputs: UnderwritingOutputs? = nil,
        futureValueSummary: FutureValueSummary? = nil,
        risks: [AnalysisCallout] = [],
        opportunities: [AnalysisCallout] = []
    ) {
        self.propertyAddress = propertyAddress
        self.dealScoreResult = dealScoreResult
        self.confidenceMeterResult = confidenceMeterResult
        self.underwritingOutputs = underwritingOutputs
        self.futureValueSummary = futureValueSummary
        self.risks = risks
        self.opportunities = opportunities
    }

    /// Build a teaser for the confidence meter from full result.
    var confidenceTeaser: ConfidenceMeterTeaser? {
        guard let r = confidenceMeterResult else { return nil }
        return ConfidenceMeterTeaser(
            score: r.score,
            grade: r.band.confidenceGrade,
            subtitle: r.explanation.summary
        )
    }

    /// Archetype from deal score (for badge and copy).
    var archetype: DealArchetype? {
        guard let r = dealScoreResult, let s = r.totalScore else { return nil }
        return DealArchetype.from(score: s)
    }
}
