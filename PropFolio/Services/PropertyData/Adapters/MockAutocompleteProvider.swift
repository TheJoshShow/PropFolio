//
//  MockAutocompleteProvider.swift
//  PropFolio
//
//  Returns static suggestions for address autocomplete when no real provider is configured.
//

import Foundation

/// Mock autocomplete: returns a few suggestions for any query. Use for UI development.
struct MockAutocompleteProvider: AddressAutocompleteProvider {
    func suggest(query: String) async -> Result<[AddressSuggestion], AdapterError> {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard q.count >= 2 else { return .success([]) }
        let suggestions: [AddressSuggestion] = [
            AddressSuggestion(singleLine: "123 Main St, Austin, TX 78701", partialAddress: PartialAddress(streetAddress: "123 Main St", city: "Austin", state: "TX", postalCode: "78701"), source: .manual),
            AddressSuggestion(singleLine: "456 Oak Ave, Austin, TX 78702", partialAddress: PartialAddress(streetAddress: "456 Oak Ave", city: "Austin", state: "TX", postalCode: "78702"), source: .manual),
        ]
        return .success(suggestions.filter { $0.singleLine.lowercased().contains(q) })
    }
}
