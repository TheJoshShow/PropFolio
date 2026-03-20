//
//  AddressAutocompleteViewModel.swift
//  PropFolio
//
//  View model for address autocomplete: query, suggestions, loading/no-results/error, selection and hydrated fields.
//

import Foundation

/// UI phase for the autocomplete dropdown.
enum AddressAutocompletePhase: Equatable {
    case idle
    case loading
    case loaded
    case noResults
    case failed(String)
}

@MainActor
final class AddressAutocompleteViewModel: ObservableObject {
    /// Current query (address line 1). Bind to text field.
    @Published var query: String = "" {
        didSet {
            if query != selectedSingleLine { taskToken += 1; startSuggest() }
        }
    }

    /// Optional unit/apartment. User can edit after selecting a suggestion.
    @Published var unit: String = ""

    /// Suggestions for dropdown.
    @Published var suggestions: [AddressSuggestion] = []

    /// Loading, no-results, or API failure message.
    @Published var phase: AddressAutocompletePhase = .idle

    /// Single-line of the selected suggestion (so we don’t re-trigger suggest when we set query from selection).
    private var selectedSingleLine: String?

    /// Hydrated address after user selects a suggestion (street, city, state, zip; unit from field).
    @Published private(set) var hydratedAddress: NormalizedAddress?

    /// Property result after fetching by address (optional; set when user taps “Use this address” and we fetch).
    @Published private(set) var fetchedPropertyResult: PropertyImportResult?

    /// Fetch in progress for “hydrate property” action.
    @Published private(set) var isFetchingProperty: Bool = false

    private let autocompleteService: AddressAutocompleteService
    private let addressNormalizer: AddressNormalizer
    private let propertyDataService: PropertyDataService?
    private var suggestTask: Task<Void, Never>?
    private var taskToken: Int = 0

    init(
        autocompleteService: AddressAutocompleteService,
        addressNormalizer: AddressNormalizer = AddressNormalizer(),
        propertyDataService: PropertyDataService? = nil
    ) {
        self.autocompleteService = autocompleteService
        self.addressNormalizer = addressNormalizer
        self.propertyDataService = propertyDataService
    }

    /// User selected a suggestion: fill address fields and optionally clear dropdown.
    func selectSuggestion(_ suggestion: AddressSuggestion) {
        selectedSingleLine = suggestion.singleLine
        query = suggestion.singleLine
        unit = suggestion.partialAddress.unit ?? ""
        let partial = suggestion.partialAddress
        hydratedAddress = addressNormalizer.normalize(partial)
        suggestions = []
        phase = .idle
    }

    /// Clear selection and hydrated address (e.g. “Change address”).
    func clearSelection() {
        selectedSingleLine = nil
        hydratedAddress = nil
        fetchedPropertyResult = nil
        phase = .idle
        suggestions = []
    }

    /// Current address including user-edited unit. Use for fetch and display.
    var currentNormalizedAddress: NormalizedAddress? {
        guard let base = hydratedAddress else { return nil }
        let unitValue = unit.trimmingCharacters(in: .whitespaces)
        if unitValue.isEmpty {
            return base
        }
        return NormalizedAddress(
            streetAddress: base.streetAddress,
            unit: unitValue,
            city: base.city,
            state: base.state,
            postalCode: base.postalCode,
            countryCode: base.countryCode
        )
    }

    /// Fetch full property for current hydrated address (including unit). Sets fetchedPropertyResult or error in phase.
    func fetchPropertyForCurrentAddress() async {
        guard let address = currentNormalizedAddress else {
            phase = .failed("Select an address first.")
            return
        }
        guard let service = propertyDataService else {
            phase = .failed("Property fetch not available.")
            return
        }
        isFetchingProperty = true
        phase = .loading
        defer { isFetchingProperty = false }

        let result = await service.importProperty(from: address.singleLine)
        switch result {
        case .success(let importResult):
            fetchedPropertyResult = importResult
            phase = .idle
        case .failure(let err):
            phase = .failed(errorMessage(err))
        }
    }

    /// Dismiss dropdown without selecting (e.g. tap outside). Keeps query; clears suggestions and phase.
    func dismissSuggestions() {
        suggestTask?.cancel()
        suggestTask = nil
        suggestions = []
        if case .loading = phase { phase = .idle }
    }

    /// Use current query as manual address (parse and hydrate). Call when user has typed but not selected a suggestion.
    func useTypedAddressAsManual() {
        let parser = AddressInputParser()
        let partial = parser.parse(query)
        let hasStreetOrCity = (partial.streetAddress ?? "").isEmpty == false || (partial.city ?? "").isEmpty == false || (partial.postalCode ?? "").isEmpty == false
        guard hasStreetOrCity else {
            phase = .failed("Enter at least a street, city, or zip.")
            return
        }
        selectedSingleLine = query
        hydratedAddress = addressNormalizer.normalize(partial)
        suggestions = []
        phase = .idle
    }

    private func startSuggest() {
        suggestTask?.cancel()
        let token = taskToken
        suggestTask = Task { [weak self] in
            guard let self = self else { return }
            phase = .loading
            let q = query.trimmingCharacters(in: .whitespaces)
            if q.count < 3 {
                await MainActor.run { if token == self.taskToken { self.suggestions = []; self.phase = .idle } }
                return
            }
            let result = await autocompleteService.suggest(query: q)
            await MainActor.run {
                guard !Task.isCancelled, token == self.taskToken else { return }
                switch result {
                case .success(let list):
                    self.suggestions = list
                    self.phase = list.isEmpty ? .noResults : .loaded
                case .failure(let e):
                    self.suggestions = []
                    self.phase = .failed(self.errorMessage(e))
                }
            }
        }
    }

    private func errorMessage(_ error: AdapterError) -> String {
        switch error {
        case .networkError: return "Connection error. Check network and try again."
        case .notFound: return "Address not found."
        case .rateLimited: return "Too many requests. Please wait a moment."
        case .invalidResponse: return "Invalid response from server."
        case .authenticationFailed: return "Service unavailable."
        case .providerUnavailable: return "Address lookup is temporarily unavailable."
        case .partialData: return "Partial data received."
        }
    }

    private func errorMessage(_ error: PropertyImportError) -> String {
        switch error {
        case .parseFailed: return "Could not parse address."
        case .fetchFailed(let e): return errorMessage(e)
        case .noAdapterAvailable: return "Property lookup is not available."
        }
    }
}
