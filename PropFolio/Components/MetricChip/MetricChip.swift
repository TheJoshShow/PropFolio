//
//  MetricChip.swift
//  PropFolio
//
//  Compact metric display (e.g. cap rate, NOI). Label + value; optional tint.
//

import SwiftUI

struct MetricChip: View {
    let label: String
    let value: String
    var valueColor: Color? = nil

    @Environment(\.appTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxxs) {
            Text(label)
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
            Text(value)
                .font(AppTypography.metric)
                .foregroundColor(valueColor ?? theme.textPrimary)
        }
        .padding(.horizontal, AppSpacing.s)
        .padding(.vertical, AppSpacing.xs)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.s)
                .fill(theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.s)
                .stroke(theme.border, lineWidth: 0.5)
        )
    }
}

struct MetricChipConfidence: View {
    let label: String
    let value: String
    let confidence: ConfidenceLevel

    @Environment(\.appTheme) private var theme

    var body: some View {
        MetricChip(
            label: label,
            value: value,
            valueColor: theme.color(for: confidence)
        )
    }
}

enum ConfidenceLevel {
    case high, medium, low
}

/// Map backend confidence_grade to UI confidence level (veryLow → low).
extension ConfidenceGrade {
    var confidenceLevel: ConfidenceLevel {
        switch self {
        case .high: return .high
        case .medium: return .medium
        case .low, .veryLow: return .low
        }
    }
}

extension AppTheme {
    func color(for level: ConfidenceLevel) -> Color {
        switch level {
        case .high: return confidenceHigh
        case .medium: return confidenceMedium
        case .low: return confidenceLow
        }
    }
}

// MARK: - Previews

#Preview("MetricChip") {
    HStack(spacing: AppSpacing.s) {
        MetricChip(label: "Cap rate", value: "6.2%")
        MetricChip(label: "NOI", value: "$18,400")
    }
    .padding()
    .appThemeFromColorScheme()
}

#Preview("MetricChip confidence") {
    HStack(spacing: AppSpacing.s) {
        MetricChipConfidence(label: "Score", value: "82", confidence: .high)
        MetricChipConfidence(label: "Score", value: "55", confidence: .medium)
        MetricChipConfidence(label: "Score", value: "28", confidence: .low)
    }
    .padding()
    .appThemeFromColorScheme()
}
