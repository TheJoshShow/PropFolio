//
//  WhatIfSimulatorScreen.swift
//  PropFolio
//
//  What-if simulator: sliders and compact fields, immediate metric updates,
//  baseline/compare, novice-friendly helper text.
//

import SwiftUI

struct WhatIfSimulatorScreen: View {
    @ObservedObject var viewModel: SimulationViewModel
    var onOpenRenovation: (() -> Void)? = nil

    @Environment(\.appTheme) private var theme
    @State private var showSaveScenario = false
    @State private var scenarioName = ""
    @State private var saveAsBaseline = false
    @State private var showRenovationPlanner = false

    private var result: SimulationResult { viewModel.result }
    private var inputs: SimulationInputs { viewModel.inputs }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                helperBanner
                purchaseSection
                incomeSection
                liveMetricsSection
                baselineCompareSection
            }
            .padding(.horizontal, AppSpacing.m)
            .padding(.bottom, AppSpacing.xxl)
        }
        .background(theme.background)
        .navigationTitle("What-if")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showSaveScenario) {
            saveScenarioSheet
        }
    }

    // MARK: - Helper banner

    private var helperBanner: some View {
        Text("Change any input below to see how the numbers update. Set a baseline, then compare scenarios.")
            .font(AppTypography.subheadline)
            .foregroundColor(theme.textSecondary)
            .padding(AppSpacing.s)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .fill(theme.surface)
            )
    }

    // MARK: - Purchase & financing

    private var purchaseSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            sectionHeader("Purchase & financing", help: "Price and loan terms drive your payment and cash needed.")
            AppCard(padding: AppSpacing.m) {
                VStack(alignment: .leading, spacing: AppSpacing.m) {
                    compactField(
                        label: "Purchase price",
                        value: binding(\.purchasePrice),
                        formatter: .currency,
                        placeholder: "300000"
                    )
                    sliderRow(
                        label: "Down payment %",
                        value: downPaymentSliderBinding,
                        range: 5...50,
                        step: 1,
                        suffix: "%"
                    )
                    sliderRow(
                        label: "Interest rate",
                        value: rateBinding,
                        range: 2.0...12.0,
                        step: 0.25,
                        suffix: "%"
                    )
                    compactField(
                        label: "Loan term (years)",
                        value: termBinding,
                        formatter: .number,
                        placeholder: "30"
                    )
                    compactField(
                        label: "Closing costs",
                        value: binding(\.closingCosts),
                        formatter: .currency,
                        placeholder: "5000"
                    )
                }
            }
        }
    }

    // MARK: - Income

    private var incomeSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            sectionHeader("Income", help: "Rent and vacancy affect NOI and cash flow.")
            AppCard(padding: AppSpacing.m) {
                VStack(alignment: .leading, spacing: AppSpacing.m) {
                    compactField(
                        label: "Rent per unit (monthly)",
                        value: binding(\.monthlyRentPerUnit),
                        formatter: .currency,
                        placeholder: "1800"
                    )
                    compactField(
                        label: "Number of units",
                        value: unitsBinding,
                        formatter: .number,
                        placeholder: "1"
                    )
                    sliderRow(
                        label: "Vacancy %",
                        value: vacancyBinding,
                        range: 0...25,
                        step: 1,
                        suffix: "%"
                    )
                }
            }
        }
    }

    // MARK: - Live metrics

    private var liveMetricsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            sectionHeader("Live metrics", help: "These update as you change inputs above.")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppSpacing.xs) {
                HeadlineMetricCard(label: "NOI", value: SimulatorFormatters.currencyOptional(result.underwriting.noi))
                HeadlineMetricCard(label: "Cap rate", value: SimulatorFormatters.percentOptional(result.underwriting.capRate))
                HeadlineMetricCard(label: "Cash flow (yr)", value: SimulatorFormatters.currencyOptional(result.underwriting.annualCashFlow))
                HeadlineMetricCard(label: "Cash on cash", value: SimulatorFormatters.percentOptional(result.underwriting.cashOnCashReturn))
                HeadlineMetricCard(label: "DSCR", value: result.underwriting.dscr.map { SimulatorFormatters.decimal2($0) } ?? "—")
                HeadlineMetricCard(label: "Total cash", value: SimulatorFormatters.currencyOptional(result.totalCashToClose))
            }
            if (result.renovationTotal ?? 0) > 0 {
                HStack {
                    Text("Includes renovation:")
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textSecondary)
                    Text(SimulatorFormatters.currency(result.renovationTotal ?? 0))
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textPrimary)
                    Spacer()
                    Button("Edit", action: { showRenovationPlanner = true })
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.primary)
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                }
            } else {
                Button(action: { showRenovationPlanner = true }) {
                    HStack(spacing: AppSpacing.xs) {
                        Image(systemName: "hammer.fill")
                        Text("Add renovation budget")
                    }
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.primary)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .sheet(isPresented: $showRenovationPlanner) {
            NavigationStack {
                RenovationPlannerScreen(
                    plan: renovationPlanBinding,
                    onDismiss: { showRenovationPlanner = false }
                )
            }
        }
    }

    private var renovationPlanBinding: Binding<RenovationPlan?> {
        Binding(
            get: { viewModel.inputs.renovationPlan },
            set: { newPlan in
                var i = viewModel.inputs
                i.renovationPlan = newPlan
                viewModel.inputs = i
            }
        )
    }

    // MARK: - Baseline & compare

    private var baselineCompareSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            sectionHeader("Compare scenarios", help: "Save your current numbers as a baseline, then change inputs and see the difference.")
            if let baseline = viewModel.baselineScenario {
                ScenarioComparisonDeltaView(
                    comparison: ScenarioManager.compare(baseline: baseline, comparison: Scenario(name: "Current", isBaseline: false, inputs: viewModel.inputs)),
                    baselineLabel: baseline.name,
                    comparisonLabel: "Current"
                )
            } else {
                Text("Set baseline to compare.")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
                    .padding(AppSpacing.m)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: AppRadius.l)
                            .fill(theme.surface)
                    )
            }
            HStack(spacing: AppSpacing.m) {
                if viewModel.baselineScenario == nil {
                    PrimaryButton(title: "Set as baseline", action: {
                        saveAsBaseline = true
                        scenarioName = "Baseline"
                        showSaveScenario = true
                    })
                }
                SecondaryButton(title: "Save scenario", action: {
                    saveAsBaseline = false
                    scenarioName = "What-if \(Date().formatted(date: .abbreviated, time: .omitted))"
                    showSaveScenario = true
                })
            }
        }
    }

    // MARK: - Save scenario sheet

    private var saveScenarioSheet: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: AppSpacing.l) {
                Text("Name this scenario (e.g. Baseline, Optimistic).")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
                AppTextField(label: "Name", text: $scenarioName, placeholder: "Baseline")
                Spacer()
            }
            .padding(AppSpacing.m)
            .navigationTitle("Save scenario")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showSaveScenario = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        viewModel.saveScenario(name: scenarioName.isEmpty ? "Scenario" : scenarioName, asBaseline: saveAsBaseline)
                        showSaveScenario = false
                    }
                    .fontWeight(.semibold)
                    .disabled(scenarioName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    // MARK: - Helpers

    private func sectionHeader(_ title: String, help: String) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            Text(title)
                .font(AppTypography.title3)
                .foregroundColor(theme.textPrimary)
            Text(help)
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
        }
    }

    private enum FieldFormat { case currency, number }

    private func compactField(
        label: String,
        value: Binding<String>,
        formatter: FieldFormat,
        placeholder: String
    ) -> some View {
        let keyboard: UIKeyboardType = formatter == .currency || formatter == .number ? .decimalPad : .default
        return AppTextField(label: label, text: value, placeholder: placeholder, keyboardType: keyboard)
    }

    private func sliderRow(
        label: String,
        value: Binding<Double>,
        range: ClosedRange<Double>,
        step: Double,
        suffix: String
    ) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            HStack {
                Text(label)
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
                Spacer()
                Text(String(format: "%.1f", value.wrappedValue) + suffix)
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textPrimary)
            }
            Slider(value: value, in: range, step: step)
                .tint(theme.primary)
        }
    }

    private func binding<T>(_ keyPath: WritableKeyPath<SimulationInputs, T?>) -> Binding<String> where T: LosslessStringConvertible {
        Binding(
            get: {
                guard let v = inputs[keyPath: keyPath] else { return "" }
                return "\(v)"
            },
            set: { str in
                let trimmed = str.trimmingCharacters(in: .whitespaces)
                var i = inputs
                if trimmed.isEmpty {
                    i[keyPath: keyPath] = nil
                } else if let v = T(trimmed) {
                    i[keyPath: keyPath] = v
                }
                viewModel.inputs = i
            }
        )
    }

    private var downPaymentSliderBinding: Binding<Double> {
        Binding(
            get: {
                guard let p = inputs.downPaymentPercent else { return 20 }
                return (p as NSDecimalNumber).doubleValue
            },
            set: {
                var i = inputs
                i.downPaymentPercent = Decimal($0)
                viewModel.inputs = i
            }
        )
    }

    private var rateBinding: Binding<Double> {
        Binding(
            get: {
                guard let r = inputs.interestRateAnnual else { return 6.5 }
                return (r as NSDecimalNumber).doubleValue
            },
            set: {
                var i = inputs
                i.interestRateAnnual = Decimal($0)
                viewModel.inputs = i
            }
        )
    }

    private var vacancyBinding: Binding<Double> {
        Binding(
            get: {
                guard let v = inputs.vacancyRatePercent else { return 5 }
                return (v as NSDecimalNumber).doubleValue
            },
            set: {
                var i = inputs
                i.vacancyRatePercent = Decimal($0)
                viewModel.inputs = i
            }
        )
    }

    private var termBinding: Binding<String> {
        Binding(
            get: {
                guard let t = inputs.amortizationTermYears else { return "" }
                return "\(t)"
            },
            set: { str in
                var i = inputs
                if let n = Int(str.trimmingCharacters(in: .whitespaces)), n > 0 {
                    i.amortizationTermYears = n
                } else if str.trimmingCharacters(in: .whitespaces).isEmpty {
                    i.amortizationTermYears = nil
                }
                viewModel.inputs = i
            }
        )
    }

    private var unitsBinding: Binding<String> {
        Binding(
            get: {
                guard let u = inputs.unitCount else { return "" }
                return "\(u)"
            },
            set: { str in
                var i = inputs
                if let n = Int(str.trimmingCharacters(in: .whitespaces)), n > 0 {
                    i.unitCount = n
                } else if str.trimmingCharacters(in: .whitespaces).isEmpty {
                    i.unitCount = nil
                }
                viewModel.inputs = i
            }
        )
    }
}

// MARK: - Decimal binding (for currency fields)

private extension WhatIfSimulatorScreen {
    func binding(_ keyPath: WritableKeyPath<SimulationInputs, Decimal?>) -> Binding<String> {
        Binding(
            get: {
                guard let v = inputs[keyPath: keyPath] else { return "" }
                return "\(v)"
            },
            set: { str in
                let trimmed = str.trimmingCharacters(in: .whitespaces)
                var i = inputs
                if trimmed.isEmpty {
                    i[keyPath: keyPath] = nil
                } else if let v = Decimal(string: trimmed) {
                    i[keyPath: keyPath] = v
                }
                viewModel.inputs = i
            }
        )
    }
}

#Preview("What-if") {
    NavigationStack {
        WhatIfSimulatorScreen(viewModel: SimulationViewModel(initialInputs: SimulationInputs(
            purchasePrice: 300_000,
            downPaymentPercent: 25,
            interestRateAnnual: 0.065,
            amortizationTermYears: 30,
            monthlyRentPerUnit: 1_800,
            unitCount: 1,
            vacancyRatePercent: 5
        )))
    }
    .appThemeFromColorScheme()
}
