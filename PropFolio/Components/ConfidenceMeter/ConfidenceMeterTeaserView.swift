//
//  ConfidenceMeterTeaserView.swift
//  PropFolio
//
//  Teaser for the confidence meter: score (0–100), grade color, subtitle. Tappable to open full meter.
//

import SwiftUI

struct ConfidenceMeterTeaserView: View {
    let teaser: ConfidenceMeterTeaser
    var onTap: (() -> Void)? = nil

    @Environment(\.appTheme) private var theme

    private var scoreColor: Color {
        theme.color(for: teaser.grade.confidenceLevel)
    }

    var body: some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: AppSpacing.m) {
                ZStack {
                    Circle()
                        .stroke(theme.border, lineWidth: 3)
                        .frame(width: 56, height: 56)
                    Circle()
                        .trim(from: 0, to: CGFloat(truncating: teaser.score as NSNumber) / 100)
                        .stroke(scoreColor, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .frame(width: 56, height: 56)
                        .rotationEffect(.degrees(-90))
                    Text(confidenceScoreFormatted)
                        .font(AppTypography.metric)
                        .foregroundColor(theme.textPrimary)
                }
                .frame(width: 56, height: 56)

                VStack(alignment: .leading, spacing: AppSpacing.xxxs) {
                    Text("Confidence score")
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textSecondary)
                    Text(teaser.subtitle)
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textPrimary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(theme.textTertiary)
            }
            .padding(AppSpacing.m)
            .frame(minHeight: 44)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .fill(theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .stroke(theme.border, lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Confidence score \(confidenceScoreFormatted), \(teaser.subtitle)")
        .accessibilityHint("Opens full confidence details")
    }

    private var confidenceScoreFormatted: String {
        let n = NSDecimalNumber(decimal: teaser.score).intValue
        return "\(n)"
    }
}

// MARK: - Previews

#Preview("Teaser") {
    ConfidenceMeterTeaserView(teaser: HomeMockData.confidenceTeaser)
        .padding()
        .appThemeFromColorScheme()
}

#Preview("Teaser dark") {
    ConfidenceMeterTeaserView(teaser: ConfidenceMeterTeaser(score: 45, grade: .medium, subtitle: "789 Elm Dr"))
        .padding()
        .appThemeFromColorScheme()
        .preferredColorScheme(.dark)
}
