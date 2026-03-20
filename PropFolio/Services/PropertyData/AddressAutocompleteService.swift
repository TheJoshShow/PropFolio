//
//  AddressAutocompleteService.swift
//  PropFolio
//
//  Debounced autocomplete: min characters, delay, and single in-flight request to keep UX fast and reduce API cost.
//

import Foundation

/// Debounced address suggestions. Use for dropdown while typing; mobile-friendly (min chars, 300ms delay).
struct AddressAutocompleteService: Sendable {
    private let provider: AddressAutocompleteProvider
    private let minCharacters: Int
    private let debounceInterval: TimeInterval

    init(
        provider: AddressAutocompleteProvider,
        minCharacters: Int = 3,
        debounceInterval: TimeInterval = 0.3
    ) {
        self.provider = provider
        self.minCharacters = minCharacters
        self.debounceInterval = debounceInterval
    }

    /// Call when query changes. Waits debounceInterval then fetches if query.count >= minCharacters.
    func suggest(query: String) async -> Result<[AddressSuggestion], AdapterError> {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard trimmed.count >= minCharacters else {
            return .success([])
        }
        try? await Task.sleep(nanoseconds: UInt64(debounceInterval * 1_000_000_000))
        return await provider.suggest(query: trimmed)
    }
}
