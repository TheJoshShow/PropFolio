//
//  RedfinAdapter.swift
//  PropFolio
//
//  Property data adapter for Redfin. Fetches by listing ID or address.
//

import Foundation

/// Redfin adapter. When no API/key: returns .providerUnavailable.
struct RedfinAdapter: PropertyDataAdapter {
    var source: DataSource { .redfin }

    private let configured: Bool
    private let session: URLSession

    init(configured: Bool = false, session: URLSession = .shared) {
        self.configured = configured
        self.session = session
    }

    var isAvailable: Bool { configured }

    func fetchProperty(id: String) async -> Result<RawPropertyData, AdapterError> {
        guard configured else { return .failure(.providerUnavailable) }
        // TODO: Integrate Redfin API or scraping contract when defined. Return RawPropertyData with rawPayload as JSON Data.
        return .failure(.providerUnavailable)
    }

    func fetchByAddress(_ address: NormalizedAddress) async -> Result<RawPropertyData, AdapterError> {
        guard configured else { return .failure(.providerUnavailable) }
        return .failure(.providerUnavailable)
    }
}
