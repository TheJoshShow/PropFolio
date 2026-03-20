//
//  AddressAutocompleteProvider.swift
//  PropFolio
//
//  Address suggestion for typed input. Used for dropdown; no property detail fetch.
//

import Foundation

/// Suggestion for autocomplete dropdown. Does not include full property data.
struct AddressSuggestion: Sendable {
    let singleLine: String
    let partialAddress: PartialAddress
    let source: DataSource
}

/// Provides address suggestions for partial typed input. Optimize for token/API cost (debounce, min chars).
protocol AddressAutocompleteProvider: Sendable {
    /// Suggest addresses for dropdown. Call after debounce; require minimum characters.
    func suggest(query: String) async -> Result<[AddressSuggestion], AdapterError>
}
