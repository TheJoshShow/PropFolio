//
//  FutureValueInsightCopy.swift
//  PropFolio
//
//  Concise insight summaries for the Future Value Predictor. Each insight maps to one
//  real input; language is plain, investor-friendly; tailwinds vs headwinds are
//  distinct; no certainty implied. See docs/FUTURE-VALUE-PREDICTOR-SPEC.md §8.
//

import Foundation

/// Factor IDs for the Future Value Predictor (mirrors spec).
enum FutureValueFactor: String, CaseIterable, Sendable {
    case populationGrowth
    case incomeGrowth
    case migrationNet
    case buildingPermits
    case housingSupply
    case rentTrendDirection
    case employmentStability
    case neighborhoodTrend
}

/// One factor's contribution: subScore 0–100, optional data point/source for display.
struct FutureValueFactorContribution: Sendable {
    let factor: FutureValueFactor
    let subScore: Decimal
    let dataPoint: String?
    let sourceLabel: String?

    /// Returns a single concise insight string (tailwind / headwind / neutral).
    /// Permits use inverted logic: high subScore = elevated activity = headwind.
    var insightSummary: String {
        let base = Self.insight(for: factor, subScore: subScore)
        return Self.appendDataPointIfUseful(base, dataPoint: dataPoint, sourceLabel: sourceLabel)
    }
}

// MARK: - Insight templates (rule-based; no AI)

extension FutureValueFactorContribution {

    /// Ordered factor list for stable output order.
    static let factorOrder: [FutureValueFactor] = [
        .populationGrowth, .incomeGrowth, .migrationNet, .buildingPermits,
        .housingSupply, .rentTrendDirection, .employmentStability, .neighborhoodTrend,
    ]

    /// One insight per contribution; order matches factorOrder; only includes present factors.
    static func insightSummaries(from contributions: [FutureValueFactorContribution]) -> [String] {
        factorOrder
            .filter { f in contributions.contains { $0.factor == f } }
            .map { f in
                let c = contributions.first { $0.factor == f }!
                var base = insight(for: c.factor, subScore: c.subScore)
                return appendDataPointIfUseful(base, dataPoint: c.dataPoint, sourceLabel: c.sourceLabel)
            }
    }

    /// Tailwind (subScore ≥ 60), headwind (≤ 40), or neutral (41–59). BuildingPermits inverted.
    static func insight(for factor: FutureValueFactor, subScore: Decimal) -> String {
        let n = (subScore as NSDecimalNumber).doubleValue
        let isTailwind = n >= 60
        let isHeadwind = n <= 40

        // BuildingPermits: high activity = more supply = headwind
        let useTailwind: Bool
        let useHeadwind: Bool
        if factor == .buildingPermits {
            useTailwind = isHeadwind
            useHeadwind = isTailwind
        } else {
            useTailwind = isTailwind
            useHeadwind = isHeadwind
        }

        if useTailwind { return tailwind(factor) }
        if useHeadwind { return headwind(factor) }
        return neutral(factor)
    }

    private static func tailwind(_ factor: FutureValueFactor) -> String {
        switch factor {
        case .populationGrowth:
            return "Population is growing, which can support future demand."
        case .incomeGrowth:
            return "Incomes are rising, which can support housing demand and values."
        case .migrationNet:
            return "More people are moving in than out, which may support demand."
        case .buildingPermits:
            return "Permit activity is moderate or low, which can keep supply in line with demand."
        case .housingSupply:
            return "Supply is tight (low months of inventory), which can support prices."
        case .rentTrendDirection:
            return "Rents are trending up, which can support property values."
        case .employmentStability:
            return "Employment is stable or improving, which can support the local economy and housing."
        case .neighborhoodTrend:
            return "Neighborhood-level data leans positive."
        }
    }

    private static func headwind(_ factor: FutureValueFactor) -> String {
        switch factor {
        case .populationGrowth:
            return "Population is declining or flat, which may soften demand."
        case .incomeGrowth:
            return "Income growth is weak or declining, which may pressure affordability."
        case .migrationNet:
            return "More people are leaving than arriving, which may soften demand."
        case .buildingPermits:
            return "Permit activity is elevated, which may increase future supply and moderate appreciation."
        case .housingSupply:
            return "Supply is high (e.g. many months of inventory), which may moderate prices."
        case .rentTrendDirection:
            return "Rents are trending down or flat, which may limit upside."
        case .employmentStability:
            return "Employment is weak or worsening, which may pressure the market."
        case .neighborhoodTrend:
            return "Neighborhood-level data leans negative."
        }
    }

    private static func neutral(_ factor: FutureValueFactor) -> String {
        switch factor {
        case .populationGrowth:
            return "Population is roughly stable."
        case .incomeGrowth:
            return "Income trends are mixed or flat."
        case .migrationNet:
            return "Migration is roughly in balance."
        case .buildingPermits:
            return "Permit activity is steady."
        case .housingSupply:
            return "Supply is near typical levels."
        case .rentTrendDirection:
            return "Rent trends are flat or mixed."
        case .employmentStability:
            return "Employment trends are mixed."
        case .neighborhoodTrend:
            return "Neighborhood trends are neutral."
        }
    }

    /// Optionally append " (dataPoint, sourceLabel)" for provenance; keep sentence non‑certain.
    private static func appendDataPointIfUseful(_ sentence: String, dataPoint: String?, sourceLabel: String?) -> String {
        guard let dp = dataPoint?.trimmingCharacters(in: .whitespaces), !dp.isEmpty else { return sentence }
        if let src = sourceLabel?.trimmingCharacters(in: .whitespaces), !src.isEmpty {
            return "\(sentence) (\(dp), \(src))"
        }
        return "\(sentence) (\(dp))"
    }
}
