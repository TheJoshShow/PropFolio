//
//  ATTOMAdapter.swift
//  PropFolio
//
//  Parcel/property metadata via ATTOM (or equivalent). Call when address known and property details missing; skip when no key or cache hit.
//

import Foundation

/// ATTOM (or equivalent) adapter for parcel/property data. Returns RawPropertyData; cache 30 days (parcel data is stable).
final class ATTOMAdapter: PropertyDataAdapter, @unchecked Sendable {
    private let apiKey: String?
    private let session: URLSession
    private let cache: ProviderResponseCache?
    private let cacheTTL: TimeInterval

    static let defaultCacheTTL: TimeInterval = 30 * 24 * 3600

    init(
        apiKey: String? = nil,
        session: URLSession = .shared,
        cache: ProviderResponseCache? = InMemoryProviderResponseCache(),
        cacheTTL: TimeInterval = ATTOMAdapter.defaultCacheTTL
    ) {
        self.apiKey = apiKey?.isEmpty == true ? nil : apiKey
        self.session = session
        self.cache = cache
        self.cacheTTL = cacheTTL
    }

    var source: DataSource { .attom }
    var isAvailable: Bool { apiKey != nil }

    func fetchProperty(id: String) async -> Result<RawPropertyData, AdapterError> {
        /// ATTOM is address-based; fetch by ID (APN) if we have a separate endpoint. Otherwise not supported.
        .failure(.providerUnavailable)
    }

    func fetchByAddress(_ address: NormalizedAddress) async -> Result<RawPropertyData, AdapterError> {
        guard isAvailable else { return .failure(.providerUnavailable) }

        let cacheKey = "attom:\(address.streetAddress):\(address.city):\(address.state):\(address.postalCode)"
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        if let cached = cache?.get(cacheKey),
           let decoded = try? decoder.decode(ATTOMPropertyResponse.self, from: cached),
           let first = decoded.property?.first {
            return .success(toRaw(first, address: address))
        }

        guard let url = buildURL(address: address) else { return .failure(.invalidResponse) }
        var request = URLRequest(url: url)
        request.setValue(apiKey!, forHTTPHeaderField: "apikey")

        do {
            let (data, response) = try await session.data(for: request)
            if let http = response as? HTTPURLResponse {
                if http.statusCode == 429 { return .failure(.rateLimited(retryAfter: nil)) }
                if http.statusCode == 401 || http.statusCode == 403 { return .failure(.authenticationFailed) }
                if http.statusCode != 200 { return .failure(.invalidResponse) }
            }
            let decoded = try decoder.decode(ATTOMPropertyResponse.self, from: data)
            guard let first = decoded.property?.first else { return .failure(.notFound) }
            cache?.set(cacheKey, data: data, ttl: cacheTTL)
            return .success(toRaw(first, address: address))
        } catch {
            return .failure(.networkError(underlying: error))
        }
    }

    private func buildURL(address: NormalizedAddress) -> URL? {
        var comp = URLComponents(string: "https://api.gateway.attomdata.com/v4/property/expandedprofile")
        comp?.queryItems = [
            URLQueryItem(name: "address1", value: address.streetAddress),
            URLQueryItem(name: "city", value: address.city),
            URLQueryItem(name: "state", value: address.state),
            URLQueryItem(name: "zip", value: address.postalCode),
        ]
        return comp?.url
    }

    private func toRaw(_ p: ATTOMProperty, address: NormalizedAddress) -> RawPropertyData {
        let apn = p.identifier?.apn ?? address.postalCode
        var raw = RawPropertyData(source: .attom, externalID: apn, fetchedAt: Date(), rawPayload: Data())
        raw.streetAddress = p.address?.line1 ?? address.streetAddress
        raw.city = p.address?.city ?? address.city
        raw.state = p.address?.state ?? address.state
        raw.postalCode = p.address?.postalCode ?? address.postalCode
        raw.bedrooms = p.building?.rooms?.beds
        raw.bathrooms = p.building?.rooms?.baths
        raw.squareFeet = p.building?.size ?? p.area?.buildingSize ?? p.area?.totalSize
        raw.lotSizeSqFt = p.lot?.lotSize
        raw.yearBuilt = p.building?.yearBuilt
        return raw
    }
}
