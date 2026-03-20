//
//  ServiceConfiguration.swift
//  PropFolio
//
//  Typed configuration for backend services. Add keys here as needed; load via
//  AppConfiguration or keep service-specific keys in this type.
//

import Foundation

/// Typed configuration for Supabase and other backend services.
struct ServiceConfiguration {
    
    struct Supabase {
        let url: URL
        let anonKey: String
        
        /// Fails if URL or key are missing/invalid. Use for initializing the client once at launch.
        static func current() throws -> Supabase {
            guard let url = AppConfiguration.supabaseURL else {
                throw ConfigurationError.missingKey("SUPABASE_URL")
            }
            guard let key = AppConfiguration.supabaseAnonKey, !key.isEmpty,
                  !key.lowercased().hasPrefix("your-"), !key.contains("placeholder") else {
                throw ConfigurationError.missingKey("SUPABASE_ANON_KEY")
            }
            return Supabase(url: url, anonKey: key)
        }
    }
    
    enum ConfigurationError: LocalizedError {
        case missingKey(String)
        
        var errorDescription: String? {
            switch self {
            case .missingKey(let key):
                return "Configuration missing: \(key). Add it to your scheme environment or Info.plist. See README setup."
            }
        }
    }
}
