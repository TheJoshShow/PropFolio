//
//  NormalizedProperty+Edits.swift
//  PropFolio
//
//  Apply user corrections to an imported property; edited fields get .manual / .userInput.
//

import Foundation

extension NormalizedProperty {
    /// User-edited field set; nil means "keep original".
    struct EditableFields {
        var streetAddress: String?
        var unit: String?
        var city: String?
        var state: String?
        var postalCode: String?
        var bedrooms: Int?
        var bathrooms: Decimal?
        var squareFeet: Int?
        var estimatedRent: Decimal?
        var listPrice: Decimal?
    }

    /// Returns a new NormalizedProperty with edited fields replaced; unchanged fields keep original TrackedValue.
    func applying(edits: EditableFields) -> NormalizedProperty {
        let meta = ImportMetadata(source: .manual, fetchedAt: Date(), confidence: .userInput)
        let now = Date()

        let street = edits.streetAddress.map { TrackedValue(value: $0, metadata: meta) } ?? streetAddress
        let unit: TrackedValue<String>? = edits.unit != nil
            ? TrackedValue(value: edits.unit!, metadata: meta)
            : self.unit
        let city = edits.city.map { TrackedValue(value: $0, metadata: meta) } ?? self.city
        let state = edits.state.map { TrackedValue(value: $0, metadata: meta) } ?? self.state
        let postal = edits.postalCode.map { TrackedValue(value: $0, metadata: meta) } ?? postalCode

        let beds: TrackedValue<Int>? = edits.bedrooms.map { TrackedValue(value: $0, metadata: meta) } ?? bedrooms
        let baths: TrackedValue<Decimal>? = edits.bathrooms.map { TrackedValue(value: $0, metadata: meta) } ?? bathrooms
        let sqft: TrackedValue<Int>? = edits.squareFeet.map { TrackedValue(value: $0, metadata: meta) } ?? squareFeet
        let rent: TrackedValue<Decimal>? = edits.estimatedRent.map { TrackedValue(value: $0, metadata: meta) } ?? estimatedRent
        let list: TrackedValue<Decimal>? = edits.listPrice.map { TrackedValue(value: $0, metadata: meta) } ?? listPrice

        return NormalizedProperty(
            id: id,
            streetAddress: street,
            unit: unit,
            city: city,
            state: state,
            postalCode: postal,
            countryCode: countryCode,
            propertyType: propertyType,
            bedrooms: beds,
            bathrooms: baths,
            squareFeet: sqft,
            lotSizeSqFt: lotSizeSqFt,
            yearBuilt: yearBuilt,
            listPrice: list,
            estimatedValue: estimatedValue,
            lastSoldPrice: lastSoldPrice,
            lastSoldDate: lastSoldDate,
            estimatedRent: rent,
            photoURLs: photoURLs,
            createdAt: createdAt,
            updatedAt: now
        )
    }
}
