//
//  EmptyStateView.swift
//  PropFolio
//
//  Empty state: icon/title/message and optional action. Use for empty lists and zero-state screens.
//

import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    @Environment(\.appTheme) private var theme

    var body: some View {
        VStack(spacing: AppSpacing.l) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(theme.textTertiary)
            VStack(spacing: AppSpacing.xs) {
                Text(title)
                    .font(AppTypography.title3)
                    .foregroundColor(theme.textPrimary)
                    .multilineTextAlignment(.center)
                Text(message)
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
                    .multilineTextAlignment(.center)
            }
            if let actionTitle = actionTitle, let action = action {
                PrimaryButton(title: actionTitle, action: action)
                    .padding(.top, AppSpacing.xs)
                    .frame(maxWidth: 280)
            }
        }
        .padding(AppSpacing.xxl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(message)")
    }
}

// MARK: - Previews

#Preview("EmptyState") {
    EmptyStateView(
        icon: "tray",
        title: "No properties yet",
        message: "Add a property from Zillow, Redfin, or by address to start analyzing deals.",
        actionTitle: "Add property",
        action: {}
    )
    .appThemeFromColorScheme()
}

#Preview("EmptyState no action") {
    EmptyStateView(
        icon: "chart.bar.xaxis",
        title: "No analyses",
        message: "Run an analysis on a property to see metrics here."
    )
    .appThemeFromColorScheme()
}
