//
//  ScenarioComparisonDeltaView.swift
//  PropFolio
//
//  Side-by-side and delta summary: baseline vs comparison. Novice-friendly labels.
//

import SwiftUI

struct ScenarioComparisonDeltaView: View {
    let comparison: ScenarioComparison
    var baselineLabel: String = "Baseline"
    var comparisonLabel: String = "What-if"

    @Environment(\.appTheme) private var theme

    private var metrics: [ComparisonMetric] {
        [.noi, .capRate, .annualCashFlow, .cashOnCashReturn, .dscr, .totalCashToClose]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.m) {
            headerRow
            ForEach(metrics, id: \.rawValue) { metric in
                metricRow(metric)
            }
        }
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

    private var headerRow: some View {
        HStack(spacing: AppSpacing.s) {
            Text("Metric")
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text(baselineLabel)
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
                .frame(width: 80, alignment: .trailing)
            Text(comparisonLabel)
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
                .frame(width: 80, alignment: .trailing)
            Text("Change")
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
                .frame(width: 72, alignment: .trailing)
        }
    }

    private func metricRow(_ metric: ComparisonMetric) -> some View {
        let leftVal = value(for: metric, result: comparison.resultLeft)
        let rightVal = value(for: metric, result: comparison.resultRight)
        let delta = comparison.delta(metric: metric)
        return HStack(spacing: AppSpacing.s) {
            Text(metric.displayLabel)
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text(format(metric, leftVal))
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
                .frame(width: 80, alignment: .trailing)
            Text(format(metric, rightVal))
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textPrimary)
                .frame(width: 80, alignment: .trailing)
            deltaView(metric: metric, delta: delta)
        }
        .padding(.vertical, AppSpacing.xxs)
    }

    private func value(for metric: ComparisonMetric, result: SimulationResult) -> Decimal? {
        switch metric {
        case .noi: return result.underwriting.noi
        case .capRate: return result.underwriting.capRate
        case .monthlyCashFlow: return result.underwriting.monthlyCashFlow
        case .annualCashFlow: return result.underwriting.annualCashFlow
        case .dscr: return result.underwriting.dscr
        case .cashOnCashReturn: return result.underwriting.cashOnCashReturn
        case .totalCashToClose: return result.totalCashToClose
        case .equityInvested: return result.equityInvested
        }
    }

    private func format(_ metric: ComparisonMetric, _ value: Decimal?) -> String {
        guard let v = value else { return "—" }
        if metric.isPercent {
            return SimulatorFormatters.percent(v)
        }
        return SimulatorFormatters.currency(v)
    }

    @ViewBuilder
    private func deltaView(metric: ComparisonMetric, delta: Decimal?) -> some View {
        guard let d = delta else {
            Text("—")
                .font(AppTypography.caption)
                .foregroundColor(theme.textTertiary)
                .frame(width: 72, alignment: .trailing)
            return
        }
        let n = (d as NSDecimalNumber).doubleValue
        let color = n > 0 ? theme.success : (n < 0 ? theme.warning : theme.textSecondary)
        Text(SimulatorFormatters.deltaString(metric: metric, delta: d))
            .font(AppTypography.caption)
            .foregroundColor(color)
            .frame(width: 72, alignment: .trailing)
    }
}

#Preview("Comparison deltas") {
    let base = Scenario(name: "Base", isBaseline: true, inputs: SimulationInputs(purchasePrice: 300_000, downPaymentPercent: 25, interestRateAnnual: 0.065, monthlyRentPerUnit: 1_800, unitCount: 1))
    let comp = Scenario(name: "Higher rent", isBaseline: false, inputs: SimulationInputs(purchasePrice: 300_000, downPaymentPercent: 25, interestRateAnnual: 0.065, monthlyRentPerUnit: 2_000, unitCount: 1))
    let comparison = ScenarioManager.compare(baseline: base, comparison: comp)
    return ScenarioComparisonDeltaView(comparison: comparison, baselineLabel: "Base", comparisonLabel: "Higher rent")
        .padding()
        .appThemeFromColorScheme()
}
