//
//  ImportFlowViewModel.swift
//  PropFolio
//
//  State and actions for the full property import flow: start → paste/link or address → progress → result or error → edit.
//

import Foundation

/// Phase of the import flow.
enum ImportFlowPhase: Equatable {
    case start
    case linkInput
    case addressInput
    case importing(statusMessage: String)
    case result(PropertyImportResult)
    case error(message: String)
    case editing(PropertyImportResult)
}

@MainActor
final class ImportFlowViewModel: ObservableObject {
    @Published private(set) var phase: ImportFlowPhase = .start
    @Published var linkInput: String = ""
    /// When true, show paywall (user at 2-import limit and not entitled).
    @Published var showPaywall: Bool = false
    /// Free-tier state for gating; nil until loaded.
    @Published private(set) var freeTierState: FreeTierState?

    var currentResult: PropertyImportResult? {
        switch phase {
        case .result(let r), .editing(let r): return r
        default: return nil
        }
    }

    /// Shared address autocomplete VM used by the flow (owned by this VM).
    let addressAutocompleteViewModel: AddressAutocompleteViewModel

    private let propertyDataService: PropertyDataService
    private let freeTierService: FreeTierProviding

    init(
        propertyDataService: PropertyDataService,
        addressAutocompleteViewModel: AddressAutocompleteViewModel,
        freeTierService: FreeTierProviding = FreeTierService()
    ) {
        self.propertyDataService = propertyDataService
        self.addressAutocompleteViewModel = addressAutocompleteViewModel
        self.freeTierService = freeTierService
    }

    /// Call when start phase is shown so we have state before user taps Paste link / Type address.
    func loadFreeTierStateIfNeeded() async {
        guard freeTierState == nil else { return }
        freeTierState = await freeTierService.fetchFreeTierState()
    }

    // MARK: - Navigation

    func showStart() {
        phase = .start
        linkInput = ""
        addressAutocompleteViewModel.clearSelection()
        addressAutocompleteViewModel.query = ""
    }

    /// Gate: if at 2-import limit and not entitled, show paywall; else go to link input.
    func choosePasteLink() async {
        await loadFreeTierStateIfNeeded()
        if freeTierState?.canImportMore == false {
            showPaywall = true
            return
        }
        phase = .linkInput
        linkInput = ""
    }

    /// Gate: if at 2-import limit and not entitled, show paywall; else go to address input.
    func chooseTypeAddress() async {
        await loadFreeTierStateIfNeeded()
        if freeTierState?.canImportMore == false {
            showPaywall = true
            return
        }
        phase = .addressInput
        addressAutocompleteViewModel.clearSelection()
        addressAutocompleteViewModel.query = ""
    }

    func goBackFromLinkInput() {
        phase = .start
    }

    func goBackFromAddressInput() {
        phase = .start
    }

    /// Load a demo property (development). Skips network; sets phase to result with DemoData.
    func loadDemoProperty(_ demoId: DemoPropertyId) {
        let result = DemoData.demoImportResult(for: demoId)
        phase = .result(result)
    }

    // MARK: - Import

    func runImportFromLink() async {
        let input = linkInput.trimmingCharacters(in: .whitespaces)
        guard !input.isEmpty else { return }
        phase = .importing(statusMessage: "Looking up property…")
        let result = await propertyDataService.importProperty(from: input)
        switch result {
        case .success(let r):
            phase = .result(r)
            await UsageTrackingService.shared.trackPropertyImport(
                source: r.importSource,
                fromCache: r.fromCache ?? false,
                hasListingId: r.rawRecords.first.map { $0.source != .manual } ?? false
            )
        case .failure(let e):
            phase = .error(message: errorMessage(e))
        }
    }

    func runImportFromAddress() async {
        guard let address = addressAutocompleteViewModel.currentNormalizedAddress else {
            phase = .error(message: "Select or enter an address first.")
            return
        }
        phase = .importing(statusMessage: "Fetching property details…")
        let result = await propertyDataService.importProperty(from: address.singleLine)
        switch result {
        case .success(let r):
            phase = .result(r)
            await UsageTrackingService.shared.trackPropertyImport(
                source: r.importSource ?? "address",
                fromCache: r.fromCache ?? false,
                hasListingId: false
            )
        case .failure(let e):
            phase = .error(message: errorMessage(e))
        }
    }

    func retryAfterError() {
        switch phase {
        case .error:
            if !linkInput.trimmingCharacters(in: .whitespaces).isEmpty {
                phase = .linkInput
            } else if addressAutocompleteViewModel.currentNormalizedAddress != nil {
                phase = .addressInput
            } else {
                phase = .start
            }
        default:
            phase = .start
        }
    }

    func dismissResult() {
        phase = .start
        linkInput = ""
        addressAutocompleteViewModel.clearSelection()
        addressAutocompleteViewModel.query = ""
    }

    func startEditing() {
        guard case .result(let r) = phase else { return }
        phase = .editing(r)
    }

    func saveEdits(updatedProperty: NormalizedProperty) {
        guard case .editing(let r) = phase else { return }
        let newResult = PropertyImportResult(property: updatedProperty, rawRecords: r.rawRecords)
        phase = .result(newResult)
    }

    func cancelEditing() {
        guard case .editing(let r) = phase else { return }
        phase = .result(r)
    }

    private func errorMessage(_ error: PropertyImportError) -> String {
        switch error {
        case .parseFailed(let u):
            switch u {
            case .unsupportedDomain: return "Unsupported link. Use a Zillow or Redfin listing URL."
            case .missingListingID: return "Could not find listing ID in this link."
            case .malformedURL: return "Invalid link. Check the URL and try again."
            case .expiredListing: return "This listing may have expired."
            }
        case .fetchFailed: return "Could not load property. Try again or enter the address instead."
        case .noAdapterAvailable: return "Import is not available right now."
        }
    }
}
