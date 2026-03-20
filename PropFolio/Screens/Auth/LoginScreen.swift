//
//  LoginScreen.swift
//  PropFolio
//
//  Sign in / Sign up with email and password. Wired to SupabaseAuthProviding.
//

import SwiftUI

struct LoginScreen: View {
    @EnvironmentObject var auth: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var mode: AuthMode = .signIn

    @Environment(\.appTheme) private var theme

    enum AuthMode {
        case signIn
        case signUp
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                header
                form
                if let error = auth.errorMessage {
                    errorBanner(error)
                }
                primaryButton
                switchModeLink
            }
            .padding(.horizontal, AppSpacing.m)
            .padding(.vertical, AppSpacing.xxl)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(theme.background)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("PropFolio")
                .font(AppTypography.largeTitle)
                .foregroundColor(theme.textPrimary)
            Text("Score deals. Build confidence.")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
        }
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: AppSpacing.l) {
            AppTextField(
                label: "Email",
                text: $email,
                placeholder: "you@example.com",
                keyboardType: .emailAddress,
                autocapitalization: .never
            )
            AppTextField(
                label: "Password",
                text: $password,
                placeholder: mode == .signUp ? "Min 6 characters" : "Password",
                isSecure: true,
                autocapitalization: .never
            )
        }
    }

    private func errorBanner(_ message: String) -> some View {
        Text(message)
            .font(AppTypography.caption)
            .foregroundColor(theme.error)
            .padding(AppSpacing.s)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .fill(theme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppRadius.m)
                            .stroke(theme.error, lineWidth: 1)
                    )
            )
            .onTapGesture { auth.clearError() }
    }

    private var primaryButton: some View {
        PrimaryButton(
            title: mode == .signIn ? "Sign in" : "Create account",
            action: submit,
            isLoading: auth.isLoading,
            isEnabled: isFormValid
        )
    }

    private var switchModeLink: some View {
        Button {
            auth.clearError()
            mode = mode == .signIn ? .signUp : .signIn
        } label: {
            Text(mode == .signIn ? "Create an account" : "Already have an account? Sign in")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.primary)
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
    }

    private var isFormValid: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty && password.count >= 6
    }

    private func submit() {
        let e = email.trimmingCharacters(in: .whitespaces).lowercased()
        let p = password
        guard !e.isEmpty, p.count >= 6 else { return }
        Task {
            if mode == .signIn {
                await auth.signIn(email: e, password: p)
            } else {
                await auth.signUp(email: e, password: p)
            }
        }
    }
}

// MARK: - Previews

#Preview("Login light") {
    LoginScreen()
        .environmentObject(AuthViewModel())
        .appThemeFromColorScheme()
}

#Preview("Login dark") {
    LoginScreen()
        .environmentObject(AuthViewModel())
        .appThemeFromColorScheme()
        .preferredColorScheme(.dark)
}
