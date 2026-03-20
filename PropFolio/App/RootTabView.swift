//
//  RootTabView.swift
//  PropFolio
//
//  iPhone-first tab root: Home, Import, Portfolio, Settings.
//

import Combine
import SwiftUI

struct RootTabView: View {
    @Environment(\.appTheme) private var theme
    /// In DEBUG, default is true (see PropFolioApp); user can toggle in Settings.
    @AppStorage("useDemoData") private var useDemoData = false
    /// With demo data ON, start on Portfolio so you can tap a deal → Analysis → What-If → Renovation immediately.
    @State private var selectedTab: TabItem = UserDefaults.standard.bool(forKey: "useDemoData") ? .portfolio : .home

    enum TabItem: Int, CaseIterable {
        case home
        case importProperty
        case portfolio
        case settings

        var title: String {
            switch self {
            case .home: return "Home"
            case .importProperty: return "Import"
            case .portfolio: return "Portfolio"
            case .settings: return "Settings"
            }
        }

        var icon: String {
            switch self {
            case .home: return "house.fill"
            case .importProperty: return "square.and.arrow.down"
            case .portfolio: return "building.2.fill"
            case .settings: return "gearshape.fill"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeScreen()
                .tabItem { tabLabel(.home) }
                .tag(TabItem.home)

            ImportScreen()
                .tabItem { tabLabel(.importProperty) }
                .tag(TabItem.importProperty)

            PortfolioScreen(deals: useDemoData ? DemoData.dealsForPortfolio() : PortfolioMockData.sampleDeals)
                .tabItem { tabLabel(.portfolio) }
                .tag(TabItem.portfolio)
                .onReceive(NotificationCenter.default.publisher(for: .switchToImportTab)) { _ in
                    selectedTab = .importProperty
                }

            SettingsScreen()
                .tabItem { tabLabel(.settings) }
                .tag(TabItem.settings)
        }
        .tint(theme.primary)
    }

    private func tabLabel(_ tab: TabItem) -> some View {
        Label(tab.title, systemImage: tab.icon)
    }
}

// MARK: - Tab content shells

struct HomeScreen: View {
    var body: some View {
        NavigationStack {
            HomeDashboardScreen()
        }
    }
}

struct ImportScreen: View {
    @StateObject private var flowVM: ImportFlowViewModel = {
        let provider = MockAutocompleteProvider()
        let service = AddressAutocompleteService(provider: provider)
        let addressVM = AddressAutocompleteViewModel(
            autocompleteService: service,
            propertyDataService: PropertyDataService.withAppConfiguration()
        )
        return ImportFlowViewModel(
            propertyDataService: PropertyDataService.withAppConfiguration(),
            addressAutocompleteViewModel: addressVM
        )
    }()

    var body: some View {
        PropertyImportFlowView(flowVM: flowVM, addressVM: flowVM.addressAutocompleteViewModel)
    }
}

struct SettingsScreen: View {
    @Environment(\.appTheme) private var theme
    @EnvironmentObject var auth: AuthViewModel
    @AppStorage("useDemoData") private var useDemoData = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Toggle(isOn: $useDemoData) {
                        Text("Use demo data")
                            .font(AppTypography.body)
                            .foregroundColor(theme.textPrimary)
                    }
                    .tint(theme.primary)
                    if useDemoData {
                        Text("Portfolio shows 3 sample deals (strong 4-plex, value-add, risky condo). Turn off to use your own data.")
                            .font(AppTypography.caption)
                            .foregroundColor(theme.textSecondary)
                    }
                } header: {
                    Text("Development")
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textSecondary)
                }

                Section {
                    Text("Account")
                        .font(AppTypography.body)
                        .foregroundColor(theme.textPrimary)
                    Text("Notifications")
                        .font(AppTypography.body)
                        .foregroundColor(theme.textPrimary)
                } header: {
                    Text("Preferences")
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textSecondary)
                }

                if auth.isAuthConfigured {
                    Section {
                        Button(role: .destructive) {
                            Task { await auth.signOut() }
                        } label: {
                            Text("Sign out")
                                .font(AppTypography.body)
                                .foregroundColor(theme.error)
                        }
                    }
                }
            }
            .background(theme.background)
            .scrollContentBackground(.hidden)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

// MARK: - Previews

#Preview("Tabs light") {
    RootTabView()
        .environmentObject(AuthViewModel())
        .appThemeFromColorScheme()
}

#Preview("Tabs dark") {
    RootTabView()
        .environmentObject(AuthViewModel())
        .appThemeFromColorScheme()
        .preferredColorScheme(.dark)
}
