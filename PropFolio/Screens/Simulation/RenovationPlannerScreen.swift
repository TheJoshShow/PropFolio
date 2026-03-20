//
//  RenovationPlannerScreen.swift
//  PropFolio
//
//  Renovation planner: low-friction editing by category, immediate totals,
//  contingency and tier. Updates plan binding so simulator stays in sync.
//

import SwiftUI

struct RenovationPlannerScreen: View {
    @Binding var plan: RenovationPlan?
    var initialTier: RenovationEstimateTier = .base
    var onDismiss: (() -> Void)? = nil

    @Environment(\.appTheme) private var theme
    @State private var localPlan: RenovationPlan
    @State private var selectedTier: RenovationEstimateTier
    @State private var contingencyPercent: String = "10"

    init(plan: Binding<RenovationPlan?>, initialTier: RenovationEstimateTier = .base, onDismiss: (() -> Void)? = nil) {
        _plan = plan
        self.initialTier = initialTier
        self.onDismiss = onDismiss
        let initial = plan.wrappedValue ?? DefaultRenovationTemplates.plan()
        _localPlan = State(initialValue: initial)
        _selectedTier = State(initialValue: initialTier)
        _contingencyPercent = State(initialValue: "\(NSDecimalNumber(decimal: initial.contingencyPercent).intValue)")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                helperBanner
                tierPicker
                categorySection
                contingencySection
                totalsSection
                applyButton
            }
            .padding(.horizontal, AppSpacing.m)
            .padding(.bottom, AppSpacing.xxl)
        }
        .background(theme.background)
        .navigationTitle("Renovation budget")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            Task {
                await UsageTrackingService.shared.trackPremiumFeature(featureName: "renovation_planner", planRequired: nil)
            }
        }
        .toolbar {
            if let onDismiss = onDismiss {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onDismiss)
                }
            }
        }
        .onAppear {
            if plan == nil {
                localPlan = DefaultRenovationTemplates.plan()
            } else if let p = plan {
                localPlan = p
            }
            contingencyPercent = "\(NSDecimalNumber(decimal: localPlan.contingencyPercent).intValue)"
        }
    }

    // MARK: - Helper

    private var helperBanner: some View {
        Text("Enter estimated costs per category. Use low for minimal work, base for typical, high for premium. Total cash to close in your what-if will include this budget.")
            .font(AppTypography.subheadline)
            .foregroundColor(theme.textSecondary)
            .padding(AppSpacing.s)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .fill(theme.surface)
            )
    }

    // MARK: - Tier

    private var tierPicker: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("Estimate tier")
                .font(AppTypography.title3)
                .foregroundColor(theme.textPrimary)
            Text("Which column to use for your total budget.")
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
            Picker("Tier", selection: $selectedTier) {
                Text("Low").tag(RenovationEstimateTier.low)
                Text("Base").tag(RenovationEstimateTier.base)
                Text("High").tag(RenovationEstimateTier.high)
            }
            .pickerStyle(.segmented)
        }
    }

    // MARK: - Categories

    private var categorySection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            Text("Categories")
                .font(AppTypography.title3)
                .foregroundColor(theme.textPrimary)
            ForEach(RenovationCategory.allCases, id: \.rawValue) { category in
                categoryRowFixed(category)
            }
        }
    }

    /// Bind by category so we know which line item to update.
    private func amountBinding(for category: RenovationCategory) -> Binding<String> {
        Binding(
            get: {
                let item = localPlan.lineItem(for: category)
                guard let v = item?.value(for: selectedTier) else { return "" }
                return "\(v)"
            },
            set: { str in
                let trimmed = str.trimmingCharacters(in: .whitespaces)
                var item = localPlan.lineItem(for: category) ?? RenovationLineItem(category: category)
                if trimmed.isEmpty {
                    item.setValue(nil, for: selectedTier)
                } else if let n = Decimal(string: trimmed) {
                    item.setValue(n, for: selectedTier)
                }
                var copy = localPlan
                copy.setLineItem(item)
                localPlan = copy
            }
        )
    }

    // MARK: - Contingency

    private var contingencySection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("Contingency %")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
            Text("Extra buffer on top of category totals (e.g. 10%).")
                .font(AppTypography.caption)
                .foregroundColor(theme.textTertiary)
            TextField("10", text: $contingencyPercent)
                .font(AppTypography.body)
                .keyboardType(.decimalPad)
                .padding(AppSpacing.s)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .fill(theme.surface)
                )
                .onChange(of: contingencyPercent) { _, new in
                    if let n = Int(new), n >= 0, n <= 100 {
                        localPlan.contingencyPercent = Decimal(n)
                    }
                }
        }
    }

    // MARK: - Totals

    private var totalsSection: some View {
        AppCard(padding: AppSpacing.m) {
            VStack(alignment: .leading, spacing: AppSpacing.s) {
                totalRow("Subtotal", localPlan.subtotal(for: selectedTier))
                totalRow("+ Contingency (\(NSDecimalNumber(decimal: localPlan.contingencyPercent).intValue)%)", localPlan.contingencyAmount(for: selectedTier))
                Divider()
                totalRow("Total renovation", localPlan.total(for: selectedTier))
                    .font(AppTypography.headline)
            }
        }
    }

    private func totalRow(_ label: String, _ value: Decimal) -> some View {
        HStack {
            Text(label)
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
            Spacer()
            Text(SimulatorFormatters.currency(value))
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textPrimary)
        }
    }

    // MARK: - Apply

    private var applyButton: some View {
        PrimaryButton(title: "Apply to what-if", action: applyPlan)
    }

    private func applyPlan() {
        if let pct = Decimal(string: contingencyPercent), pct >= 0 {
            localPlan.contingencyPercent = min(100, pct)
        }
        plan = localPlan
        onDismiss?()
    }

    private func categoryRowFixed(_ category: RenovationCategory) -> some View {
        HStack(spacing: AppSpacing.s) {
            Text(category.displayName)
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
            TextField("0", text: amountBinding(for: category))
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textPrimary)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 88)
                .padding(.horizontal, AppSpacing.s)
                .padding(.vertical, AppSpacing.xs)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.s)
                        .fill(theme.surface)
                )
        }
        .padding(.vertical, AppSpacing.xxs)
    }
}

#Preview("Renovation planner") {
    struct Holder: View {
        @State var plan: RenovationPlan? = nil
        var body: some View {
            NavigationStack {
                RenovationPlannerScreen(plan: $plan)
            }
        }
    }
    return Holder()
        .appThemeFromColorScheme()
}
