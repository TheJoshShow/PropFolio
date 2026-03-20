//
//  Shadows.swift
//  PropFolio
//
//  Shadow tokens for elevation. Use sparingly; primary on cards and modals.
//

import SwiftUI

enum AppShadows {
    static func card(_ colorScheme: ColorScheme) -> (color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) {
        (color: Color.black.opacity(colorScheme == .dark ? 0.4 : 0.08), radius: 8, x: 0, y: 2)
    }
    static func elevated(_ colorScheme: ColorScheme) -> (color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) {
        (color: Color.black.opacity(colorScheme == .dark ? 0.5 : 0.12), radius: 16, x: 0, y: 4)
    }
}

extension View {
    func appShadowCard(colorScheme: ColorScheme) -> some View {
        let s = AppShadows.card(colorScheme)
        return shadow(color: s.color, radius: s.radius, x: s.x, y: s.y)
    }
    func appShadowElevated(colorScheme: ColorScheme) -> some View {
        let s = AppShadows.elevated(colorScheme)
        return shadow(color: s.color, radius: s.radius, x: s.x, y: s.y)
    }
}
