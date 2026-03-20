//
//  DefaultRenovationTemplates.swift
//  PropFolio
//
//  Starter default cost averages (low/base/high) per category. National averages; use region multiplier for local adjustment.
//

import Foundation

enum DefaultRenovationTemplates {
    /// Default low/base/high (USD) per category. Base = typical mid-range; low = minimal/DIY-friendly; high = premium or complex.
    typealias Triple = (low: Decimal, base: Decimal, high: Decimal)

    private static let defaults: [RenovationCategory: Triple] = [
        .roof: (5_000, 9_000, 18_000),
        .windows: (3_000, 6_000, 15_000),
        .electrical: (1_500, 4_000, 10_000),
        .plumbing: (2_000, 5_000, 12_000),
        .hvac: (4_000, 8_000, 18_000),
        .foundationStructural: (3_000, 10_000, 35_000),
        .flooring: (2_000, 5_000, 14_000),
        .kitchens: (4_000, 12_000, 35_000),
        .bathrooms: (2_500, 7_000, 20_000),
        .paint: (1_000, 3_000, 8_000),
        .exteriorEnvelope: (2_000, 6_000, 16_000),
        .landscapingSiteWork: (1_000, 4_000, 12_000),
        .permitsContingency: (500, 2_000, 6_000),
        .generalLaborDemo: (1_500, 4_000, 12_000)
    ]

    /// Default (low, base, high) for a category. Returns nil if category has no template.
    static func defaults(for category: RenovationCategory) -> Triple? {
        defaults[category]
    }

    /// One line item filled with default template for the category.
    static func lineItem(for category: RenovationCategory) -> RenovationLineItem {
        guard let t = defaults(for: category) else {
            return RenovationLineItem(category: category)
        }
        return RenovationLineItem(category: category, low: t.low, base: t.base, high: t.high)
    }

    /// A new plan with all categories populated from default templates. Optional region multiplier and contingency.
    static func plan(
        regionMultiplier: Decimal? = nil,
        contingencyPercent: Decimal = 10
    ) -> RenovationPlan {
        let items = RenovationCategory.allCases.map { lineItem(for: $0) }
        return RenovationPlan(lineItems: items, regionMultiplier: regionMultiplier, contingencyPercent: contingencyPercent)
    }

    /// Plan with only the given categories (e.g. common first-phase rehabs).
    static func plan(
        categories: [RenovationCategory],
        regionMultiplier: Decimal? = nil,
        contingencyPercent: Decimal = 10
    ) -> RenovationPlan {
        let items = categories.map { lineItem(for: $0) }
        return RenovationPlan(lineItems: items, regionMultiplier: regionMultiplier, contingencyPercent: contingencyPercent)
    }
}
