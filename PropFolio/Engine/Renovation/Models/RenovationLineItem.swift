//
//  RenovationLineItem.swift
//  PropFolio
//
//  Single line item: one category with optional low/base/high estimates.
//

import Foundation

/// One renovation line item: category plus optional low, base, and high cost estimates (USD).
struct RenovationLineItem: Equatable, Sendable, Codable {
    var category: RenovationCategory
    var low: Decimal?
    var base: Decimal?
    var high: Decimal?

    init(category: RenovationCategory, low: Decimal? = nil, base: Decimal? = nil, high: Decimal? = nil) {
        self.category = category
        self.low = low
        self.base = base
        self.high = high
    }

    /// Value for the given estimate tier. Returns nil if no value set for that tier.
    func value(for tier: RenovationEstimateTier) -> Decimal? {
        switch tier {
        case .low: return low
        case .base: return base
        case .high: return high
        }
    }

    /// Set value for the given tier.
    mutating func setValue(_ value: Decimal?, for tier: RenovationEstimateTier) {
        switch tier {
        case .low: low = value
        case .base: base = value
        case .high: high = value
        }
    }
}

/// Which estimate tier to use for totals (e.g. in simulation).
enum RenovationEstimateTier: String, CaseIterable, Sendable {
    case low
    case base
    case high
}
