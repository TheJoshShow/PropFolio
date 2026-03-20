//
//  AddressInputView.swift
//  PropFolio
//
//  Address entry with autocomplete dropdown; look up property. Mobile-friendly keyboard.
//

import SwiftUI

struct AddressInputView: View {
    @Environment(\.appTheme) private var theme
    @ObservedObject var addressViewModel: AddressAutocompleteViewModel
    var isImporting: Bool
    var onLookup: () async -> Void
    var onBack: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.l) {
                Text("Enter address")
                    .font(AppTypography.title3)
                    .foregroundColor(theme.textPrimary)

                Text("Type an address and choose a suggestion, or use your text as the address.")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)

                AddressAutocompleteInputView(
                    viewModel: addressViewModel,
                    placeholder: "Street address, city, or zip",
                    unitPlaceholder: "Unit (optional)",
                    showLookupButton: false
                )

                if addressViewModel.currentNormalizedAddress != nil {
                    PrimaryButton(
                        title: isImporting ? "Looking up…" : "Look up property",
                        action: { Task { await onLookup() } },
                        isLoading: isImporting,
                        isEnabled: !isImporting
                    )
                }
                Spacer(minLength: AppSpacing.xxl)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AppSpacing.m)
            .padding(.bottom, AppSpacing.xxxl)
        }
        .scrollDismissesKeyboard(.interactively)
    }
}

#Preview("Address input") {
    let provider = MockAutocompleteProvider()
    let service = AddressAutocompleteService(provider: provider)
    let vm = AddressAutocompleteViewModel(autocompleteService: service)
    return AddressInputView(
        addressViewModel: vm,
        isImporting: false,
        onLookup: { },
        onBack: {}
    )
    .appThemeFromColorScheme()
}
