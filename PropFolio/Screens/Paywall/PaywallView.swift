//
//  PaywallView.swift
//  PropFolio
//
//  Shown when the user has reached the 2-import free limit. Upgrade / Restore / Manage (RevenueCat to be wired).
//

import SwiftUI

struct PaywallView: View {
    @Environment(\.appTheme) private var theme
    @Environment(\.dismiss) private var dismiss
    var importCount: Int
    var onPurchase: (() -> Void)?
    var onRestore: (() -> Void)?
    var onManageSubscription: (() -> Void)?
    var onDismiss: (() -> Void)?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                header
                limitMessage
                benefitsList
                actions
            }
            .padding(AppSpacing.m)
        }
        .background(theme.background)
        .navigationTitle("Upgrade to Pro")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Maybe later") {
                    onDismiss?()
                    dismiss()
                }
                .font(AppTypography.body)
                .foregroundColor(theme.primary)
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("You've used your \(importCount) free imports")
                .font(AppTypography.title2)
                .foregroundColor(theme.textPrimary)
            Text("Unlock unlimited property imports and full analysis with Pro.")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
        }
    }

    private var limitMessage: some View {
        HStack(spacing: AppSpacing.s) {
            Image(systemName: "square.stack.3d.up.slash")
                .font(.system(size: 22))
                .foregroundColor(theme.primary)
            Text("Free tier: 2 properties. Pro: unlimited.")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
        }
        .padding(AppSpacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.m)
                .fill(theme.surface)
        )
    }

    private var benefitsList: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            Text("Pro includes")
                .font(AppTypography.headline)
                .foregroundColor(theme.textPrimary)
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                benefitRow(icon: "building.2.fill", text: "Unlimited property imports")
                benefitRow(icon: "chart.line.uptrend.xyaxis", text: "Full underwriting & what-if")
                benefitRow(icon: "bell.badge.fill", text: "Confidence scores & insights")
            }
        }
    }

    private func benefitRow(icon: String, text: String) -> some View {
        HStack(spacing: AppSpacing.s) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(theme.primary)
                .frame(width: 24, alignment: .center)
            Text(text)
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textPrimary)
        }
    }

    private var actions: some View {
        VStack(spacing: AppSpacing.m) {
            PrimaryButton(title: "Upgrade to Pro", action: { onPurchase?() })
            SecondaryButton(title: "Restore purchases", action: { onRestore?() })
            if onManageSubscription != nil {
                Button { onManageSubscription?() } label: {
                    Text("Manage subscription")
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.primary)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

#Preview("Paywall") {
    NavigationStack {
        PaywallView(
            importCount: 2,
            onPurchase: {},
            onRestore: {},
            onManageSubscription: {},
            onDismiss: {}
        )
    }
    .appThemeFromColorScheme()
}
