//
//  EditImportedPropertyView.swift
//  PropFolio
//
//  Edit/correct imported fields. Mobile-friendly keyboard and clear labels.
//

import SwiftUI
import UIKit

struct EditImportedPropertyView: View {
    @Environment(\.appTheme) private var theme
    let property: NormalizedProperty
    var onSave: (NormalizedProperty) -> Void
    var onCancel: () -> Void

    @State private var streetAddress: String = ""
    @State private var unit: String = ""
    @State private var city: String = ""
    @State private var state: String = ""
    @State private var postalCode: String = ""
    @State private var bedroomsText: String = ""
    @State private var bathroomsText: String = ""
    @State private var squareFeetText: String = ""
    @State private var estimatedRentText: String = ""
    @State private var listPriceText: String = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.l) {
                Text("Edit any field that’s wrong or missing. Changes are saved when you tap Save.")
                    .font(AppTypography.subheadline)
                    .foregroundColor(theme.textSecondary)

                addressSection
                detailsSection
                PrimaryButton(title: "Save changes", action: saveTapped)
                Spacer(minLength: AppSpacing.xxl)
            }
            .padding(AppSpacing.m)
            .padding(.bottom, AppSpacing.xxxl)
        }
        .background(theme.background)
        .navigationTitle("Edit details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") { onCancel() }
                    .font(AppTypography.body)
                    .foregroundColor(theme.primary)
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { dismissKeyboard() }
                    .font(AppTypography.headline)
                    .foregroundColor(theme.primary)
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .onAppear(perform: bindFromProperty)
    }

    private var addressSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            Text("Address")
                .font(AppTypography.headline)
                .foregroundColor(theme.textPrimary)
            AppTextField(label: "Street address", text: $streetAddress, placeholder: "123 Main St")
            AppTextField(label: "Unit (optional)", text: $unit, placeholder: "Apt 4")
            HStack(spacing: AppSpacing.m) {
                AppTextField(label: "City", text: $city, placeholder: "Austin")
                AppTextField(label: "State", text: $state, placeholder: "TX")
            }
            AppTextField(label: "ZIP code", text: $postalCode, placeholder: "78701", keyboardType: .numberPad)
        }
    }

    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s) {
            Text("Details")
                .font(AppTypography.headline)
                .foregroundColor(theme.textPrimary)
            AppTextField(label: "Bedrooms", text: $bedroomsText, placeholder: "3", keyboardType: .numberPad)
            AppTextField(label: "Bathrooms", text: $bathroomsText, placeholder: "2.5", keyboardType: .decimalPad)
            AppTextField(label: "Square feet", text: $squareFeetText, placeholder: "1800", keyboardType: .numberPad)
            AppTextField(label: "Estimated rent ($/month)", text: $estimatedRentText, placeholder: "2200", keyboardType: .decimalPad)
            AppTextField(label: "List price ($)", text: $listPriceText, placeholder: "450000", keyboardType: .decimalPad)
        }
    }

    private func bindFromProperty() {
        streetAddress = property.streetAddress.value
        unit = property.unit?.value ?? ""
        city = property.city.value
        state = property.state.value
        postalCode = property.postalCode.value
        bedroomsText = property.bedrooms.map { "\($0.value)" } ?? ""
        bathroomsText = property.bathrooms.map { nsDecimalToString($0.value) } ?? ""
        squareFeetText = property.squareFeet.map { "\($0.value)" } ?? ""
        estimatedRentText = property.estimatedRent.map { nsDecimalToString($0.value) } ?? ""
        listPriceText = property.listPrice.map { nsDecimalToString($0.value) } ?? ""
    }

    private func saveTapped() {
        let edits = NormalizedProperty.EditableFields(
            streetAddress: streetAddress.isEmpty ? nil : streetAddress,
            unit: unit.isEmpty ? nil : unit,
            city: city.isEmpty ? nil : city,
            state: state.isEmpty ? nil : state.uppercased().prefix(2).description,
            postalCode: postalCode.isEmpty ? nil : postalCode,
            bedrooms: Int(bedroomsText),
            bathrooms: decimalFromString(bathroomsText),
            squareFeet: Int(squareFeetText),
            estimatedRent: decimalFromString(estimatedRentText),
            listPrice: decimalFromString(listPriceText)
        )
        let updated = property.applying(edits: edits)
        onSave(updated)
    }

    private func nsDecimalToString(_ d: Decimal) -> String {
        NSDecimalNumber(decimal: d).stringValue
    }

    private func decimalFromString(_ s: String) -> Decimal? {
        let t = s.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty, let n = Decimal(string: t) else { return nil }
        return n
    }

    private func dismissKeyboard() {
        #if canImport(UIKit)
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        #endif
    }
}

#Preview("Edit") {
    NavigationStack {
        EditImportedPropertyView(
            property: NormalizedProperty(
                id: UUID(),
                streetAddress: TrackedValue(value: "123 Main St", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                unit: nil,
                city: TrackedValue(value: "Austin", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                state: TrackedValue(value: "TX", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                postalCode: TrackedValue(value: "78701", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                countryCode: TrackedValue(value: "US", metadata: ImportMetadata(source: .zillow, confidence: .high)),
                propertyType: nil,
                bedrooms: nil,
                bathrooms: nil,
                squareFeet: nil,
                lotSizeSqFt: nil,
                yearBuilt: nil,
                listPrice: nil,
                estimatedValue: nil,
                lastSoldPrice: nil,
                lastSoldDate: nil,
                estimatedRent: nil,
                photoURLs: [],
                createdAt: Date(),
                updatedAt: Date()
            ),
            onSave: { _ in },
            onCancel: {}
        )
    }
    .appThemeFromColorScheme()
}
