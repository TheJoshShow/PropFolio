//
//  AppConfiguration.swift
//  PropFolio
//
//  Typed service configuration. Loads from environment variables (scheme / CI) then
//  falls back to Info.plist. Never logs or prints secret values.
//

import Foundation

/// App-wide configuration. Load from environment or Info.plist; never commit secrets.
enum AppConfiguration {
    
    /// Supabase project URL (e.g. https://xxx.supabase.co)
    static var supabaseURL: URL? {
        string(forKey: "SUPABASE_URL").flatMap { URL(string: $0) }
    }
    
    /// Supabase anon (public) key. Safe for client; never use service_role in the app.
    static var supabaseAnonKey: String? {
        string(forKey: "SUPABASE_ANON_KEY")
    }
    
    /// Environment label for logging (e.g. "development", "staging", "production"). Never log secrets.
    static var environment: String {
        string(forKey: "PROPFOLIO_ENV") ?? "development"
    }
    
    /// Whether Supabase is configured (URL + key present and non-placeholder).
    static var isSupabaseConfigured: Bool {
        guard let url = supabaseURL, let key = supabaseAnonKey else { return false }
        let keyTrimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        return !keyTrimmed.isEmpty && !keyTrimmed.lowercased().hasPrefix("your-") && !keyTrimmed.contains("placeholder")
    }

    /// Zillow API key for property data adapter. When nil, ZillowAdapter.isAvailable == false.
    static var zillowAPIKey: String? { string(forKey: "ZILLOW_API_KEY") }

    /// Redfin configured (e.g. backend proxy enabled). When false, RedfinAdapter.isAvailable == false.
    static var isRedfinConfigured: Bool { string(forKey: "REDFIN_ENABLED")?.lowercased() == "true" }

    /// Google Places API key (autocomplete + address validation). When nil, Google adapters are skipped.
    static var googlePlacesAPIKey: String? { string(forKey: "GOOGLE_PLACES_API_KEY") }

    /// RentCast API key. When nil, RentCastAdapter is skipped.
    static var rentCastAPIKey: String? { string(forKey: "RENTCAST_API_KEY") }

    /// ATTOM API key (or equivalent parcel provider). When nil, ATTOMAdapter is skipped.
    static var attomAPIKey: String? { string(forKey: "ATTOM_API_KEY") }

    /// Public market data: backend URL for market context (zip/county). When nil, use cached/static only.
    static var publicMarketDataURL: String? { string(forKey: "PUBLIC_MARKET_DATA_URL") }
    
    // MARK: - Private loading (env first, then Info.plist)
    
    private static func string(forKey key: String) -> String? {
        if let value = ProcessInfo.processInfo.environment[key], !value.isEmpty {
            return value
        }
        return Bundle.main.object(forInfoDictionaryKey: key) as? String
    }
}

// MARK: - Safe description (redact secrets in logs)

extension AppConfiguration {
    /// Use for debugging only; never logs keys or URLs.
    static var safeDescription: String {
        "AppConfiguration(environment: \(environment), supabaseConfigured: \(isSupabaseConfigured), supabaseURL: \(supabaseURL != nil ? "<set>" : "<missing>"))"
    }
}
