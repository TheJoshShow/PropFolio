//
//  MockPropertyAdapter.swift
//  PropFolio
//
//  Returns deterministic RawPropertyData for development and fallback when no provider is available.
//

import Foundation

/// Mock adapter that returns a single property for any ID or address. Use for dev and graceful fallback.
struct MockPropertyAdapter: PropertyDataAdapter {
    var source: DataSource { .derived }

    var isAvailable: Bool { true }

    func fetchProperty(id: String) async -> Result<RawPropertyData, AdapterError> {
        .success(mockRaw(id: id, source: .zillow))
    }

    func fetchByAddress(_ address: NormalizedAddress) async -> Result<RawPropertyData, AdapterError> {
        .success(mockRaw(id: "addr-\(address.postalCode)", source: .manual))
    }

    private func mockRaw(id: String, source: DataSource) -> RawPropertyData {
        var raw = RawPropertyData(source: source, externalID: id, fetchedAt: Date(), rawPayload: Data())
        raw.streetAddress = "123 Main St"
        raw.city = "Austin"
        raw.state = "TX"
        raw.postalCode = "78701"
        raw.bedrooms = 3
        raw.bathrooms = 2.5
        raw.squareFeet = 1850
        raw.listPrice = 450_000
        raw.estimatedRent = 2_400
        raw.propertyType = "single_family"
        return raw
    }
}
