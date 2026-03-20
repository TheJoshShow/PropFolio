//
//  PropertyDataAdapter.swift
//  PropFolio
//
//  Typed adapter protocol: fetch by listing ID or address. All adapters return RawPropertyData.
//

import Foundation

/// Adapter for a single property data provider. Fetch by ID or by normalized address.
protocol PropertyDataAdapter: Sendable {
    var source: DataSource { get }

    /// Fetch by provider's listing ID (e.g. zpid, Redfin ID). Prefer when available to minimize cost.
    func fetchProperty(id: String) async -> Result<RawPropertyData, AdapterError>

    /// Fetch by address when no listing ID. May be more expensive; use cache.
    func fetchByAddress(_ address: NormalizedAddress) async -> Result<RawPropertyData, AdapterError>

    /// Whether the adapter is configured and available (e.g. API key present).
    var isAvailable: Bool { get }
}

extension PropertyDataAdapter {
    func tracked<T: Codable>(_ value: T, confidence: ImportConfidence = .high) -> TrackedValue<T> {
        TrackedValue(
            value: value,
            metadata: ImportMetadata(source: source, fetchedAt: Date(), confidence: confidence)
        )
    }
}
