//
//  Colors.swift
//  PropFolio
//
//  Semantic color tokens. Prefer theme from Environment (\.appTheme) in views.
//  These statics match AppTheme.light for use in previews or when theme is not set.
//

import SwiftUI

enum AppColors {
    static let background = Color(uiColor: .systemGroupedBackground)
    static let surface = Color(uiColor: .secondarySystemGroupedBackground)
    static let primary = Color(red: 0.06, green: 0.42, blue: 0.42)
    static let primaryVariant = Color(red: 0.08, green: 0.55, blue: 0.55)
    static let secondary = Color(red: 0.35, green: 0.45, blue: 0.52)
    static let textPrimary = Color(uiColor: .label)
    static let textSecondary = Color(uiColor: .secondaryLabel)
    static let border = Color(uiColor: .separator)
    static let success = Color(red: 0.18, green: 0.55, blue: 0.34)
    static let warning = Color(red: 0.85, green: 0.55, blue: 0.14)
    static let error = Color(red: 0.82, green: 0.26, blue: 0.28)
}
