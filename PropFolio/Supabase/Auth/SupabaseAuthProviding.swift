//
//  SupabaseAuthProviding.swift
//  PropFolio
//
//  Auth operations using Supabase client. Email sign-in/sign-up is implemented;
//  Apple Sign In is a placeholder — enable in Supabase Dashboard and implement
//  native Sign in with Apple (ASAuthorizationController) then call signInWithIdToken.
//

import Foundation
import Supabase

/// Auth operations. Use from Services/Sync; do not put business logic here.
struct SupabaseAuthProviding {
    
    private var client: Supabase.SupabaseClient? {
        SupabaseClient.instance?.client
    }
    
    // MARK: - Email
    
    /// Sign up with email and password.
    func signUp(email: String, password: String) async throws -> AuthResponse {
        guard let client = client else { throw AuthError.notConfigured }
        return try await client.auth.signUp(email: email, password: password)
    }
    
    /// Sign in with email and password.
    func signIn(email: String, password: String) async throws -> Session {
        guard let client = client else { throw AuthError.notConfigured }
        return try await client.auth.signIn(email: email, password: password)
    }
    
    /// Sign out current session.
    func signOut() async throws {
        try await client?.auth.signOut()
    }
    
    /// Current session if any.
    var currentSession: Session? {
        get async {
            try? await client?.auth.session
        }
    }
    
    /// Observe auth state changes (e.g. sign in / sign out).
    var authStateChanges: AsyncStream<AuthChangeEvent> {
        guard let client = client else { return AsyncStream { $0.finish() } }
        return client.auth.authStateChanges
    }
    
    // MARK: - Apple (placeholder)
    
    /// Sign in with Apple — placeholder. Implement when Apple provider is enabled in Supabase:
    /// 1. Enable Apple in Supabase Dashboard → Auth → Providers.
    /// 2. Add Sign in with Apple capability in Xcode.
    /// 3. Use ASAuthorizationController to get identity token and full name (first time only).
    /// 4. Call this with the idToken (and nonce if you generated one).
    /// 5. Optionally update user with full name via client.auth.update(user: .init(...))
    func signInWithApple(idToken: String, nonce: String? = nil) async throws -> Session {
        guard let client = client else { throw AuthError.notConfigured }
        let credentials = OpenIDConnectCredentials(provider: .apple, idToken: idToken)
        return try await client.auth.signInWithIdToken(credentials: credentials)
    }
    
    enum AuthError: LocalizedError {
        case notConfigured
        
        var errorDescription: String? {
            "Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY."
        }
    }
}
