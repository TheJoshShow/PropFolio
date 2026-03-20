//
//  AuthConfiguration.swift
//  PropFolio
//
//  Auth provider configuration. Email is supported; Apple Sign In is a placeholder
//  until Apple provider is enabled in Supabase Dashboard and native flow is wired.
//

import Foundation

/// Supported auth methods. Used by UI and Services/Sync.
enum AuthProvider: String, CaseIterable {
    case email = "email"
    case apple = "apple"
    
    var displayName: String {
        switch self {
        case .email: return "Email"
        case .apple: return "Sign in with Apple"
        }
    }
    
    /// Apple requires Supabase Dashboard → Auth → Providers → Apple to be enabled and native flow in the app.
    var isPlaceholder: Bool {
        switch self {
        case .email: return false
        case .apple: return true
        }
    }
}
