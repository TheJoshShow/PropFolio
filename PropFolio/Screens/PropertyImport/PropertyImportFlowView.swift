//
//  PropertyImportFlowView.swift
//  PropFolio
//
//  Complete import flow: start → paste link or address → progress → result → edit. Native iOS, clear states.
//

import SwiftUI

struct PropertyImportFlowView: View {
    @Environment(\.appTheme) private var theme
    @ObservedObject var flowVM: ImportFlowViewModel
    @ObservedObject var addressVM: AddressAutocompleteViewModel

    var body: some View {
        NavigationStack {
            Group {
                switch flowVM.phase {
                case .start:
                    AddPropertyStartView(
                        onPasteLink: { Task { await flowVM.choosePasteLink() } },
                        onTypeAddress: { Task { await flowVM.chooseTypeAddress() } },
                        onLoadDemo: { flowVM.loadDemoProperty($0) }
                    )
                    .task { await flowVM.loadFreeTierStateIfNeeded() }

                case .linkInput:
                    LinkInputView(
                        linkInput: $flowVM.linkInput,
                        isImporting: false,
                        onImport: { Task { await flowVM.runImportFromLink() } },
                        onBack: { flowVM.goBackFromLinkInput() }
                    )
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Back") { flowVM.goBackFromLinkInput() }
                                .font(AppTypography.body)
                                .foregroundColor(theme.primary)
                        }
                    }

                case .addressInput:
                    AddressInputView(
                        addressViewModel: addressVM,
                        isImporting: false,
                        onLookup: { await flowVM.runImportFromAddress() },
                        onBack: { flowVM.goBackFromAddressInput() }
                    )
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Back") { flowVM.goBackFromAddressInput() }
                                .font(AppTypography.body)
                                .foregroundColor(theme.primary)
                        }
                    }

                case .importing(let message):
                    ImportProgressView(statusMessage: message)

                case .result(let result):
                    PropertyImportResultView(
                        result: result,
                        onEdit: { flowVM.startEditing() },
                        onSaveToPortfolio: { /* TODO: persist and navigate */ flowVM.dismissResult() },
                        onDismiss: { flowVM.dismissResult() }
                    )

                case .error(let message):
                    ImportErrorView(message: message, onRetry: { flowVM.retryAfterError() }, onStartOver: { flowVM.showStart() })

                case .editing(let result):
                    EditImportedPropertyView(
                        property: result.property,
                        onSave: { flowVM.saveEdits(updatedProperty: $0) },
                        onCancel: { flowVM.cancelEditing() }
                    )
                }
            }
            .background(theme.background)
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(displayMode)
            .sheet(isPresented: Binding(
                get: { flowVM.showPaywall },
                set: { flowVM.showPaywall = $0 }
            )) {
                NavigationStack {
                    PaywallView(
                        importCount: flowVM.freeTierState?.importCount ?? 2,
                        onPurchase: { /* TODO: RevenueCat purchase */ flowVM.showPaywall = false },
                        onRestore: { /* TODO: RevenueCat restore */ flowVM.showPaywall = false },
                        onManageSubscription: { /* TODO: open manage subscription */ flowVM.showPaywall = false },
                        onDismiss: { flowVM.showPaywall = false }
                    )
                }
            }
        }
    }

    private var navigationTitle: String {
        switch flowVM.phase {
        case .start: return "Add property"
        case .linkInput: return "Paste link"
        case .addressInput: return "Enter address"
        case .importing: return "Importing"
        case .result: return "Imported"
        case .error: return "Import issue"
        case .editing: return "Edit details"
        }
    }

    private var displayMode: NavigationBarItem.TitleDisplayMode {
        switch flowVM.phase {
        case .start: return .large
        default: return .inline
        }
    }
}

// MARK: - Error state

private struct ImportErrorView: View {
    @Environment(\.appTheme) private var theme
    let message: String
    let onRetry: () -> Void
    let onStartOver: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xl) {
            VStack(alignment: .leading, spacing: AppSpacing.s) {
                HStack(spacing: AppSpacing.s) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(theme.warning)
                    Text("Couldn’t import")
                        .font(AppTypography.title3)
                        .foregroundColor(theme.textPrimary)
                }
                Text(message)
                    .font(AppTypography.body)
                    .foregroundColor(theme.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AppSpacing.m)

            VStack(spacing: AppSpacing.m) {
                PrimaryButton(title: "Try again", action: onRetry)
                SecondaryButton(title: "Start over", action: onStartOver)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(AppSpacing.m)
    }
}

#Preview("Flow start") {
    let provider = MockAutocompleteProvider()
    let service = AddressAutocompleteService(provider: provider)
    let addressVM = AddressAutocompleteViewModel(autocompleteService: service, propertyDataService: PropertyDataService.withAppConfiguration())
    let flowVM = ImportFlowViewModel(propertyDataService: PropertyDataService.withAppConfiguration(), addressAutocompleteViewModel: addressVM)
    return PropertyImportFlowView(flowVM: flowVM, addressVM: addressVM)
        .appThemeFromColorScheme()
}
