//
//  MarketContextModels.swift
//  PropFolio
//
//  Request/response for public or backend market context (zip, county, state).
//

import Foundation

// MARK: - Geography key (for cache and request)

/// Geography for market context. No PII; cache by this.
struct MarketGeography: Sendable, Hashable {
    let postalCode: String?
    let countyFips: String?
    let state: String

    var cacheKey: String {
        if let zip = postalCode, !zip.isEmpty { return "market:zip:\(zip)" }
        if let fips = countyFips, !fips.isEmpty { return "market:county:\(fips)" }
        return "market:state:\(state)"
    }
}

// MARK: - Response

/// Market context for display or underwriting context (inventory, median price, etc.).
struct MarketContextResult: Sendable {
    let geography: MarketGeography
    let medianListPrice: Decimal?
    let medianRent: Decimal?
    let inventoryCount: Int?
    let daysOnMarket: Int?
    let source: DataSource
    let fetchedAt: Date
}

/// Backend or public API response (e.g. JSON from proxy).
struct MarketContextResponse: Decodable {
    let medianListPrice: Decimal?
    let medianRent: Decimal?
    let inventoryCount: Int?
    let daysOnMarket: Int?

    enum CodingKeys: String, CodingKey {
        case medianListPrice
        case medianRent
        case inventoryCount
        case daysOnMarket
    }
}
