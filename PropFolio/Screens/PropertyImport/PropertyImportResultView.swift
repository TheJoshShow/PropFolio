//
//  PropertyImportResultView.swift
//  PropFolio
//
//  Import result: address, key details, photo gallery, Edit and Save. Incomplete-data banner when needed.
//

import SwiftUI

struct PropertyImportResultView: View {
    @Environment(\.appTheme) private var theme
    let result: PropertyImportResult
    var onEdit: () -> Void
    var onSaveToPortfolio: () -> Void
    var onDismiss: () -> Void

    private var property: NormalizedProperty { result.property }
    private var hasIncompleteData: Bool {
        property.overallConfidence.score < 0.6 ||
        property.bedrooms == nil ||
        property.estimatedRent == nil
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.l) {
                if hasIncompleteData {
                    incompleteDataBanner
                }
                addressCard
                detailsCard
                ImportedPhotoGalleryView(
                    photoURLs: property.photoURLs.map(\.value),
                    itemHeight: 200
                )
                actionsSection
            }
            .padding(AppSpacing.m)
        }
        .background(theme.background)
        .navigationTitle("Property imported")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Done") { onDismiss() }
                    .font(AppTypography.body)
                    .foregroundColor(theme.primary)
            }
        }
    }

    private var incompleteDataBanner: some View {
        HStack(alignment: .top, spacing: AppSpacing.s) {
            Image(systemName: "info.circle.fill")
                .font(.system(size: 20))
                .foregroundColor(theme.warning)
            VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                Text("Some details are missing")
                    .font(AppTypography.headline)
                    .foregroundColor(theme.textPrimary)
                Text("Tap “Edit details” to add or correct beds, baths, rent, and other fields.")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
            }
            Spacer(minLength: 0)
        }
        .padding(AppSpacing.m)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.m)
                .fill(theme.warning.opacity(0.12))
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.m)
                .stroke(theme.warning.opacity(0.4), lineWidth: 0.5)
        )
    }

    private var addressCard: some View {
        AppCard(padding: AppSpacing.m) {
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(property.streetAddress.value)
                    .font(AppTypography.headline)
                    .foregroundColor(theme.textPrimary)
                if let unit = property.unit?.value, !unit.isEmpty {
                    Text("Unit \(unit)")
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textSecondary)
                }
                Text("\(property.city.value), \(property.state.value) \(property.postalCode.value)")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)
            }
        }
    }

    private var detailsCard: some View {
        AppCard(padding: AppSpacing.m) {
            VStack(alignment: .leading, spacing: AppSpacing.s) {
                Text("Details")
                    .font(AppTypography.headline)
                    .foregroundColor(theme.textPrimary)
                detailsGrid
            }
        }
    }

    private var detailsGrid: some View {
        let rows: [(String, String)] = [
            ("Beds", property.bedrooms.map { "\($0.value)" } ?? "—"),
            ("Baths", property.bathrooms.map { formatDecimal($0.value) } ?? "—"),
            ("Sq ft", property.squareFeet.map { "\($0.value)" } ?? "—"),
            ("Rent (est.)", property.estimatedRent.map { formatCurrency($0.value) } ?? "—"),
            ("List price", property.listPrice.map { formatCurrency($0.value) } ?? "—"),
            ("Type", property.propertyType?.value.rawValue.replacingOccurrences(of: "_", with: " ").capitalized ?? "—")
        ]
        return VStack(spacing: AppSpacing.xs) {
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                HStack {
                    Text(row.0)
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textSecondary)
                    Spacer()
                    Text(row.1)
                        .font(AppTypography.subheadline)
                        .foregroundColor(theme.textPrimary)
                }
            }
        }
    }

    private var actionsSection: some View {
        VStack(spacing: AppSpacing.m) {
            SecondaryButton(title: "Edit details", action: onEdit)
            PrimaryButton(title: "Save to portfolio", action: onSaveToPortfolio)
        }
    }

    private func formatCurrency(_ value: Decimal) -> String {
        let n = NSDecimalNumber(decimal: value)
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.maximumFractionDigits = 0
        return formatter.string(from: n) ?? "\(value)"
    }

    private func formatDecimal(_ value: Decimal) -> String {
        let n = NSDecimalNumber(decimal: value)
        return n.stringValue
    }
}

#Preview("Result") {
    NavigationStack {
        PropertyImportResultView(
            result: PropertyImportResult(
                property: NormalizedProperty(
                    id: UUID(),
                    streetAddress: TrackedValue(value: "123 Main St", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    unit: nil,
                    city: TrackedValue(value: "Austin", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    state: TrackedValue(value: "TX", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    postalCode: TrackedValue(value: "78701", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    countryCode: TrackedValue(value: "US", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    propertyType: TrackedValue(value: .singleFamily, metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    bedrooms: TrackedValue(value: 3, metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    bathrooms: TrackedValue(value: 2.5, metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    squareFeet: TrackedValue(value: 1800, metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    lotSizeSqFt: nil,
                    yearBuilt: nil,
                    listPrice: TrackedValue(value: 450_000, metadata: ImportMetadata(source: .zillow, confidence: .high)),
                    estimatedValue: nil,
                    lastSoldPrice: nil,
                    lastSoldDate: nil,
                    estimatedRent: TrackedValue(value: 2200, metadata: ImportMetadata(source: .rentcast, confidence: .medium)),
                    photoURLs: [],
                    createdAt: Date(),
                    updatedAt: Date()
                ),
                rawRecords: []
            ),
            onEdit: {},
            onSaveToPortfolio: {},
            onDismiss: {}
        )
    }
    .appThemeFromColorScheme()
}
