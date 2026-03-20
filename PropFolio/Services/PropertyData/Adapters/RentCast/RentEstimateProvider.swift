//
//  RentEstimateProvider.swift
//  PropFolio
//
//  Protocol for rent estimate by address. Used to enrich RawPropertyData.estimatedRent.
//

import Foundation

/// Result of a rent estimate call. Can be merged into RawPropertyData.
struct RentEstimateResult: Sendable {
    let rent: Decimal?
    let rangeLow: Decimal?
    let rangeHigh: Decimal?
    let source: DataSource
    let fetchedAt: Date
}

/// Provides rent estimate for a normalized address. Call when: after property address is known; skip when: no key or rate limited.
protocol RentEstimateProvider: Sendable {
    var source: DataSource { get }
    var isAvailable: Bool { get }
    func getRentEstimate(for address: NormalizedAddress) async -> Result<RentEstimateResult, AdapterError>
}
