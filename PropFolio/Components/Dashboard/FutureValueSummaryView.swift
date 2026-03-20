//
//  FutureValueSummaryView.swift
//  PropFolio
//
//  Compact future value predictor summary: band label, optional score, one-liner.
//

import SwiftUI

struct FutureValueSummaryView: View {
    let summary: FutureValueSummary

    @Environment(\.appTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            HStack(spacing: AppSpacing.xs) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 14))
                    .foregroundColor(theme.primary)
                Text("Market outlook")
                    .font(AppTypography.caption)
                    .foregroundColor(theme.textSecondary)
                if let score = summary.score {
                    Text("·")
                        .foregroundColor(theme.textTertiary)
                    Text("\(score)/100")
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textPrimary)
                }
            }
            Text(summary.bandLabel)
                .font(AppTypography.headline)
                .foregroundColor(theme.textPrimary)
            Text(summary.oneLiner)
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

#Preview("Future value summary") {
    FutureValueSummaryView(summary: FutureValueSummary(
        score: 62,
        bandLabel: "Moderate tailwinds",
        oneLiner: "On balance, market data leans supportive for value."
    ))
    .padding()
    .appThemeFromColorScheme()
}
