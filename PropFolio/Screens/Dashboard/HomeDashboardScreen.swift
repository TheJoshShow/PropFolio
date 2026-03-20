//
//  HomeDashboardScreen.swift
//  PropFolio
//
//  Home / Dashboard: recent analyses, quick import CTA, featured metrics, confidence teaser, portfolio snapshot.
//  Uses structured mock data; replace with view state from API when wired.
//

import SwiftUI

struct HomeDashboardScreen: View {
    @Environment(\.appTheme) private var theme

    private let confidenceTeaser = HomeMockData.confidenceTeaser
    private let featuredMetrics = HomeMockData.featuredMetrics
    private let portfolioSnapshot = HomeMockData.portfolioSnapshot
    private let recentAnalyses = HomeMockData.recentAnalyses

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                heroValueProp
                quickImportCTA
                confidenceMeterTeaserSection
                featuredMetricsSection
                recentAnalysesSection
                portfolioSnapshotSection
            }
            .padding(.horizontal, AppSpacing.m)
            .padding(.bottom, AppSpacing.xxl)
        }
        .background(theme.background)
        .navigationTitle("Home")
        .navigationBarTitleDisplayMode(.large)
    }

    // MARK: - Hero / value prop

    private var heroValueProp: some View {
        Text("Should I buy this property?")
            .font(AppTypography.title2)
            .foregroundColor(theme.textPrimary)
    }

    // MARK: - Quick import CTA

    private var quickImportCTA: some View {
        AppCard(padding: AppSpacing.l, useShadow: true) {
            VStack(alignment: .leading, spacing: AppSpacing.s) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(theme.primary)
                    Text("Add a property")
                        .font(AppTypography.headline)
                        .foregroundColor(theme.textPrimary)
                }
                Text("Paste a Zillow or Redfin link, or enter an address to score your next deal.")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
                PrimaryButton(title: "Import property", action: {
                    NotificationCenter.default.post(name: .switchToImportTab, object: nil)
                })
            }
        }
    }

    // MARK: - Confidence meter teaser

    private var confidenceMeterTeaserSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            sectionHeader("Confidence", subtitle: "Your latest analysis")
            ConfidenceMeterTeaserView(teaser: confidenceTeaser, onTap: {})
        }
    }

    // MARK: - Featured metrics

    private var featuredMetricsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            sectionHeader("Featured metrics", subtitle: "From latest analysis")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.s) {
                    if let noi = featuredMetrics.noi {
                        MetricChip(label: "NOI", value: formatCurrency(noi))
                    }
                    if let cap = featuredMetrics.capRatePercent {
                        MetricChip(label: "Cap rate", value: formatPercent(cap))
                    }
                    if let cf = featuredMetrics.cashFlow {
                        MetricChip(label: "Cash flow", value: formatCurrency(cf))
                    }
                }
                .padding(.trailing, AppSpacing.m)
            }
        }
    }

    // MARK: - Recent analyses

    private var recentAnalysesSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            sectionHeader("Recent analyses", subtitle: nil)
            VStack(spacing: AppSpacing.xs) {
                ForEach(recentAnalyses) { analysis in
                    RecentAnalysisRow(analysis: analysis)
                }
            }
        }
    }

    // MARK: - Portfolio snapshot

    private var portfolioSnapshotSection: some View {
        AppCard(padding: AppSpacing.l, useShadow: true) {
            VStack(alignment: .leading, spacing: AppSpacing.s) {
                HStack {
                    Image(systemName: "building.2.fill")
                        .font(.system(size: 22))
                        .foregroundColor(theme.primary)
                    Text("Portfolio snapshot")
                        .font(AppTypography.headline)
                        .foregroundColor(theme.textPrimary)
                }
                Text("\(portfolioSnapshot.propertyCount) propert\(portfolioSnapshot.propertyCount == 1 ? "y" : "ies")")
                    .font(AppTypography.metricLarge)
                    .foregroundColor(theme.textPrimary)
                if let name = portfolioSnapshot.portfolioName {
                    Text(name)
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textSecondary)
                }
                if let address = portfolioSnapshot.latestPropertyAddress {
                    Text("Latest: \(address)")
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textTertiary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
            }
        }
    }

    // MARK: - Helpers

    private func sectionHeader(_ title: String, subtitle: String?) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(title)
                .font(AppTypography.title3)
                .foregroundColor(theme.textPrimary)
            if let subtitle = subtitle {
                Text(subtitle)
                    .font(AppTypography.caption)
                    .foregroundColor(theme.textSecondary)
            }
        }
    }

    private func formatCurrency(_ value: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        formatter.minimumFractionDigits = 0
        return formatter.string(from: value as NSDecimalNumber) ?? "$0"
    }

    private func formatPercent(_ value: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 1
        formatter.maximumFractionDigits = 1
        let s = formatter.string(from: value as NSDecimalNumber) ?? "0"
        return "\(s)%"
    }
}

// MARK: - Recent analysis row

private struct RecentAnalysisRow: View {
    let analysis: AnalysisSummary
    @Environment(\.appTheme) private var theme

    var body: some View {
        Button {} label: {
            HStack(spacing: AppSpacing.s) {
                VStack(alignment: .leading, spacing: AppSpacing.xxxs) {
                    Text(analysis.propertyAddress)
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textPrimary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    Text(analysis.name)
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if let score = analysis.confidenceScore {
                    MetricChipConfidence(
                        label: "Score",
                        value: "\(NSDecimalNumber(decimal: score).intValue)",
                        confidence: (analysis.confidenceGrade ?? .medium).confidenceLevel
                    )
                }
                Text(analysis.primaryMetricDisplay)
                    .font(AppTypography.caption)
                    .foregroundColor(theme.textSecondary)
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(theme.textTertiary)
            }
            .padding(AppSpacing.s)
            .frame(minHeight: 44)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .fill(theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .stroke(theme.border, lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(analysis.propertyAddress), \(analysis.primaryMetricDisplay)")
    }
}

// MARK: - Previews

#Preview("Dashboard light") {
    NavigationStack {
        HomeDashboardScreen()
    }
    .appThemeFromColorScheme()
}

#Preview("Dashboard dark") {
    NavigationStack {
        HomeDashboardScreen()
    }
    .appThemeFromColorScheme()
    .preferredColorScheme(.dark)
}
