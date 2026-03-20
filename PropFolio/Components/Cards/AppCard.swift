//
//  AppCard.swift
//  PropFolio
//
//  Reusable card with optional padding and shadow. Use for property rows, metric blocks, etc.
//

import SwiftUI

struct AppCard<Content: View>: View {
    let content: Content
    var padding: CGFloat = AppSpacing.m
    var useShadow: Bool = true

    @Environment(\.appTheme) private var theme
    @Environment(\.colorScheme) private var colorScheme

    init(
        padding: CGFloat = AppSpacing.m,
        useShadow: Bool = true,
        @ViewBuilder content: () -> Content
    ) {
        self.padding = padding
        self.useShadow = useShadow
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .fill(theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .stroke(theme.border, lineWidth: 0.5)
            )
            .modifier(ConditionalCardShadow(useShadow: useShadow, colorScheme: colorScheme))
    }
}

private struct ConditionalCardShadow: ViewModifier {
    let useShadow: Bool
    let colorScheme: ColorScheme
    func body(content: Content) -> some View {
        if useShadow {
            content.appShadowCard(colorScheme: colorScheme)
        } else {
            content
        }
    }
}

// MARK: - Previews

#Preview("Card") {
    AppCard {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("Card title")
                .font(AppTypography.headline)
            Text("Supporting text or content goes here.")
                .font(AppTypography.subheadline)
        }
    }
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
    .appThemeFromColorScheme()
}

#Preview("Card dark") {
    AppCard {
        Text("Dark mode card")
            .font(AppTypography.body)
    }
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
    .appThemeFromColorScheme()
    .preferredColorScheme(.dark)
}
