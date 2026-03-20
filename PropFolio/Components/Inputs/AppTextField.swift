//
//  AppTextField.swift
//  PropFolio
//
//  Themed text field: label, placeholder, optional error. 44pt+ touch target.
//

import SwiftUI

struct AppTextField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var errorMessage: String? = nil
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences
    var isSecure: Bool = false

    @Environment(\.appTheme) private var theme
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            if !label.isEmpty {
                Text(label)
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
            }
            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
                .font(AppTypography.body)
                .foregroundColor(theme.textPrimary)
                .keyboardType(keyboardType)
                .textInputAutocapitalization(autocapitalization)
                .padding(.horizontal, AppSpacing.m)
                .padding(.vertical, AppSpacing.s)
                .frame(minHeight: 44)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .fill(theme.surface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.m)
                        .stroke(isFocused ? theme.primary : theme.border, lineWidth: isFocused ? 2 : 0.5)
                )
                .focused($isFocused)
                .accessibilityLabel(label.isEmpty ? placeholder : label)
            if let error = errorMessage, !error.isEmpty {
                Text(error)
                    .font(AppTypography.caption)
                    .foregroundColor(theme.error)
            }
        }
    }
}

// MARK: - Previews

#Preview("AppTextField") {
    struct Holder: View {
        @State var text = ""
        var body: some View {
            VStack(spacing: AppSpacing.l) {
                AppTextField(label: "Email", text: $text, placeholder: "you@example.com")
                AppTextField(label: "Address", text: .constant(""), placeholder: "123 Main St", errorMessage: "Required")
            }
            .padding()
            .appThemeFromColorScheme()
        }
    }
    return Holder()
}
