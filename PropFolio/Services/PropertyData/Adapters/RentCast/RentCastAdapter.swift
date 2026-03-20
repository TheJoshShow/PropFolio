//
//  RentCastAdapter.swift
//  PropFolio
//
//  Rent and property info via RentCast API. Caching reduces cost; call after address is known.
//

import Foundation

/// RentCast adapter. Call when: address known, need rent; skip when: no API key, rate limited, or cache hit.
final class RentCastAdapter: RentEstimateProvider, @unchecked Sendable {
    private let apiKey: String?
    private let session: URLSession
    private let cache: ProviderResponseCache?
    private let cacheTTL: TimeInterval

    /// 7 days: rent estimates change infrequently.
    static let defaultCacheTTL: TimeInterval = 7 * 24 * 3600

    init(
        apiKey: String? = nil,
        session: URLSession = .shared,
        cache: ProviderResponseCache? = InMemoryProviderResponseCache(),
        cacheTTL: TimeInterval = RentCastAdapter.defaultCacheTTL
    ) {
        self.apiKey = apiKey?.isEmpty == true ? nil : apiKey
        self.session = session
        self.cache = cache
        self.cacheTTL = cacheTTL
    }

    var source: DataSource { .rentcast }
    var isAvailable: Bool { apiKey != nil }

    func getRentEstimate(for address: NormalizedAddress) async -> Result<RentEstimateResult, AdapterError> {
        guard isAvailable else { return .failure(.providerUnavailable) }

        let cacheKey = "rentcast:\(address.streetAddress):\(address.city):\(address.state):\(address.postalCode)"
        let decoder = JSONDecoder()
        if let cached = cache?.get(cacheKey),
           let decoded = try? decoder.decode(RentCastResponse.self, from: cached) {
            return .success(toResult(decoded))
        }

        guard let url = buildURL(address: address) else { return .failure(.invalidResponse) }
        var request = URLRequest(url: url)
        request.setValue(apiKey!, forHTTPHeaderField: "x-api-key")

        do {
            let (data, response) = try await session.data(for: request)
            if let http = response as? HTTPURLResponse {
                if http.statusCode == 429 { return .failure(.rateLimited(retryAfter: nil)) }
                if http.statusCode == 401 || http.statusCode == 403 { return .failure(.authenticationFailed) }
                if http.statusCode != 200 { return .failure(.invalidResponse) }
            }
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            let decoded = try decoder.decode(RentCastResponse.self, from: data)
            cache?.set(cacheKey, data: data, ttl: cacheTTL)
            return .success(toResult(decoded))
        } catch {
            return .failure(.networkError(underlying: error))
        }
    }

    private func buildURL(address: NormalizedAddress) -> URL? {
        var comp = URLComponents(string: "https://api.rentcast.io/v1/avm/rent")
        comp?.queryItems = [
            URLQueryItem(name: "address", value: address.streetAddress),
            URLQueryItem(name: "city", value: address.city),
            URLQueryItem(name: "state", value: address.state),
            URLQueryItem(name: "zipCode", value: address.postalCode),
        ]
        return comp?.url
    }

    private func toResult(_ r: RentCastResponse) -> RentEstimateResult {
        RentEstimateResult(
            rent: r.rent,
            rangeLow: r.rentRangeLow,
            rangeHigh: r.rentRangeHigh,
            source: .rentcast,
            fetchedAt: Date()
        )
    }
}
