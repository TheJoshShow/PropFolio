//
//  SupabaseClient.swift
//  PropFolio
//
//  Supabase client singleton. Initialized at launch from AppConfiguration.
//  Auth (email + Apple placeholder) is configured here; auth flows live in Services/Sync.
//

import Foundation
import Supabase

/// Shared Supabase client. Configure once at app launch; use for auth and data.
enum SupabaseClientManager {
    
    private static var _instance: SupabaseClientManager?
    
    /// Configured client. Nil if SUPABASE_URL or SUPABASE_ANON_KEY are missing or placeholder.
    static var instance: SupabaseClientManager? {
        _instance
    }
    
    /// Call from App init. Safe to call multiple times; re-initializes only if config is valid.
    static func configure() {
        guard _instance == nil else { return }
        do {
            let config = try ServiceConfiguration.Supabase.current()
            _instance = SupabaseClientManager(
                url: config.url,
                anonKey: config.anonKey
            )
        } catch {
            #if DEBUG
            print("[Supabase] Not configured: \(error.localizedDescription). \(AppConfiguration.safeDescription)")
            #endif
        }
    }
    
    let client: Supabase.SupabaseClient
    
    private init(url: URL, anonKey: String) {
        client = Supabase.SupabaseClient(
            supabaseURL: url,
            supabaseKey: anonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    storage: nil,
                    flowType: .pkce
                )
            )
        )
    }
}

/// Alias for access from Sync and auth code.
typealias SupabaseClient = SupabaseClientManager
