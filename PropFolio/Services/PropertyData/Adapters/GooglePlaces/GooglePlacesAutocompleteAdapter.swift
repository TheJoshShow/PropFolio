//
//  GooglePlacesAutocompleteAdapter.swift
//  PropFolio
//
//  Address autocomplete via Google Places API (New). Caching and when-to-call rules reduce cost.
//

import Foundation

/// Autocomplete using Google Places. Call when: API key present, query >= minChars. Skip when: no key, rate limited.
final class GooglePlacesAutocompleteAdapter: AddressAutocompleteProvider, @unchecked Sendable {
    private let apiKey: String?
    private let session: URLSession
    private let cache: ProviderResponseCache?
    private let cacheTTL: TimeInterval
    private let minCharacters: Int

    /// Base URL for Places API (New). Use https://places.googleapis.com/ for production.
    private var baseURL: String { "https://places.googleapis.com" }

    init(
        apiKey: String? = nil,
        session: URLSession = .shared,
        cache: ProviderResponseCache? = InMemoryProviderResponseCache(),
        cacheTTL: TimeInterval = 300,
        minCharacters: Int = 3
    ) {
        self.apiKey = apiKey?.isEmpty == true ? nil : apiKey
        self.session = session
        self.cache = cache
        self.cacheTTL = cacheTTL
        self.minCharacters = minCharacters
    }

    var isAvailable: Bool { apiKey != nil }

    /// Skip when: no key, or query too short (caller should enforce min chars; we skip to avoid unnecessary work).
    func suggest(query: String) async -> Result<[AddressSuggestion], AdapterError> {
        guard isAvailable else { return .failure(.providerUnavailable) }
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard trimmed.count >= minCharacters else { return .success([]) }

        let cacheKey = "gp_ac:\(trimmed.lowercased())"
        if let cached = cache?.get(cacheKey),
           let decoded = try? JSONDecoder().decode(GooglePlacesAutocompleteResponse.self, from: cached) {
            return .success(mapToSuggestions(decoded))
        }

        var request = URLRequest(url: URL(string: "\(baseURL)/v1/places:autocomplete")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey!, forHTTPHeaderField: "X-Goog-Api-Key")
        let body: [String: Any] = ["input": trimmed]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await session.data(for: request)
            if let http = response as? HTTPURLResponse {
                if http.statusCode == 429 {
                    return .failure(.rateLimited(retryAfter: nil))
                }
                if http.statusCode == 401 || http.statusCode == 403 {
                    return .failure(.authenticationFailed)
                }
                if http.statusCode != 200 {
                    return .failure(.invalidResponse)
                }
            }
            let decoded = try JSONDecoder().decode(GooglePlacesAutocompleteResponse.self, from: data)
            let suggestions = mapToSuggestions(decoded)
            if let encoded = try? JSONEncoder().encode(decoded) {
                cache?.set(cacheKey, data: encoded, ttl: cacheTTL)
            }
            return .success(suggestions)
        } catch {
            return .failure(.networkError(underlying: error))
        }
    }

    private func mapToSuggestions(_ response: GooglePlacesAutocompleteResponse) -> [AddressSuggestion] {
        guard let suggestions = response.suggestions else { return [] }
        return suggestions.compactMap { suggestion -> AddressSuggestion? in
            guard let pred = suggestion.placePrediction else { return nil }
            let singleLine = pred.structuredFormat?.secondaryText.map { "\(pred.text.text), \($0)" } ?? pred.text.text
            let partial = PartialAddress(
                streetAddress: pred.structuredFormat?.mainText,
                city: pred.structuredFormat?.secondaryText,
                state: nil,
                postalCode: nil
            )
            return AddressSuggestion(singleLine: singleLine, partialAddress: partial, source: .googlePlaces)
        }
    }
}
