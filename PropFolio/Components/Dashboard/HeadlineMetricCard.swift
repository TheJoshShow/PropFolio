//
//  HeadlineMetricCard.swift
//  PropFolio
//
//  Compact metric card for small screens: label + value. Used in analysis dashboard headline metrics grid.
//

import SwiftUI

struct HeadlineMetricCard: View {
    let label: String
    let value: String
    var valueColor: Color? = nil

    @Environment(\.appTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            Text(label)
                .font(AppTypography.caption2)
                .foregroundColor(theme.textSecondary)
            Text(value)
                .font(AppTypography.metric)
                .foregroundColor(valueColor ?? theme.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.s)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.m)
                .fill(theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.m)
                .stroke(theme.border, lineWidth: 0.5)
        )
    }
}

#Preview("HeadlineMetricCard") {
    HStack(spacing: AppSpacing.xs) {
        HeadlineMetricCard(label: "NOI", value: "$18,400")
        HeadlineMetricCard(label: "Cap rate", value: "6.2%")
    }
    .padding()
    .appThemeFromColorScheme()
}
