//
//  PortfolioScreen.swift
//  PropFolio
//
//  Portfolio experience: saved deals, key metrics, score/confidence, tags/status,
//  recent updates, open analysis. Smooth scroll, strong cards, filters, empty state.
//

import SwiftUI

struct PortfolioScreen: View {
    /// Injected list of saved deals (mock or from store/API).
    var deals: [PortfolioDeal] = PortfolioMockData.sampleDeals

    @Environment(\.appTheme) private var theme
    @State private var selectedDeal: PortfolioDeal?
    @State private var dealForWhatIf: PortfolioDeal?
    @State private var filterArchetype: DealArchetype? = nil
    @State private var filterStatus: DealStatus? = nil

    private var filteredDeals: [PortfolioDeal] {
        deals.filter { deal in
            let matchArchetype = filterArchetype == nil || deal.dealArchetype == filterArchetype
            let matchStatus = filterStatus == nil || deal.status == filterStatus
            return matchArchetype && matchStatus
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if deals.isEmpty {
                    emptyStateNoDeals
                } else if filteredDeals.isEmpty {
                    emptyStateNoMatches
                } else {
                    dealList
                }
            }
            .background(theme.background)
            .navigationTitle("Portfolio")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(item: $selectedDeal) { deal in
                AnalysisDashboardScreen(
                    state: deal.analysisStateForDashboard(),
                    analyticsSource: "portfolio",
                    onWhatIfTap: { dealForWhatIf = deal }
                )
            }
            .fullScreenCover(item: $dealForWhatIf) { deal in
                NavigationStack {
                    WhatIfSimulatorScreen(
                        viewModel: SimulationViewModel(initialInputs: Self.simulationInputsForDeal(deal))
                    )
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Done") { dealForWhatIf = nil }
                        }
                    }
                }
            }
        }
    }

    /// Seed What-If from deal when we have underwriting data (e.g. demo fullAnalysisState).
    private static func simulationInputsForDeal(_ deal: PortfolioDeal) -> SimulationInputs {
        guard let state = deal.fullAnalysisState, let uw = state.underwritingOutputs else {
            return SimulationInputs()
        }
        var inputs = SimulationInputs()
        if let noi = uw.noi, let cap = uw.capRate, cap > 0 {
            inputs.purchasePrice = noi / cap
        }
        if let gsr = uw.grossScheduledRentAnnual {
            inputs.monthlyRentPerUnit = gsr / 12
            inputs.unitCount = 1
        }
        inputs.interestRateAnnual = 0.065
        inputs.amortizationTermYears = 30
        inputs.downPaymentPercent = 25
        inputs.vacancyRatePercent = 5
        if let opEx = uw.operatingExpensesAnnual {
            inputs.taxesAnnual = opEx * Decimal(40) / 100
            inputs.insuranceAnnual = opEx * Decimal(12) / 100
            inputs.repairsAndMaintenanceAnnual = opEx * Decimal(15) / 100
        }
        if let gsr = uw.grossScheduledRentAnnual {
            inputs.propertyManagementAnnual = gsr * Decimal(10) / 100
        }
        return inputs
    }

    // MARK: - List (smooth scroll)

    private var dealList: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: AppSpacing.l) {
                archetypeFilterSection
                statusFilterSection
                dealsSection
            }
            .padding(.horizontal, AppSpacing.m)
            .padding(.top, AppSpacing.s)
            .padding(.bottom, AppSpacing.xxl)
        }
        .scrollIndicators(.automatic)
    }

    private var archetypeFilterSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("Archetype")
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.xs) {
                    filterChip(title: "All", selected: filterArchetype == nil) {
                        filterArchetype = nil
                    }
                    ForEach(DealArchetype.allCases, id: \.self) { arch in
                        filterChip(title: arch.badgeCopy, selected: filterArchetype == arch) {
                            filterArchetype = arch
                        }
                    }
                }
                .padding(.horizontal, AppSpacing.xxs)
                .padding(.trailing, AppSpacing.m)
            }
        }
    }

    private var statusFilterSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("Status")
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.xs) {
                    filterChip(title: "All", selected: filterStatus == nil) {
                        filterStatus = nil
                    }
                    ForEach(DealStatus.allCases, id: \.self) { status in
                        filterChip(title: status.shortLabel, selected: filterStatus == status) {
                            filterStatus = status
                        }
                    }
                }
                .padding(.horizontal, AppSpacing.xxs)
                .padding(.trailing, AppSpacing.m)
            }
        }
    }

    /// Filter chip: 44pt min height for touch target (HIG).
    private func filterChip(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(AppTypography.caption)
                .foregroundColor(selected ? theme.surface : theme.textSecondary)
                .lineLimit(1)
                .padding(.horizontal, AppSpacing.s)
                .frame(minHeight: 44)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .fill(selected ? theme.primary : theme.surface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .stroke(theme.border, lineWidth: selected ? 0 : 0.5)
                )
        }
        .buttonStyle(.plain)
    }

    private var dealsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.m) {
            Text("Deals")
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
            ForEach(filteredDeals) { deal in
                PortfolioDealCard(deal: deal) {
                    selectedDeal = deal
                }
            }
        }
        .padding(.top, AppSpacing.xs)
    }

    // MARK: - Empty states

    private var emptyStateNoDeals: some View {
        EmptyStateView(
            icon: "building.2",
            title: "No properties yet",
            message: "Import a property from Home or Import to build your portfolio. Your saved analyses will appear here.",
            actionTitle: "Go to Import",
            action: goToImport
        )
        .padding(.bottom, AppSpacing.xxxl)
    }

    private var emptyStateNoMatches: some View {
        EmptyStateView(
            icon: "line.3.horizontal.decrease.circle",
            title: "No matching deals",
            message: "Try changing the archetype or status filter to see more.",
            actionTitle: "Clear filters",
            action: { filterArchetype = nil; filterStatus = nil }
        )
        .padding(.bottom, AppSpacing.xxxl)
    }

    private func goToImport() {
        // Switch to Import tab. RootTabView owns the tab; we need to notify it.
        // Use notification or environment. For now, post a notification that RootTabView can observe.
        NotificationCenter.default.post(name: .switchToImportTab, object: nil)
    }
}

// MARK: - Tab switch notification

extension Notification.Name {
    static let switchToImportTab = Notification.Name("PropFolio.switchToImportTab")
}

// MARK: - Previews

#Preview("Portfolio with deals") {
    PortfolioScreen(deals: PortfolioMockData.sampleDeals)
        .appThemeFromColorScheme()
}

#Preview("Portfolio empty") {
    PortfolioScreen(deals: PortfolioMockData.emptyDeals)
        .appThemeFromColorScheme()
}

#Preview("Portfolio dark") {
    PortfolioScreen(deals: PortfolioMockData.sampleDeals)
        .appThemeFromColorScheme()
        .preferredColorScheme(.dark)
}
