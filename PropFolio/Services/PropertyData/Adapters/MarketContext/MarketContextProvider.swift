//
//  MarketContextProvider.swift
//  PropFolio
//
//  Protocol and adapter for market context (public datasets or backend). Call after property geography known; skip when URL nil.
//

import Foundation

/// Provides market context by geography. Call when: need market stats for zip/county/state; skip when: URL nil or cache hit.
protocol MarketContextProvider: Sendable {
    var isAvailable: Bool { get }
    func getMarketContext(geography: MarketGeography) async -> Result<MarketContextResult, AdapterError>
}

/// Fetches market context from a backend URL (e.g. proxy to public datasets). Cache 24h.
final class BackendMarketContextAdapter: MarketContextProvider, @unchecked Sendable {
    private let baseURL: String?
    private let session: URLSession
    private let cache: ProviderResponseCache?
    private let cacheTTL: TimeInterval

    static let defaultCacheTTL: TimeInterval = 24 * 3600

    init(
        baseURL: String? = nil,
        session: URLSession = .shared,
        cache: ProviderResponseCache? = InMemoryProviderResponseCache(),
        cacheTTL: TimeInterval = BackendMarketContextAdapter.defaultCacheTTL
    ) {
        self.baseURL = baseURL?.isEmpty == true ? nil : baseURL
        self.session = session
        self.cache = cache
        self.cacheTTL = cacheTTL
    }

    var isAvailable: Bool { baseURL != nil }

    func getMarketContext(geography: MarketGeography) async -> Result<MarketContextResult, AdapterError> {
        guard isAvailable else { return .failure(.providerUnavailable) }

        let key = geography.cacheKey
        if let cached = cache?.get(key),
           let decoded = try? JSONDecoder().decode(MarketContextResponse.self, from: cached) {
            // Only track API calls for cost/usage; cache hits are not billed.
            return .success(toResult(decoded, geography: geography))
        }

        guard let url = buildURL(geography: geography) else { return .failure(.invalidResponse) }
        do {
            let (data, response) = try await session.data(for: URLRequest(url: url))
            if let http = response as? HTTPURLResponse {
                if http.statusCode == 429 { return .failure(.rateLimited(retryAfter: nil)) }
                if http.statusCode != 200 { return .failure(.invalidResponse) }
            }
            let decoded = try JSONDecoder().decode(MarketContextResponse.self, from: data)
            cache?.set(key, data: data, ttl: cacheTTL)
            Task {
                await UsageTrackingService.shared.trackFutureValuePredictorCall(
                    geographyZip: geography.postalCode,
                    geographyCountyFips: geography.countyFips,
                    geographyState: geography.state,
                    fromCache: false
                )
            }
            return .success(toResult(decoded, geography: geography))
        } catch {
            return .failure(.networkError(underlying: error))
        }
    }

    private func buildURL(geography: MarketGeography) -> URL? {
        var comp = URLComponents(string: baseURL! + "/market")
        comp?.queryItems = [
            geography.postalCode.map { URLQueryItem(name: "zip", value: $0) },
            geography.countyFips.map { URLQueryItem(name: "countyFips", value: $0) },
            URLQueryItem(name: "state", value: geography.state),
        ].compactMap { $0 }
        return comp?.url
    }

    private func toResult(_ r: MarketContextResponse, geography: MarketGeography) -> MarketContextResult {
        MarketContextResult(
            geography: geography,
            medianListPrice: r.medianListPrice,
            medianRent: r.medianRent,
            inventoryCount: r.inventoryCount,
            daysOnMarket: r.daysOnMarket,
            source: .publicMarket,
            fetchedAt: Date()
        )
    }
}
