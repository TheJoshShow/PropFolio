//
//  PortfolioModels.swift
//  PropFolio
//
//  Saved deal / analysis summary for portfolio. Aligns with backend when wired.
//

import Foundation

/// User-facing status or tag for a saved deal.
enum DealStatus: String, CaseIterable, Codable, Sendable {
    case watching   // Tracking, no offer yet
    case offer     // Offer submitted
    case underContract = "under_contract"
    case passed    // Passed on deal
    case closed    // Closed / owned

    var displayName: String {
        switch self {
        case .watching: return "Watching"
        case .offer: return "Offer"
        case .underContract: return "Under contract"
        case .passed: return "Passed"
        case .closed: return "Closed"
        }
    }

    var shortLabel: String {
        switch self {
        case .watching: return "Watching"
        case .offer: return "Offer"
        case .underContract: return "Contract"
        case .passed: return "Passed"
        case .closed: return "Closed"
        }
    }
}

/// A saved deal in the portfolio: summary for list/cards. Full analysis loaded on open.
struct PortfolioDeal: Identifiable, Hashable, Sendable {
    let id: UUID
    let propertyId: UUID
    var propertyAddress: String
    var analysisName: String
    /// Deal score 0–100; nil if insufficient data.
    var dealScore: Int?
    /// Archetype from score (Risky, Stable, Strong, Exceptional, Unknown).
    var dealArchetype: DealArchetype
    /// Confidence 0–100.
    var confidenceScore: Int?
    var confidenceGrade: ConfidenceGrade
    /// Key metrics (optional for display).
    var noi: Decimal?
    var capRatePercent: Decimal?
    var annualCashFlow: Decimal?
    var status: DealStatus
    var updatedAt: Date
    var createdAt: Date
    /// When set (e.g. demo data), analysis screen uses this instead of toAnalysisDashboardState() for full state.
    var fullAnalysisState: AnalysisDashboardState?

    init(
        id: UUID = UUID(),
        propertyId: UUID,
        propertyAddress: String,
        analysisName: String,
        dealScore: Int? = nil,
        dealArchetype: DealArchetype = .unknown,
        confidenceScore: Int? = nil,
        confidenceGrade: ConfidenceGrade = .medium,
        noi: Decimal? = nil,
        capRatePercent: Decimal? = nil,
        annualCashFlow: Decimal? = nil,
        status: DealStatus = .watching,
        updatedAt: Date = Date(),
        createdAt: Date = Date(),
        fullAnalysisState: AnalysisDashboardState? = nil
    ) {
        self.id = id
        self.propertyId = propertyId
        self.propertyAddress = propertyAddress
        self.analysisName = analysisName
        self.dealScore = dealScore
        self.dealArchetype = dealArchetype
        self.confidenceScore = confidenceScore
        self.confidenceGrade = confidenceGrade
        self.noi = noi
        self.capRatePercent = capRatePercent
        self.annualCashFlow = annualCashFlow
        self.status = status
        self.updatedAt = updatedAt
        self.createdAt = createdAt
        self.fullAnalysisState = fullAnalysisState
    }

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
    static func == (lhs: PortfolioDeal, rhs: PortfolioDeal) -> Bool { lhs.id == rhs.id }

    /// "Updated 2 days ago" style.
    var updatedAtRelative: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: updatedAt, relativeTo: Date())
    }

    /// Analysis state for the dashboard. Use fullAnalysisState when set (e.g. demo), else minimal from stored metrics.
    func analysisStateForDashboard() -> AnalysisDashboardState {
        if let full = fullAnalysisState { return full }
        return toAnalysisDashboardState()
    }

    /// Build a minimal AnalysisDashboardState so the analysis screen can open from portfolio.
    func toAnalysisDashboardState() -> AnalysisDashboardState {
        let dealResult: DealScoreResult? = dealScore.map { score in
            let band = DealScoreBand.from(score: Decimal(score))
            return DealScoreResult(
                totalScore: Decimal(score),
                band: band,
                components: [],
                wasCappedByConfidence: false,
                explanationSummary: "Saved deal score: \(score)/100."
            )
        }
        let confResult: ConfidenceMeterResult? = confidenceScore.map { score in
            let band = confidenceGrade.confidenceMeterBand
            return ConfidenceMeterResult(
                score: Decimal(score),
                band: band,
                explanation: ConfidenceMeterExplanation(
                    supportingFactors: [],
                    limitingFactors: [],
                    summary: ConfidenceMeterCopy.bandDescription(band)
                ),
                recommendedActions: []
            )
        }
        let capRateRatio = capRatePercent.map { $0 / 100 }
        let underwriting: UnderwritingOutputs? = (noi != nil || capRateRatio != nil || annualCashFlow != nil)
            ? UnderwritingOutputs(
                noi: noi,
                capRate: capRateRatio,
                annualCashFlow: annualCashFlow
            )
            : nil
        return AnalysisDashboardState(
            propertyAddress: propertyAddress,
            dealScoreResult: dealResult,
            confidenceMeterResult: confResult,
            underwritingOutputs: underwriting,
            futureValueSummary: nil,
            risks: [],
            opportunities: []
        )
    }
}
