//
//  RenovationPlan.swift
//  PropFolio
//
//  Full renovation plan: line items, region multiplier, contingency. Drives total cash needed.
//

import Foundation

/// Renovation plan: line items per category, region multiplier, and contingency. Used for total cash to close and returns.
struct RenovationPlan: Equatable, Sendable, Codable {
    /// Line items (one per category; categories can be omitted for no cost).
    var lineItems: [RenovationLineItem]
    /// Multiplier for local costs (e.g. 1.0 = national average, 1.15 = 15% higher). Placeholder for future region data. Values < 1 treated as 1 to avoid negative totals.
    var regionMultiplier: Decimal?
    /// Contingency as percent of line-item subtotal (e.g. 10 = 10%). Applied after region multiplier.
    var contingencyPercent: Decimal

    init(lineItems: [RenovationLineItem] = [], regionMultiplier: Decimal? = nil, contingencyPercent: Decimal = 10) {
        self.lineItems = lineItems
        self.regionMultiplier = regionMultiplier
        self.contingencyPercent = contingencyPercent
    }

    /// Subtotal for a given tier (sum of line-item values for that tier). No region or contingency.
    func subtotal(for tier: RenovationEstimateTier) -> Decimal {
        let sum = lineItems.compactMap { $0.value(for: tier) }.reduce(0, +)
        return sum
    }

    /// Subtotal after region multiplier (still before contingency). Multiplier clamped to >= 1 to avoid negative/zero totals.
    func subtotalWithRegion(for tier: RenovationEstimateTier) -> Decimal {
        let sub = subtotal(for: tier)
        let raw = regionMultiplier ?? 1
        let mult = raw < 1 ? 1 : raw
        return sub * mult
    }

    /// Contingency amount for the given tier (percent of region-adjusted subtotal).
    func contingencyAmount(for tier: RenovationEstimateTier) -> Decimal {
        let sub = subtotalWithRegion(for: tier)
        return sub * (contingencyPercent / 100)
    }

    /// Total renovation cost for the given tier (region-adjusted subtotal + contingency). Use this for total cash needed and returns.
    func total(for tier: RenovationEstimateTier) -> Decimal {
        subtotalWithRegion(for: tier) + contingencyAmount(for: tier)
    }

    /// Line item for category, if present.
    func lineItem(for category: RenovationCategory) -> RenovationLineItem? {
        lineItems.first { $0.category == category }
    }

    /// Set or update line item for a category.
    mutating func setLineItem(_ item: RenovationLineItem) {
        if let i = lineItems.firstIndex(where: { $0.category == item.category }) {
            lineItems[i] = item
        } else {
            lineItems.append(item)
        }
    }
}
