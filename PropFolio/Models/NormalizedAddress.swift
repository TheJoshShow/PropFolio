//
//  NormalizedAddress.swift
//  PropFolio
//
//  USPS-style address for normalization and API lookups.
//

import Foundation

/// Full normalized address (e.g. after USPS-style normalization).
struct NormalizedAddress: Codable, Sendable {
    let streetAddress: String
    let unit: String?
    let city: String
    let state: String  // 2-letter
    let postalCode: String
    let countryCode: String

    init(streetAddress: String, unit: String? = nil, city: String, state: String, postalCode: String, countryCode: String = "US") {
        self.streetAddress = streetAddress
        self.unit = unit
        self.city = city
        self.state = state
        self.postalCode = postalCode
        self.countryCode = countryCode
    }

    /// Single-line display (e.g. "123 Main St, Austin, TX 78701").
    var singleLine: String {
        var line = streetAddress
        if let unit = unit, !unit.isEmpty { line += ", \(unit)" }
        line += ", \(city), \(state) \(postalCode)"
        if countryCode != "US" { line += " \(countryCode)" }
        return line
    }
}

/// Partial address from URL parsing or user typing (before normalization).
struct PartialAddress: Codable, Sendable {
    var streetAddress: String?
    var unit: String?
    var city: String?
    var state: String?
    var postalCode: String?

    init(streetAddress: String? = nil, unit: String? = nil, city: String? = nil, state: String? = nil, postalCode: String? = nil) {
        self.streetAddress = streetAddress
        self.unit = unit
        self.city = city
        self.state = state
        self.postalCode = postalCode
    }
}
