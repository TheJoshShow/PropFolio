//
//  ConfidenceMeterEngine.swift
//  PropFolio
//
//  Computes how confident PropFolio is that the analysis is grounded and dependable.
//  Separate from deal score; focuses on data quality and assumption reliability.
//

import Foundation

enum ConfidenceMeterEngine {
    /// Weights per factor (sum 1.0). Manual override impact derived from count.
    private static let weights: [ConfidenceMeterFactor: Decimal] = [
        .propertyDataCompleteness: 0.18,
        .rentEstimateConfidence: 0.18,
        .expenseAssumptionsConfidence: 0.15,
        .renovationBudgetCertainty: 0.12,
        .financingAssumptionsStability: 0.12,
        .marketDataReliabilityFreshness: 0.15,
        .manualOverrideImpact: 0.10
    ]

    /// Convert override count to 0–1 score (more overrides = lower). 0 → 1, 5 → 0.5, 10+ → 0.
    private static func overrideImpactScore(count: Int?) -> Decimal? {
        guard let c = count, c >= 0 else { return nil }
        if c == 0 { return 1 }
        let cap = 10
        let n = min(c, cap)
        return max(0, 1 - Decimal(n) / Decimal(cap))
    }

    /// Compute meter result. If no inputs present, returns score 0 and "Add data to see confidence."
    static func evaluate(_ inputs: ConfidenceMeterInputs) -> ConfidenceMeterResult {
        var contributions: [(factor: ConfidenceMeterFactor, value: Decimal)] = []

        func add(_ factor: ConfidenceMeterFactor, _ value: Decimal?) {
            guard let v = value, v >= 0, v <= 1 else { return }
            contributions.append((factor, v))
        }

        add(.propertyDataCompleteness, inputs.propertyDataCompleteness)
        add(.rentEstimateConfidence, inputs.rentEstimateConfidence)
        add(.expenseAssumptionsConfidence, inputs.expenseAssumptionsConfidence)
        add(.renovationBudgetCertainty, inputs.renovationBudgetCertainty)
        add(.financingAssumptionsStability, inputs.financingAssumptionsStability)
        add(.marketDataReliabilityFreshness, inputs.marketDataReliabilityFreshness)
        if let overrideScore = overrideImpactScore(count: inputs.manualOverrideCount) {
            contributions.append((.manualOverrideImpact, overrideScore))
        }

        let totalWeight = contributions.map { weights[$0.factor] ?? 0 }.reduce(0, +)
        let score: Decimal
        if totalWeight > 0 {
            let weightedSum = contributions.map { ($0.value * (weights[$0.factor] ?? 0)) }.reduce(0, +)
            score = min(100, max(0, (weightedSum / totalWeight) * 100))
        } else {
            score = 0
        }

        let band = bandForScore(score)
        let explanation = buildExplanation(contributions: contributions, score: score, overrideCount: inputs.manualOverrideCount)
        let actions = buildRecommendedActions(contributions: contributions, overrideCount: inputs.manualOverrideCount)

        return ConfidenceMeterResult(score: score, band: band, explanation: explanation, recommendedActions: actions)
    }

    private static func bandForScore(_ score: Decimal) -> ConfidenceMeterBand {
        let n = (score as NSDecimalNumber).doubleValue
        if n >= 75 { return .high }
        if n >= 50 { return .medium }
        if n >= 25 { return .low }
        return .veryLow
    }

    private static func buildExplanation(contributions: [(factor: ConfidenceMeterFactor, value: Decimal)], score: Decimal, overrideCount: Int?) -> ConfidenceMeterExplanation {
        let supporting = contributions.filter { $0.value >= 0.6 }.map { ConfidenceMeterCopy.factorSupporting($0.factor, value: $0.value) }
        let limiting = contributions.filter { $0.value < 0.5 }.map { ConfidenceMeterCopy.factorLimiting($0.factor, value: $0.value) }
        if let c = overrideCount, c > 0 {
            let overrideLimit = ConfidenceMeterCopy.manualOverrideLimiting(count: c)
            let limitingWithOverride = limiting + [overrideLimit]
            let summary = ConfidenceMeterCopy.explanationSummary(score: score, supportingCount: supporting.count, limitingCount: limitingWithOverride.count)
            return ConfidenceMeterExplanation(supportingFactors: supporting, limitingFactors: limitingWithOverride, summary: summary)
        }
        let summary = ConfidenceMeterCopy.explanationSummary(score: score, supportingCount: supporting.count, limitingCount: limiting.count)
        return ConfidenceMeterExplanation(supportingFactors: supporting, limitingFactors: limiting, summary: summary)
    }

    private static func buildRecommendedActions(contributions: [(factor: ConfidenceMeterFactor, value: Decimal)], overrideCount: Int?) -> [String] {
        var actions: [String] = []
        for (factor, value) in contributions where value < 0.5 {
            if let action = ConfidenceMeterCopy.recommendedAction(for: factor) {
                actions.append(action)
            }
        }
        if let c = overrideCount, c >= 3 {
            let overrideAction = ConfidenceMeterCopy.recommendedActionForOverrides(count: c)
            if !actions.contains(overrideAction) { actions.append(overrideAction) }
        }
        return Array(actions.prefix(5))
    }
}
