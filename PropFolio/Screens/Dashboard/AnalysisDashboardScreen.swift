//
//  AnalysisDashboardScreen.swift
//  PropFolio
//
//  Main analysis dashboard: score, archetype, confidence, future value, headline metrics,
//  explanation cards, risks/opportunities. Sticky What-If CTA. Strong hierarchy, easy scanning.
//

import SwiftUI

struct AnalysisDashboardScreen: View {
    let state: AnalysisDashboardState
    /// Source for usage tracking: "dashboard" (from home) or "portfolio" (from portfolio tab).
    var analyticsSource: String = "dashboard"
    var onConfidenceTap: (() -> Void)? = nil
    var onWhatIfTap: () -> Void = {}

    @Environment(\.appTheme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                if let addr = state.propertyAddress, !addr.isEmpty {
                    propertyAddressHeader(addr)
                }
                scoreHeroSection
                confidenceSection
                futureValueSection
                headlineMetricsSection
                explanationSection
                risksSection
                opportunitiesSection
                whatIfInlineCTA
            }
            .padding(.horizontal, AppSpacing.m)
            .padding(.top, AppSpacing.m)
            .padding(.bottom, 100)
        }
        .background(theme.background)
        .navigationTitle("Analysis")
        .navigationBarTitleDisplayMode(.large)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            stickyWhatIfBar
        }
        .onAppear {
            let hasScore = state.dealScoreResult?.totalScore != nil
            let hasConfidence = state.confidenceMeterResult != nil
            if !hasScore {
                AnalysisLogger.insufficientData(reason: DealScoreExplanations.insufficientDataReason(), propertyId: nil)
            }
            AnalysisLogger.analysisCompleted(propertyId: nil, hasScore: hasScore, hasConfidence: hasConfidence)
            Task {
                await UsageTrackingService.shared.trackAnalysisRun(
                    propertyId: nil,
                    hasScore: hasScore,
                    hasConfidence: hasConfidence,
                    source: analyticsSource
                )
            }
        }
    }

    // MARK: - Property address

    private func propertyAddressHeader(_ address: String) -> some View {
        Text(address)
            .font(AppTypography.subheadline)
            .foregroundColor(theme.textSecondary)
            .lineLimit(2)
            .truncationMode(.tail)
    }

    // MARK: - Score + archetype hero

    private var scoreHeroSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            if let result = state.dealScoreResult, let score = result.totalScore {
                Text("Deal score")
                    .font(AppTypography.caption)
                    .foregroundColor(theme.textSecondary)
                HStack(alignment: .firstTextBaseline, spacing: AppSpacing.m) {
                    Text("\(NSDecimalNumber(decimal: score).intValue)")
                        .font(.system(size: 52, weight: .bold, design: .rounded))
                        .foregroundColor(theme.textPrimary)
                    Text("/ 100")
                        .font(AppTypography.title2)
                        .foregroundColor(theme.textTertiary)
                    Spacer(minLength: 0)
                    if let arch = state.archetype, arch != .unknown {
                        archetypeBadge(arch, wasCapped: result.wasCappedByConfidence)
                    }
                }
                if let arch = state.archetype, arch != .unknown {
                    Text(arch.calloutText)
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textSecondary)
                }
                if result.wasCappedByConfidence, let qualifier = DealArchetype.qualifierWhenCapped(whenCappedByConfidence: true) {
                    Text(qualifier)
                        .font(AppTypography.caption)
                        .foregroundColor(theme.warning)
                }
            } else {
                noScorePlaceholder
            }
        }
        .padding(AppSpacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.l)
                .fill(theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.l)
                .stroke(theme.border, lineWidth: 0.5)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel(scoreHeroAccessibilityLabel)
    }

    private var scoreHeroAccessibilityLabel: String {
        guard let result = state.dealScoreResult, let score = result.totalScore else {
            return "No score yet. \(DealScoreExplanations.insufficientDataReason())"
        }
        let n = NSDecimalNumber(decimal: score).intValue
        let arch = state.archetype?.badgeCopy ?? ""
        var label = "Deal score \(n) out of 100"
        if !arch.isEmpty { label += ", \(arch)" }
        if result.wasCappedByConfidence { label += ". Score capped by low data confidence." }
        return label
    }

    private func archetypeBadge(_ arch: DealArchetype, wasCapped: Bool) -> some View {
        VStack(alignment: .trailing, spacing: AppSpacing.xxs) {
            Text(arch.badgeCopy)
                .font(AppTypography.headline)
                .foregroundColor(theme.primary)
            Text(arch.scoreRange)
                .font(AppTypography.caption2)
                .foregroundColor(theme.textTertiary)
        }
    }

    private var noScorePlaceholder: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("No score yet")
                .font(AppTypography.title3)
                .foregroundColor(theme.textPrimary)
            Text(DealScoreExplanations.insufficientDataReason())
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
        }
    }

    // MARK: - Confidence meter

    private var confidenceSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            sectionLabel("Confidence")
            Text(DealScoreExplanations.scoreVsConfidenceOneLiner())
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
            if let teaser = state.confidenceTeaser {
                ConfidenceMeterTeaserView(teaser: teaser, onTap: onConfidenceTap)
            } else {
                AppCard(padding: AppSpacing.m) {
                    Text("Run an analysis to see confidence.")
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textSecondary)
                }
            }
        }
    }

    // MARK: - Future value

    private var futureValueSection: some View {
        Group {
            if let fv = state.futureValueSummary {
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    sectionLabel("Market outlook")
                    FutureValueSummaryView(summary: fv)
                }
            }
        }
    }

    // MARK: - Headline metrics

    private var headlineMetricsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            sectionLabel("Key metrics")
            let outputs = state.underwritingOutputs
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: AppSpacing.xs),
                GridItem(.flexible(), spacing: AppSpacing.xs)
            ], spacing: AppSpacing.xs) {
                if let noi = outputs?.noi {
                    HeadlineMetricCard(label: "NOI", value: formatCurrency(noi))
                }
                if let cap = outputs?.capRate {
                    HeadlineMetricCard(label: "Cap rate", value: formatPercent(cap))
                }
                if let cf = outputs?.annualCashFlow ?? outputs?.monthlyCashFlow.map { $0 * 12 } {
                    HeadlineMetricCard(label: "Cash flow (yr)", value: formatCurrency(cf))
                }
                if let coc = outputs?.cashOnCashReturn {
                    HeadlineMetricCard(label: "Cash on cash", value: formatPercent(coc))
                }
                if let dscr = outputs?.dscr {
                    HeadlineMetricCard(label: "DSCR", value: formatDecimal(dscr))
                }
            }
        }
    }

    // MARK: - Explanation cards

    private var explanationSection: some View {
        Group {
            if let deal = state.dealScoreResult, let summary = deal.totalScore.map({ DealScoreExplanations.summary(components: deal.components, totalScore: $0, band: deal.band, wasCappedByConfidence: deal.wasCappedByConfidence) }) {
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    sectionLabel("Why this score")
                    ExplanationCardView(
                        title: "Deal score",
                        bodyText: summary,
                        icon: "star.fill"
                    )
                }
            }
            if let conf = state.confidenceMeterResult {
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    sectionLabel("Confidence summary")
                    ExplanationCardView(
                        title: ConfidenceMeterCopy.bandLabel(conf.band),
                        bodyText: conf.explanation.summary,
                        icon: "checkmark.shield"
                    )
                }
            }
        }
    }

    // MARK: - Risks & opportunities

    private var risksSection: some View {
        Group {
            if !state.risks.isEmpty {
                VStack(alignment: .leading, spacing: AppSpacing.s) {
                    sectionLabel("Risks")
                    ForEach(state.risks) { callout in
                        CalloutCardView(callout: callout)
                    }
                }
            }
        }
    }

    private var opportunitiesSection: some View {
        Group {
            if !state.opportunities.isEmpty {
                VStack(alignment: .leading, spacing: AppSpacing.s) {
                    sectionLabel("Opportunities")
                    ForEach(state.opportunities) { callout in
                        CalloutCardView(callout: callout)
                    }
                }
            }
        }
    }

    // MARK: - What-if CTA (inline)

    private var whatIfInlineCTA: some View {
        Button(action: onWhatIfTap) {
            HStack(spacing: AppSpacing.s) {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 20))
                Text("Explore what-if scenarios")
                    .font(AppTypography.headline)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundColor(theme.primary)
            .padding(AppSpacing.m)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 44)
            .contentShape(Rectangle())
            .background(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .fill(theme.primary.opacity(0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .stroke(theme.primary.opacity(0.4), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Sticky What-If bar

    private var stickyWhatIfBar: some View {
        Button(action: onWhatIfTap) {
            HStack(spacing: AppSpacing.s) {
                Image(systemName: "slider.horizontal.3")
                Text("What-if scenarios")
                    .font(AppTypography.headline)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 50)
            .contentShape(Rectangle())
            .background(theme.primary)
        }
        .buttonStyle(.plain)
        .background(theme.surface)
    }

    // MARK: - Helpers

    private func sectionLabel(_ title: String) -> some View {
        Text(title)
            .font(AppTypography.title3)
            .foregroundColor(theme.textPrimary)
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
        let pct = (value as NSDecimalNumber).doubleValue * 100
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 1
        formatter.maximumFractionDigits = 1
        return (formatter.string(from: NSNumber(value: pct)) ?? "0") + "%"
    }

    private func formatDecimal(_ value: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 1
        formatter.maximumFractionDigits = 2
        return formatter.string(from: value as NSDecimalNumber) ?? "—"
    }
}

// MARK: - Mock state for preview

private extension AnalysisDashboardState {
    static var mock: AnalysisDashboardState {
        let outputs = UnderwritingOutputs(
            noi: 18_400,
            annualCashFlow: 12_400,
            dscr: 1.35,
            capRate: 0.062,
            cashOnCashReturn: 0.068
        )
        let dealResult = DealScoreResult(
            totalScore: Decimal(82),
            band: .strong,
            components: [],
            wasCappedByConfidence: false,
            explanationSummary: "Strong deal (82/100). Strongest drivers: Cap rate and DSCR."
        )
        let confResult = ConfidenceMeterResult(
            score: Decimal(72),
            band: .medium,
            explanation: ConfidenceMeterExplanation(
                supportingFactors: ["Property data is largely complete.", "Rent estimate from a reliable source."],
                limitingFactors: ["Several inputs were manually overridden."],
                summary: "Reasonably grounded; a few gaps or overrides remain."
            ),
            recommendedActions: ["Confirm overridden inputs."]
        )
        return AnalysisDashboardState(
            propertyAddress: "123 Oak St, Austin, TX",
            dealScoreResult: dealResult,
            confidenceMeterResult: confResult,
            underwritingOutputs: outputs,
            futureValueSummary: FutureValueSummary(
                score: 62,
                bandLabel: "Moderate tailwinds",
                oneLiner: "On balance, market data leans supportive for value."
            ),
            risks: [
                AnalysisCallout(title: "DSCR is tight", body: "At 1.35 you have some cushion; consider stress-testing with a 5% rent drop.", isRisk: true)
            ],
            opportunities: [
                AnalysisCallout(title: "Strong cap rate", body: "6.2% is above typical for this market. Income relative to price looks solid.", isRisk: false)
            ]
        )
    }
}

#Preview("Analysis dashboard") {
    NavigationStack {
        AnalysisDashboardScreen(state: .mock, onWhatIfTap: {})
    }
    .appThemeFromColorScheme()
}

#Preview("Dashboard dark") {
    NavigationStack {
        AnalysisDashboardScreen(state: .mock, onWhatIfTap: {})
    }
    .appThemeFromColorScheme()
    .preferredColorScheme(.dark)
}
