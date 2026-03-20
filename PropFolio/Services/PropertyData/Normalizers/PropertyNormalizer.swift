//
//  PropertyNormalizer.swift
//  PropFolio
//
//  Converts RawPropertyData to NormalizedProperty with TrackedValue and confidence per field.
//

import Foundation

/// Converts adapter raw data into canonical NormalizedProperty with full provenance.
struct PropertyNormalizer: Sendable {

    func normalize(_ raw: RawPropertyData) -> NormalizedProperty {
        let at = raw.fetchedAt
        let src = raw.source
        let conf = confidenceForSource(src, fetchedAt: at)

        func tracked<T: Codable>(_ value: T?, _ c: ImportConfidence = conf) -> TrackedValue<T>? {
            guard let value = value else { return nil }
            return TrackedValue(value: value, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: c))
        }

        let addr = normalizeAddress(from: raw)
        let street = TrackedValue(value: addr.streetAddress, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: conf))
        let unit = tracked(raw.unit)
        let city = TrackedValue(value: addr.city, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: conf))
        let state = TrackedValue(value: addr.state, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: conf))
        let postal = TrackedValue(value: addr.postalCode, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: conf))
        let country = TrackedValue(value: addr.countryCode, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: conf))

        let propType = raw.propertyType.flatMap { PropertyType(rawValue: normalizePropertyType($0)) }.map { TrackedValue(value: $0, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: conf)) }
        let beds = tracked(raw.bedrooms)
        let baths = tracked(raw.bathrooms)
        let sqft = tracked(raw.squareFeet)
        let lot = tracked(raw.lotSizeSqFt)
        let year = tracked(raw.yearBuilt)
        let list = tracked(raw.listPrice)
        let estVal = tracked(raw.estimatedValue, .medium)
        let lastSold = tracked(raw.lastSoldPrice)
        let lastSoldDate = tracked(raw.lastSoldDate)
        let rent = tracked(raw.estimatedRent, .medium)
        let photos = raw.photoURLs.map { TrackedValue(value: $0, metadata: ImportMetadata(source: src, fetchedAt: at, confidence: conf)) }

        let now = Date()
        return NormalizedProperty(
            id: UUID(),
            streetAddress: street,
            unit: unit,
            city: city,
            state: state,
            postalCode: postal,
            countryCode: country,
            propertyType: propType,
            bedrooms: beds,
            bathrooms: baths,
            squareFeet: sqft,
            lotSizeSqFt: lot,
            yearBuilt: year,
            listPrice: list,
            estimatedValue: estVal,
            lastSoldPrice: lastSold,
            lastSoldDate: lastSoldDate,
            estimatedRent: rent,
            photoURLs: photos,
            createdAt: now,
            updatedAt: now
        )
    }

    private func normalizeAddress(from raw: RawPropertyData) -> (streetAddress: String, city: String, state: String, postalCode: String, countryCode: String) {
        let street = raw.streetAddress?.trimmingCharacters(in: .whitespaces) ?? "Unknown"
        let city = raw.city?.trimmingCharacters(in: .whitespaces) ?? "Unknown"
        let state = (raw.state ?? "XX").uppercased().prefix(2).description
        let zip = (raw.postalCode ?? "").prefix(10).description
        let country = (raw.countryCode ?? "US").prefix(2).description
        return (street, city, state, zip, country)
    }

    private func confidenceForSource(_ source: DataSource, fetchedAt: Date) -> ImportConfidence {
        let stale = Date().timeIntervalSince(fetchedAt) > 30 * 24 * 3600
        switch source {
        case .zillow, .redfin:
            return stale ? .mediumStale : .high
        case .rentcast:
            return .medium
        case .manual:
            return .userInput
        case .derived:
            return .derived
        case .googlePlaces:
            return stale ? .mediumStale : .high
        case .attom:
            return stale ? .mediumStale : .high
        case .publicMarket:
            return .medium
        case .other:
            return .low
        }
    }

    private func normalizePropertyType(_ raw: String) -> String {
        let lower = raw.lowercased()
        if lower.contains("single") || lower.contains("house") { return PropertyType.singleFamily.rawValue }
        if lower.contains("multi") || lower.contains("duplex") { return PropertyType.multiFamily.rawValue }
        if lower.contains("condo") { return PropertyType.condo.rawValue }
        if lower.contains("town") { return PropertyType.townhouse.rawValue }
        return PropertyType.other.rawValue
    }
}
