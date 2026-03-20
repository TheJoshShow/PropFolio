//
//  AddressInputParser.swift
//  PropFolio
//
//  Parses typed address input. Does not call autocomplete; use AddressAutocompleteProvider for suggestions.
//

import Foundation

/// Parses a single typed address string into partial components. No network.
struct AddressInputParser: Sendable {

    /// Attempt to split "123 Main St, Austin, TX 78701" or "123 Main St Austin TX 78701" into components.
    func parse(_ input: String) -> PartialAddress {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return PartialAddress(streetAddress: nil, city: nil, state: nil, postalCode: nil)
        }

        // Comma-separated: street, city, state zip
        let parts = trimmed.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }

        if parts.count >= 3 {
            let street = parts[0].isEmpty ? nil : String(parts[0])
            let city = parts[1].isEmpty ? nil : String(parts[1])
            let stateZip = parts[2]
            let (state, zip) = parseStateZip(stateZip)
            return PartialAddress(streetAddress: street, city: city, state: state, postalCode: zip)
        }

        if parts.count == 2 {
            let street = parts[0].isEmpty ? nil : String(parts[0])
            let (state, zip) = parseStateZip(parts[1])
            return PartialAddress(streetAddress: street, city: nil, state: state, postalCode: zip)
        }

        // Single part: try "TX 78701" or "78701" at end
        let (state, zip) = parseStateZip(trimmed)
        if state != nil || zip != nil {
            let street = stateZipRemoved(trimmed).trimmingCharacters(in: .whitespaces)
            return PartialAddress(
                streetAddress: street.isEmpty ? nil : street,
                city: nil,
                state: state,
                postalCode: zip
            )
        }

        return PartialAddress(streetAddress: trimmed, city: nil, state: nil, postalCode: nil)
    }

    private func parseStateZip(_ s: String) -> (state: String?, postalCode: String?) {
        let t = s.trimmingCharacters(in: .whitespaces)
        let tokens = t.split(separator: " ").map(String.init)
        var state: String?
        var zip: String?
        for token in tokens {
            if token.count == 2, token.allSatisfy({ $0.isLetter }) {
                state = token.uppercased()
            } else if token.count == 5, token.allSatisfy({ $0.isNumber }) {
                zip = token
            } else if token.count >= 9, token.contains("-"), token.split(separator: "-").allSatisfy({ $0.allSatisfy({ $0.isNumber }) }) {
                zip = token  // 12345-6789
            }
        }
        return (state, zip)
    }

    private func stateZipRemoved(_ s: String) -> String {
        var t = s
        if let range = t.range(of: #"\d{5}(-\d{4})?"#, options: .regularExpression) {
            t.removeSubrange(range)
        }
        if let range = t.range(of: #"\b[A-Za-z]{2}\s*$"#, options: .regularExpression) {
            t.removeSubrange(range)
        }
        return t
    }
}
