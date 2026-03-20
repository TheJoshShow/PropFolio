//
//  AddressNormalizer.swift
//  PropFolio
//
//  Normalize partial address to USPS-style. No network; use for display and cache keys.
//

import Foundation

/// Normalizes address components to a canonical form (USPS-style). No API calls.
struct AddressNormalizer: Sendable {

    /// Build NormalizedAddress from partial. Fills defaults where missing (e.g. country US).
    func normalize(_ partial: PartialAddress) -> NormalizedAddress {
        let street = (partial.streetAddress ?? "").trimmingCharacters(in: .whitespaces)
        let unit = (partial.unit ?? "").trimmingCharacters(in: .whitespaces).isEmpty ? nil : partial.unit?.trimmingCharacters(in: .whitespaces)
        let city = (partial.city ?? "").trimmingCharacters(in: .whitespaces)
        let state = (partial.state ?? "").uppercased().trimmingCharacters(in: .whitespaces)
        let zip = (partial.postalCode ?? "").trimmingCharacters(in: .whitespaces)
        return NormalizedAddress(
            streetAddress: street.isEmpty ? "Unknown" : street,
            unit: unit,
            city: city.isEmpty ? "Unknown" : city,
            state: state.count == 2 ? state : "XX",
            postalCode: zip.prefix(10).description,
            countryCode: "US"
        )
    }

    /// Cache key from normalized address for deduplication and cache lookup.
    func cacheKey(for address: NormalizedAddress) -> String {
        "addr:\(address.streetAddress):\(address.city):\(address.state):\(address.postalCode)"
    }
}
