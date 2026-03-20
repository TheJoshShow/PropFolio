//
//  ZillowAdapter.swift
//  PropFolio
//
//  Property data adapter for Zillow. Fetches by zpid or address. Implement real API when key is available.
//

import Foundation

/// Zillow adapter. When no API key: returns .providerUnavailable or mock for development.
struct ZillowAdapter: PropertyDataAdapter {
    var source: DataSource { .zillow }

    private let apiKey: String?
    private let session: URLSession

    init(apiKey: String? = nil, session: URLSession = .shared) {
        self.apiKey = apiKey?.isEmpty == true ? nil : apiKey
        self.session = session
    }

    var isAvailable: Bool { apiKey != nil }

    func fetchProperty(id: String) async -> Result<RawPropertyData, AdapterError> {
        guard apiKey != nil else { return .failure(.providerUnavailable) }
        // TODO: Call Zillow API (e.g. /property?zpid=...) when contract is defined. Return raw payload as JSON Data.
        return .failure(.providerUnavailable)
    }

    func fetchByAddress(_ address: NormalizedAddress) async -> Result<RawPropertyData, AdapterError> {
        guard apiKey != nil else { return .failure(.providerUnavailable) }
        // TODO: Call Zillow search/address endpoint. Prefer fetchProperty(id:) when ID is known to reduce cost.
        return .failure(.providerUnavailable)
    }
}
