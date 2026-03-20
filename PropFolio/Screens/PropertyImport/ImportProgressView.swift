//
//  ImportProgressView.swift
//  PropFolio
//
//  Full-screen progress: clear status message and spinner. Native iOS feel.
//

import SwiftUI

struct ImportProgressView: View {
    @Environment(\.appTheme) private var theme
    var statusMessage: String

    var body: some View {
        VStack(spacing: AppSpacing.xl) {
            ProgressView()
                .scaleEffect(1.2)
                .tint(theme.primary)
            Text(statusMessage)
                .font(AppTypography.headline)
                .foregroundColor(theme.textPrimary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.background)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Import in progress. \(statusMessage)")
    }
}

#Preview("Import progress") {
    ImportProgressView(statusMessage: "Looking up property…")
        .appThemeFromColorScheme()
}
