//
//  AppTheme.swift
//  PropFolio
//
//  Semantic theme (light/dark). Injected at root from colorScheme; use via @Environment(\.appTheme).
//

import SwiftUI

struct AppTheme {
    let background: Color
    let surface: Color
    let surfaceElevated: Color
    let primary: Color
    let primaryVariant: Color
    let secondary: Color
    let textPrimary: Color
    let textSecondary: Color
    let textTertiary: Color
    let border: Color
    let success: Color
    let warning: Color
    let error: Color
    let confidenceHigh: Color
    let confidenceMedium: Color
    let confidenceLow: Color

    static let light = AppTheme(
        background: Color(uiColor: .systemGroupedBackground),
        surface: Color(uiColor: .secondarySystemGroupedBackground),
        surfaceElevated: Color(uiColor: .tertiarySystemGroupedBackground),
        primary: Color(red: 0.06, green: 0.42, blue: 0.42),
        primaryVariant: Color(red: 0.08, green: 0.55, blue: 0.55),
        secondary: Color(red: 0.35, green: 0.45, blue: 0.52),
        textPrimary: Color(uiColor: .label),
        textSecondary: Color(uiColor: .secondaryLabel),
        textTertiary: Color(uiColor: .tertiaryLabel),
        border: Color(uiColor: .separator),
        success: Color(red: 0.18, green: 0.55, blue: 0.34),
        warning: Color(red: 0.85, green: 0.55, blue: 0.14),
        error: Color(red: 0.82, green: 0.26, blue: 0.28),
        confidenceHigh: Color(red: 0.18, green: 0.55, blue: 0.34),
        confidenceMedium: Color(red: 0.85, green: 0.55, blue: 0.14),
        confidenceLow: Color(red: 0.82, green: 0.26, blue: 0.28)
    )

    static let dark = AppTheme(
        background: Color(uiColor: .systemGroupedBackground),
        surface: Color(uiColor: .secondarySystemGroupedBackground),
        surfaceElevated: Color(uiColor: .tertiarySystemGroupedBackground),
        primary: Color(red: 0.35, green: 0.78, blue: 0.78),
        primaryVariant: Color(red: 0.45, green: 0.85, blue: 0.85),
        secondary: Color(red: 0.55, green: 0.65, blue: 0.72),
        textPrimary: Color(uiColor: .label),
        textSecondary: Color(uiColor: .secondaryLabel),
        textTertiary: Color(uiColor: .tertiaryLabel),
        border: Color(uiColor: .separator),
        success: Color(red: 0.35, green: 0.72, blue: 0.48),
        warning: Color(red: 0.95, green: 0.72, blue: 0.32),
        error: Color(red: 0.95, green: 0.45, blue: 0.45),
        confidenceHigh: Color(red: 0.35, green: 0.72, blue: 0.48),
        confidenceMedium: Color(red: 0.95, green: 0.72, blue: 0.32),
        confidenceLow: Color(red: 0.95, green: 0.45, blue: 0.45)
    )
}

// MARK: - Environment

private struct AppThemeKey: EnvironmentKey {
    static let defaultValue: AppTheme = .light
}

extension EnvironmentValues {
    var appTheme: AppTheme {
        get { self[AppThemeKey.self] }
        set { self[AppThemeKey.self] = newValue }
    }
}

extension View {
    func appThemeFromColorScheme() -> some View {
        modifier(AppThemeFromColorSchemeModifier())
    }
}

private struct AppThemeFromColorSchemeModifier: ViewModifier {
    @Environment(\.colorScheme) var colorScheme
    func body(content: Content) -> some View {
        content.environment(\.appTheme, colorScheme == .dark ? .dark : .light)
    }
}
