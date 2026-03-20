//
//  AddressAutocompleteInputView.swift
//  PropFolio
//
//  Address input with dropdown suggestions, unit field, and loading/no-results/error states. Mobile-friendly.
//

import SwiftUI

/// Address autocomplete: text field, optional unit field, dropdown with loading / no-results / error states.
struct AddressAutocompleteInputView: View {
    @ObservedObject var viewModel: AddressAutocompleteViewModel
    var placeholder: String = "Street address, city, or zip"
    var unitPlaceholder: String = "Apt, suite, unit (optional)"
    var showLookupButton: Bool = true
    var onSelectSuggestion: ((AddressSuggestion) -> Void)?
    var onFetchProperty: (() -> Void)?

    @Environment(\.appTheme) private var theme
    @FocusState private var isAddressFocused: Bool

    private let minTapHeight: CGFloat = 44
    private let maxSuggestionsHeight: CGFloat = 220

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            addressField
            unitField
            dropdownOrState
            if showLookupButton, viewModel.hydratedAddress != nil {
                lookupSection
            }
        }
        .onChange(of: isAddressFocused) { _, focused in
            if !focused { viewModel.dismissSuggestions() }
        }
    }

    private var addressField: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            Text("Address")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
            TextField(placeholder, text: $viewModel.query)
                .font(AppTypography.body)
                .foregroundColor(theme.textPrimary)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled(false)
                .padding(.horizontal, AppSpacing.m)
                .frame(minHeight: minTapHeight)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .fill(theme.surface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .stroke(isAddressFocused ? theme.primary : theme.border, lineWidth: isAddressFocused ? 2 : 0.5)
                )
                .focused($isAddressFocused)
                .onTapGesture { isAddressFocused = true }
        }
    }

    private var unitField: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            Text("Unit (optional)")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
            TextField(unitPlaceholder, text: $viewModel.unit)
                .font(AppTypography.body)
                .foregroundColor(theme.textPrimary)
                .padding(.horizontal, AppSpacing.m)
                .frame(minHeight: minTapHeight)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .fill(theme.surface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .stroke(theme.border, lineWidth: 0.5)
                )
        }
    }

    @ViewBuilder
    private var dropdownOrState: some View {
        if case .loading = viewModel.phase {
            loadingRow
        } else if case .noResults = viewModel.phase {
            noResultsRow
        } else if case .failed(let message) = viewModel.phase {
            errorRow(message: message)
        } else if !viewModel.suggestions.isEmpty {
            suggestionsList
        }
    }

    private var loadingRow: some View {
        HStack(spacing: AppSpacing.s) {
            ProgressView()
                .scaleEffect(0.9)
                .tint(theme.primary)
            Text("Searching…")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(minHeight: minTapHeight)
        .padding(.horizontal, AppSpacing.m)
    }

    private var noResultsRow: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            HStack(spacing: AppSpacing.s) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 16))
                    .foregroundColor(theme.textTertiary)
                Text("No addresses found.")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
            }
            Button("Use this text as address") {
                viewModel.useTypedAddressAsManual()
            }
            .font(AppTypography.subheadline)
            .foregroundColor(theme.primary)
            .frame(minHeight: minTapHeight)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, AppSpacing.m)
    }

    private func errorRow(message: String) -> some View {
        HStack(alignment: .top, spacing: AppSpacing.s) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 16))
                .foregroundColor(theme.error)
            Text(message)
                .font(AppTypography.subheadline)
                .foregroundColor(theme.error)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.m)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.s)
                .fill(theme.surface)
        )
    }

    private var suggestionsList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(Array(viewModel.suggestions.enumerated()), id: \.offset) { _, suggestion in
                    Button {
                        viewModel.selectSuggestion(suggestion)
                        onSelectSuggestion?(suggestion)
                        isAddressFocused = false
                    } label: {
                        HStack {
                            Text(suggestion.singleLine)
                                .font(AppTypography.subheadline)
                                .foregroundColor(theme.textPrimary)
                                .multilineTextAlignment(.leading)
                                .lineLimit(2)
                            Spacer(minLength: AppSpacing.xs)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(theme.textTertiary)
                        }
                        .padding(.horizontal, AppSpacing.m)
                        .frame(minHeight: minTapHeight)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .frame(maxHeight: maxSuggestionsHeight)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.m)
                .fill(theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.m)
                .stroke(theme.border, lineWidth: 0.5)
        )
    }

    private var lookupSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            if let address = viewModel.currentNormalizedAddress {
                HStack {
                    Text(address.singleLine)
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textSecondary)
                    Spacer()
                    Button("Change") {
                        viewModel.clearSelection()
                    }
                    .font(AppTypography.caption)
                    .foregroundColor(theme.primary)
                }
            }
            Button {
                Task { await viewModel.fetchPropertyForCurrentAddress(); onFetchProperty?() }
            } label: {
                HStack(spacing: AppSpacing.xs) {
                    if viewModel.isFetchingProperty {
                        ProgressView()
                            .scaleEffect(0.9)
                            .tint(.white)
                    }
                    Text(viewModel.isFetchingProperty ? "Looking up…" : "Look up property")
                        .font(AppTypography.headline)
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity)
                .frame(minHeight: minTapHeight)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .fill(theme.primary)
                )
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(viewModel.isFetchingProperty)
        }
    }
}

// MARK: - Previews

#Preview("Autocomplete") {
    let provider = MockAutocompleteProvider()
    let service = AddressAutocompleteService(provider: provider)
    let vm = AddressAutocompleteViewModel(autocompleteService: service)
    return AddressAutocompleteInputView(viewModel: vm)
        .padding()
        .appThemeFromColorScheme()
}

#Preview("With states") {
    let provider = MockAutocompleteProvider()
    let service = AddressAutocompleteService(provider: provider, minCharacters: 2)
    let vm = AddressAutocompleteViewModel(autocompleteService: service)
    return ScrollView {
        AddressAutocompleteInputView(viewModel: vm)
            .padding()
    }
    .appThemeFromColorScheme()
    .preferredColorScheme(.dark)
}
