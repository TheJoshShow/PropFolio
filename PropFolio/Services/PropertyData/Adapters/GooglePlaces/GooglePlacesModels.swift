//
//  GooglePlacesModels.swift
//  PropFolio
//
//  Request/response DTOs for Google Places Autocomplete and Address Validation API.
//

import Foundation

// MARK: - Autocomplete

/// Request: Places Autocomplete (New) — input and optional session for billing.
struct GooglePlacesAutocompleteRequest: Encodable {
    let input: String
    let sessionToken: String?
    /// Restrict to address types to reduce cost and irrelevant results.
    let types: String? = "address"
}

/// Response: predictions array.
struct GooglePlacesAutocompleteResponse: Decodable {
    let suggestions: [GooglePlaceSuggestion]?
}

struct GooglePlaceSuggestion: Decodable {
    let placePrediction: GooglePlacePrediction?
}

struct GooglePlacePrediction: Decodable {
    let placeId: String
    let text: GoogleStructuredText
    let structuredFormat: GoogleStructuredFormat?
    enum CodingKeys: String, CodingKey {
        case placeId
        case text
        case structuredFormat
    }
}

struct GoogleStructuredText: Decodable {
    let text: String
}

struct GoogleStructuredFormat: Decodable {
    let mainText: String
    let secondaryText: String?
    enum CodingKeys: String, CodingKey {
        case mainText
        case secondaryText
    }
}

// MARK: - Address Validation (optional follow-up for normalized components)

/// Request: ValidateAddress — address lines.
struct GoogleAddressValidationRequest: Encodable {
    let address: GoogleAddressInput
}

struct GoogleAddressInput: Encodable {
    let addressLines: [String]?
    let locality: String?
    let administrativeArea: String?
    let postalCode: String?
    let regionCode: String?
}

/// Response: validated address with USPS-style components.
struct GoogleAddressValidationResponse: Decodable {
    let result: GoogleValidationResult?
}

struct GoogleValidationResult: Decodable {
    let verdict: GoogleVerdict?
    let address: GoogleValidatedAddress?
}

struct GoogleVerdict: Decodable {
    let addressComplete: Bool?
    let validationGranularity: String?
}

struct GoogleValidatedAddress: Decodable {
    let addressLines: [String]?
    let locality: String?
    let administrativeArea: String?
    let postalCode: String?
    let regionCode: String?
}
