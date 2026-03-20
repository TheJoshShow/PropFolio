//
//  LinkInputView.swift
//  PropFolio
//
//  Paste Zillow or Redfin link; import button. Mobile-friendly keyboard and focus.
//

import SwiftUI

struct LinkInputView: View {
    @Environment(\.appTheme) private var theme
    @Binding var linkInput: String
    var isImporting: Bool
    var onImport: () -> Void
    var onBack: () -> Void

    @FocusState private var isFieldFocused: Bool

    private var canImport: Bool {
        linkInput.trimmingCharacters(in: .whitespaces).lowercased().hasPrefix("http")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.l) {
            Text("Paste listing link")
                .font(AppTypography.title3)
                .foregroundColor(theme.textPrimary)

            Text("Paste a Zillow or Redfin listing URL to import the property.")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)

            TextField("https://www.zillow.com/… or https://www.redfin.com/…", text: $linkInput, axis: .vertical)
                .font(AppTypography.body)
                .foregroundColor(theme.textPrimary)
                .textContentType(.URL)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .lineLimit(3...6)
                .padding(AppSpacing.m)
                .frame(minHeight: 88)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .fill(theme.surface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .stroke(theme.border, lineWidth: 0.5)
                )
                .focused($isFieldFocused)

            PrimaryButton(
                title: isImporting ? "Importing…" : "Import from link",
                action: { Task { await onImport() } },
                isLoading: isImporting,
                isEnabled: canImport && !isImporting
            )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.m)
        .scrollDismissesKeyboard(.interactively)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { isFieldFocused = false }
                    .font(AppTypography.headline)
                    .foregroundColor(theme.primary)
            }
        }
    }
}

#Preview("Link input") {
    struct Holder: View {
        @State var text = "https://www.zillow.com/"
        var body: some View {
            LinkInputView(
                linkInput: $text,
                isImporting: false,
                onImport: {},
                onBack: {}
            )
        }
    }
    return Holder()
        .appThemeFromColorScheme()
}
