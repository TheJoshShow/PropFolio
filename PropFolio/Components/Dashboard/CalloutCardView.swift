//
//  CalloutCardView.swift
//  PropFolio
//
//  Risk (warning) or opportunity (positive) callout. Clear hierarchy for scanning.
//

import SwiftUI

struct CalloutCardView: View {
    let callout: AnalysisCallout

    @Environment(\.appTheme) private var theme

    private var accentColor: Color {
        callout.isRisk ? theme.warning : theme.success
    }

    private var iconName: String {
        callout.isRisk ? "exclamationmark.triangle.fill" : "arrow.up.circle.fill"
    }

    var body: some View {
        HStack(alignment: .top, spacing: AppSpacing.s) {
            Image(systemName: iconName)
                .font(.system(size: 20))
                .foregroundColor(accentColor)
                .frame(width: 24, height: 24)
            VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                Text(callout.title)
                    .font(AppTypography.headline)
                    .foregroundColor(theme.textPrimary)
                Text(callout.body)
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(AppSpacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.l)
                .fill(accentColor.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.l)
                .stroke(accentColor.opacity(0.35), lineWidth: 0.5)
        )
    }
}

#Preview("Risk") {
    CalloutCardView(callout: AnalysisCallout(
        title: "DSCR is tight",
        body: "At 1.15 you have limited cushion if rent drops. Consider a larger down payment or lower offer.",
        isRisk: true
    ))
    .padding()
    .appThemeFromColorScheme()
}

#Preview("Opportunity") {
    CalloutCardView(callout: AnalysisCallout(
        title: "Strong cap rate",
        body: "6.2% is above typical for this market. Income relative to price looks solid.",
        isRisk: false
    ))
    .padding()
    .appThemeFromColorScheme()
}
