//
//  PortfolioDealCard.swift
//  PropFolio
//
//  Strong card for a saved deal: address, score/confidence, key metrics, status, recent update.
//

import SwiftUI

struct PortfolioDealCard: View {
    let deal: PortfolioDeal
    var onTap: () -> Void = {}

    @Environment(\.appTheme) private var theme

    var body: some View {
        Button(action: onTap) {
            AppCard(padding: AppSpacing.m, useShadow: true) {
                VStack(alignment: .leading, spacing: AppSpacing.s) {
                    headerRow
                    scoreAndConfidenceRow
                    metricsRow
                    footerRow
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabelText)
    }

    private var headerRow: some View {
        HStack(alignment: .top, spacing: AppSpacing.s) {
            VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                Text(deal.propertyAddress)
                    .font(AppTypography.headline)
                    .foregroundColor(theme.textPrimary)
                    .lineLimit(2)
                    .truncationMode(.tail)
                if !deal.analysisName.isEmpty {
                    Text(deal.analysisName)
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textSecondary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            statusBadge
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(theme.textTertiary)
        }
    }

    private var statusBadge: some View {
        Text(deal.status.shortLabel)
            .font(AppTypography.caption2)
            .foregroundColor(theme.primary)
            .padding(.horizontal, AppSpacing.xs)
            .padding(.vertical, AppSpacing.xxs)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.s)
                    .fill(theme.primary.opacity(0.12))
            )
    }

    private var scoreAndConfidenceRow: some View {
        HStack(alignment: .center, spacing: AppSpacing.m) {
            HStack(spacing: AppSpacing.xs) {
                if let score = deal.dealScore {
                    HStack(spacing: AppSpacing.xxs) {
                        Text("Score")
                            .font(AppTypography.caption)
                            .foregroundColor(theme.textSecondary)
                        Text("\(score)")
                            .font(AppTypography.title3)
                            .foregroundColor(theme.textPrimary)
                        Text("/ 100")
                            .font(AppTypography.caption)
                            .foregroundColor(theme.textTertiary)
                    }
                    Text(deal.dealArchetype.badgeCopy)
                        .font(AppTypography.caption)
                        .foregroundColor(theme.primary)
                } else {
                    Text("Score")
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textSecondary)
                    Text("—")
                        .font(AppTypography.title3)
                        .foregroundColor(theme.textTertiary)
                }
            }
            Spacer(minLength: 0)
            if let conf = deal.confidenceScore {
                MetricChipConfidence(
                    label: "Confidence",
                    value: "\(conf)",
                    confidence: deal.confidenceGrade.confidenceLevel
                )
            }
        }
    }

    private var metricsRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppSpacing.s) {
                if let noi = deal.noi {
                    MetricChip(label: "NOI", value: formatCurrency(noi))
                }
                if let cap = deal.capRatePercent {
                    MetricChip(label: "Cap rate", value: formatPercent(cap))
                }
                if let cf = deal.annualCashFlow {
                    MetricChip(label: "Cash flow", value: formatCurrency(cf))
                }
            }
            .padding(.trailing, AppSpacing.xxs)
        }
    }

    private var footerRow: some View {
        Text("Updated \(deal.updatedAtRelative)")
            .font(AppTypography.caption2)
            .foregroundColor(theme.textTertiary)
    }

    private func formatCurrency(_ value: Decimal) -> String {
        let n = (value as NSDecimalNumber).doubleValue
        return String(format: "$%.0f", n)
    }

    private func formatPercent(_ value: Decimal) -> String {
        let n = (value as NSDecimalNumber).doubleValue
        return String(format: "%.1f%%", n)
    }

    private var accessibilityLabelText: String {
        var parts = [deal.propertyAddress]
        if let s = deal.dealScore { parts.append("Score \(s)") }
        parts.append(deal.dealArchetype.badgeCopy)
        parts.append("Updated \(deal.updatedAtRelative)")
        return parts.joined(separator: ", ")
    }
}

// MARK: - Previews

#Preview("Deal card") {
    PortfolioDealCard(deal: PortfolioMockData.sampleDeals[0])
        .padding()
        .background(Color(uiColor: .systemGroupedBackground))
        .appThemeFromColorScheme()
}

#Preview("Deal card risky") {
    PortfolioDealCard(deal: PortfolioMockData.sampleDeals[3])
        .padding()
        .background(Color(uiColor: .systemGroupedBackground))
        .appThemeFromColorScheme()
}
