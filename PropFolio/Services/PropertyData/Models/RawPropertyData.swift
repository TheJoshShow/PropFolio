//
//  RawPropertyData.swift
//  PropFolio
//
//  Adapter-specific raw payload before normalization. Stored in imported_source_records.
//

import Foundation

/// Raw property data returned by an adapter. Normalizer converts to NormalizedProperty.
struct RawPropertyData: Sendable {
    let source: DataSource
    let externalID: String
    let fetchedAt: Date

    var streetAddress: String?
    var unit: String?
    var city: String?
    var state: String?
    var postalCode: String?
    var countryCode: String?

    var propertyType: String?
    var bedrooms: Int?
    var bathrooms: Decimal?
    var squareFeet: Int?
    var lotSizeSqFt: Int?
    var yearBuilt: Int?

    var listPrice: Decimal?
    var estimatedValue: Decimal?
    var lastSoldPrice: Decimal?
    var lastSoldDate: Date?

    var estimatedRent: Decimal?

    var photoURLs: [URL]

    /// Full payload for storage in imported_source_records.raw_payload (JSON). Use JSONSerialization to produce.
    let rawPayload: Data

    init(source: DataSource, externalID: String, fetchedAt: Date = Date(), rawPayload: Data = Data()) {
        self.source = source
        self.externalID = externalID
        self.fetchedAt = fetchedAt
        self.rawPayload = rawPayload
        self.streetAddress = nil
        self.unit = nil
        self.city = nil
        self.state = nil
        self.postalCode = nil
        self.countryCode = "US"
        self.propertyType = nil
        self.bedrooms = nil
        self.bathrooms = nil
        self.squareFeet = nil
        self.lotSizeSqFt = nil
        self.yearBuilt = nil
        self.listPrice = nil
        self.estimatedValue = nil
        self.lastSoldPrice = nil
        self.lastSoldDate = nil
        self.estimatedRent = nil
        self.photoURLs = []
    }
}

enum AdapterError: Error, Sendable {
    case networkError(underlying: Error)
    case notFound
    case rateLimited(retryAfter: TimeInterval?)
    case invalidResponse
    case authenticationFailed
    case providerUnavailable
    case partialData(available: RawPropertyData, missing: [String])
}
