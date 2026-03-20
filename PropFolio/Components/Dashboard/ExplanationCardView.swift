//
//  ExplanationCardView.swift
//  PropFolio
//
//  Quick explanation card: title + body. For deal summary, confidence summary, etc.
//

import SwiftUI

struct ExplanationCardView: View {
    let title: String
    let bodyText: String
    var icon: String? = nil

    @Environment(\.appTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            HStack(spacing: AppSpacing.xs) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundColor(theme.primary)
                }
                Text(title)
                    .font(AppTypography.headline)
                    .foregroundColor(theme.textPrimary)
            }
            Text(bodyText)
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.m)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.l)
                .fill(theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.l)
                .stroke(theme.border, lineWidth: 0.5)
        )
    }
}

#Preview("ExplanationCard") {
    ExplanationCardView(
        title: "Why this score",
        bodyText: "Strong deal (82/100). Strongest drivers: Cap rate and DSCR.",
        icon: "lightbulb"
    )
    .padding()
    .appThemeFromColorScheme()
}
