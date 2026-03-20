//
//  DealArchetype.swift
//  PropFolio
//
//  Four deal archetypes tied to score: Risky, Stable, Strong, Exceptional.
//  Copy is simple, confidence-building, and not misleading.
//

import Foundation

/// Deal archetype derived from score. Used for badges, callouts, and framing.
enum DealArchetype: String, CaseIterable, Sendable {
    case risky       // 0–44
    case stable      // 45–74
    case strong      // 75–89
    case exceptional // 90–100
    case unknown     // insufficient data

    /// Score range for this archetype (for display).
    var scoreRange: String {
        switch self {
        case .risky: return "0–44"
        case .stable: return "45–74"
        case .strong: return "75–89"
        case .exceptional: return "90–100"
        case .unknown: return "—"
        }
    }

    /// Short emotional label (one or two words).
    var emotionalLabel: String {
        switch self {
        case .risky: return "Higher risk"
        case .stable: return "Steady"
        case .strong: return "Strong"
        case .exceptional: return "Exceptional"
        case .unknown: return "Incomplete"
        }
    }

    /// Practical explanation: what this means without hype.
    var practicalExplanation: String {
        switch self {
        case .risky: return "This deal has thinner margins or more uncertainty. Best for investors who can absorb volatility or add value through management or renovation."
        case .stable: return "Numbers look reasonable and the deal can work. Good fit if you want steady cash flow without taking on the highest-risk projects."
        case .strong: return "Profitability and resilience both look solid. A strong candidate if you’re looking for confidence in the numbers."
        case .exceptional: return "High marks on income, cushion, and data. Still do your own due diligence—no score replaces a full review."
        case .unknown: return "Add or confirm key inputs (rent, expenses, financing, and data quality) to see where this deal stands."
        }
    }

    /// Expected investor profile (who this tends to suit).
    var expectedInvestorProfile: String {
        switch self {
        case .risky: return "Experienced or value-add investors comfortable with more risk and hands-on involvement."
        case .stable: return "Investors seeking reliable income and a manageable level of risk."
        case .strong: return "Investors looking for a deal with strong metrics and room to perform as expected."
        case .exceptional: return "Investors who want high confidence in the numbers; due diligence still required."
        case .unknown: return "Complete your data to see which profile this deal matches."
        }
    }

    /// UI badge copy (short; for chips or labels).
    var badgeCopy: String {
        switch self {
        case .risky: return "Risky"
        case .stable: return "Stable"
        case .strong: return "Strong"
        case .exceptional: return "Exceptional"
        case .unknown: return "Need data"
        }
    }

    /// Short callout text (one line for cards or headers).
    var calloutText: String {
        switch self {
        case .risky: return "Higher risk—review the numbers and your capacity before committing."
        case .stable: return "Steady deal—numbers support a reasonable outcome."
        case .strong: return "Strong deal—profitability and cushion look good."
        case .exceptional: return "Exceptional metrics—still verify with your own due diligence."
        case .unknown: return "Complete key inputs to see your deal type."
        }
    }

    /// When deal score was capped by low data confidence, show this qualifier with the archetype (e.g. under badge).
    static func qualifierWhenCapped(whenCappedByConfidence: Bool) -> String? {
        whenCappedByConfidence ? "Score capped; improve data to see full score." : nil
    }

    // MARK: - Mapping from score or band

    /// Archetype from total score (0–100). Returns .unknown if score is nil.
    static func from(score: Decimal?) -> DealArchetype {
        guard let s = score else { return .unknown }
        let n = (s as NSDecimalNumber).doubleValue
        if n >= 90 { return .exceptional }
        if n >= 75 { return .strong }
        if n >= 45 { return .stable }
        if n >= 0 { return .risky }
        return .unknown
    }

    /// Archetype from score band (e.g. from DealScoreResult).
    static func from(band: DealScoreBand) -> DealArchetype {
        switch band {
        case .exceptional: return .exceptional
        case .strong: return .strong
        case .good, .fair: return .stable
        case .weak, .poor: return .risky
        case .insufficientData: return .unknown
        }
    }
}
