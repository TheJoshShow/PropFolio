//
//  NormalizedProperty.swift
//  PropFolio
//
//  Canonical property record with full provenance per field.
//

import Foundation

/// Canonical property record. Every field is a TrackedValue with source, timestamp, confidence.
struct NormalizedProperty: Identifiable, Codable, Sendable {
    let id: UUID

    let streetAddress: TrackedValue<String>
    let unit: TrackedValue<String>?
    let city: TrackedValue<String>
    let state: TrackedValue<String>
    let postalCode: TrackedValue<String>
    let countryCode: TrackedValue<String>

    let propertyType: TrackedValue<PropertyType>?
    let bedrooms: TrackedValue<Int>?
    let bathrooms: TrackedValue<Decimal>?
    let squareFeet: TrackedValue<Int>?
    let lotSizeSqFt: TrackedValue<Int>?
    let yearBuilt: TrackedValue<Int>?

    let listPrice: TrackedValue<Decimal>?
    let estimatedValue: TrackedValue<Decimal>?
    let lastSoldPrice: TrackedValue<Decimal>?
    let lastSoldDate: TrackedValue<Date>?

    let estimatedRent: TrackedValue<Decimal>?

    let photoURLs: [TrackedValue<URL>]

    let createdAt: Date
    let updatedAt: Date

    /// Aggregate confidence (e.g. mean of field confidences, or minimum of key fields).
    var overallConfidence: ImportConfidence {
        let scores = allMetadata.map(\.confidence.score)
        guard !scores.isEmpty else { return .unknown }
        let mean = scores.reduce(0, +) / Double(scores.count)
        return ImportConfidence(score: mean, factors: [])
    }

    private var allMetadata: [ImportMetadata] {
        [streetAddress.metadata, city.metadata, state.metadata, postalCode.metadata, countryCode.metadata] +
        [unit?.metadata, propertyType?.metadata, bedrooms?.metadata, bathrooms?.metadata, squareFeet?.metadata, lotSizeSqFt?.metadata, yearBuilt?.metadata].compactMap { $0 } +
        [listPrice?.metadata, estimatedValue?.metadata, lastSoldPrice?.metadata, lastSoldDate?.metadata, estimatedRent?.metadata].compactMap { $0 } +
        photoURLs.map(\.metadata)
    }
}
