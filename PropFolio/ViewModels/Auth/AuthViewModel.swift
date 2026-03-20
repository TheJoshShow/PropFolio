//
//  AuthViewModel.swift
//  PropFolio
//
//  Observes Supabase auth state; drives login gate and sign in/up from LoginScreen.
//

import Foundation
import Supabase
import SwiftUI

@MainActor
final class AuthViewModel: ObservableObject {
    /// True when Supabase is configured (URL + anon key). When false, app skips login.
    @Published private(set) var isAuthConfigured: Bool = false
    /// Non-nil when user has a valid session. When configured and nil, show LoginScreen.
    @Published private(set) var session: Session?
    @Published var errorMessage: String?
    @Published var isLoading: Bool = false

    private let auth: SupabaseAuthProviding
    private var authTask: Task<Void, Never>?

    init(auth: SupabaseAuthProviding = SupabaseAuthProviding()) {
        self.auth = auth
        self.isAuthConfigured = SupabaseClient.instance != nil
        authTask = Task { await observeAuth() }
    }

    deinit {
        authTask?.cancel()
    }

    /// When Supabase is not configured, app shows main content without login.
    var shouldShowLogin: Bool {
        isAuthConfigured && session == nil
    }

    private func observeAuth() async {
        guard isAuthConfigured else { return }
        session = await auth.currentSession
        for await _ in auth.authStateChanges {
            session = await auth.currentSession
        }
    }

    func signIn(email: String, password: String) async {
        guard isAuthConfigured else { return }
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await auth.signIn(email: email, password: password)
            // session updates via authStateChanges
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signUp(email: String, password: String) async {
        guard isAuthConfigured else { return }
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await auth.signUp(email: email, password: password)
            // Supabase may require email confirmation; session can still update
            errorMessage = "Check your email to confirm your account, then sign in."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        errorMessage = nil
        do {
            try await auth.signOut()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func clearError() {
        errorMessage = nil
    }
}
