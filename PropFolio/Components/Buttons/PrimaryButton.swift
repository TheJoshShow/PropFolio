//
//  PrimaryButton.swift
//  PropFolio
//
//  Primary and secondary button styles. 44pt minimum height for touch targets.
//

import SwiftUI

struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    var isLoading: Bool = false
    var isEnabled: Bool = true

    @Environment(\.appTheme) private var theme

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.xs) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: theme.primary))
                }
                Text(title)
                    .font(AppTypography.headline)
                    .foregroundColor(isEnabled ? .white : theme.textTertiary)
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: 44)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .fill(isEnabled ? theme.primary : theme.border)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || isLoading)
        .accessibilityLabel(title)
        .accessibilityHint(isLoading ? "Loading" : "Button")
    }
}

struct SecondaryButton: View {
    let title: String
    let action: () -> Void
    var isEnabled: Bool = true

    @Environment(\.appTheme) private var theme

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(AppTypography.headline)
                .foregroundColor(isEnabled ? theme.primary : theme.textTertiary)
                .frame(maxWidth: .infinity)
                .frame(minHeight: 44)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .stroke(theme.border, lineWidth: 1.5)
                )
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityLabel(title)
    }
}

// MARK: - Previews

#Preview("Primary") {
    VStack(spacing: AppSpacing.m) {
        PrimaryButton(title: "Get started", action: {})
        PrimaryButton(title: "Loading…", action: {}, isLoading: true)
        PrimaryButton(title: "Disabled", action: {}, isEnabled: false)
    }
    .padding()
    .appThemeFromColorScheme()
}

#Preview("Secondary") {
    VStack(spacing: AppSpacing.m) {
        SecondaryButton(title: "Cancel", action: {})
        SecondaryButton(title: "Disabled", action: {}, isEnabled: false)
    }
    .padding()
    .appThemeFromColorScheme()
}
