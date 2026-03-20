//
//  ProviderAdapterFactory.swift
//  PropFolio
//
//  Build first-pass adapters from AppConfiguration. Single shared cache instance for cost control.
//

import Foundation

/// Creates provider adapters with config and optional shared response cache.
enum ProviderAdapterFactory {

    private static let sharedResponseCache: ProviderResponseCache = InMemoryProviderResponseCache()

    /// Google Places autocomplete. Use when GOOGLE_PLACES_API_KEY is set.
    static func googlePlacesAutocomplete(
        cache: ProviderResponseCache? = sharedResponseCache
    ) -> AddressAutocompleteProvider {
        GooglePlacesAutocompleteAdapter(
            apiKey: AppConfiguration.googlePlacesAPIKey,
            cache: cache,
            cacheTTL: 300,
            minCharacters: 3
        )
    }

    /// RentCast rent estimate. Use when RENTCAST_API_KEY is set.
    static func rentCast(
        cache: ProviderResponseCache? = sharedResponseCache
    ) -> RentEstimateProvider {
        RentCastAdapter(
            apiKey: AppConfiguration.rentCastAPIKey,
            cache: cache,
            cacheTTL: RentCastAdapter.defaultCacheTTL
        )
    }

    /// ATTOM parcel/property. Use when ATTOM_API_KEY is set.
    static func attom(
        cache: ProviderResponseCache? = sharedResponseCache
    ) -> PropertyDataAdapter {
        ATTOMAdapter(
            apiKey: AppConfiguration.attomAPIKey,
            cache: cache,
            cacheTTL: ATTOMAdapter.defaultCacheTTL
        )
    }

    /// Public market context. Use when PUBLIC_MARKET_DATA_URL is set.
    static func marketContext(
        cache: ProviderResponseCache? = sharedResponseCache
    ) -> MarketContextProvider {
        BackendMarketContextAdapter(
            baseURL: AppConfiguration.publicMarketDataURL,
            cache: cache,
            cacheTTL: BackendMarketContextAdapter.defaultCacheTTL
        )
    }
}
