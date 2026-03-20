//
//  AddPropertyStartView.swift
//  PropFolio
//
//  Add property start: choose paste link or type address.
//

import SwiftUI

struct AddPropertyStartView: View {
    @Environment(\.appTheme) private var theme
    var onPasteLink: () -> Void
    var onTypeAddress: () -> Void
    /// When set, shows "Load demo property" options (development).
    var onLoadDemo: ((DemoPropertyId) -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xl) {
            Text("How do you want to add a property?")
                .font(AppTypography.title3)
                .foregroundColor(theme.textPrimary)

            VStack(spacing: AppSpacing.m) {
                startOptionButton(
                    icon: "link",
                    title: "Paste Zillow or Redfin link",
                    subtitle: "Paste a listing URL to import details and photos"
                ) {
                    onPasteLink()
                }

                startOptionButton(
                    icon: "mappin.and.ellipse",
                    title: "Type address",
                    subtitle: "Enter an address to look up the property"
                ) {
                    onTypeAddress()
                }
            }

            if let onLoadDemo = onLoadDemo {
                demoSection(onLoadDemo: onLoadDemo)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.m)
    }

    private func demoSection(onLoadDemo: @escaping (DemoPropertyId) -> Void) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            Text("Demo (development)")
                .font(AppTypography.caption)
                .foregroundColor(theme.textSecondary)
            VStack(spacing: AppSpacing.xs) {
                Button { onLoadDemo(.multifamilyStrong) } label: {
                    demoRowLabel("Strong 4-plex", subtitle: "Maple Ridge Dr — high score, high confidence")
                }
                .buttonStyle(.plain)
                Button { onLoadDemo(.valueAddRenovation) } label: {
                    demoRowLabel("Value-add 6-plex", subtitle: "Oak Hollow — renovation plan, mid score")
                }
                .buttonStyle(.plain)
                Button { onLoadDemo(.thinMarginRisky) } label: {
                    demoRowLabel("Risky condo", subtitle: "Anderson Ln — thin margin, low score")
                }
                .buttonStyle(.plain)
            }
            .padding(AppSpacing.s)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .fill(theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.m)
                    .stroke(theme.border.opacity(0.5), lineWidth: 0.5)
            )
        }
    }

    private func demoRowLabel(_ title: String, subtitle: String) -> some View {
        HStack(alignment: .top, spacing: AppSpacing.s) {
            Image(systemName: "doc.badge.plus")
                .font(.system(size: 18))
                .foregroundColor(theme.textTertiary)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textPrimary)
                Text(subtitle)
                    .font(AppTypography.caption2)
                    .foregroundColor(theme.textSecondary)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, AppSpacing.xs)
        .contentShape(Rectangle())
    }

    private func startOptionButton(
        icon: String,
        title: String,
        subtitle: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.m) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundColor(theme.primary)
                    .frame(width: 44, height: 44)
                    .background(
                        RoundedRectangle(cornerRadius: AppRadius.m)
                            .fill(theme.primary.opacity(0.12))
                    )
                VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                    Text(title)
                        .font(AppTypography.headline)
                        .foregroundColor(theme.textPrimary)
                    Text(subtitle)
                        .font(AppTypography.caption)
                        .foregroundColor(theme.textSecondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(theme.textTertiary)
            }
            .padding(AppSpacing.m)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .fill(theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.l)
                    .stroke(theme.border, lineWidth: 0.5)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityHint(subtitle)
    }
}

#Preview("Add property start") {
    AddPropertyStartView(onPasteLink: {}, onTypeAddress: {})
        .padding()
        .appThemeFromColorScheme()
}
