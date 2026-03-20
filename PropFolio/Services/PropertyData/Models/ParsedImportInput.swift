//
//  ParsedImportInput.swift
//  PropFolio
//
//  Result of parsing user input: URL (listing ID + source) or typed address.
//

import Foundation

/// Result of parsing import input. Either a listing URL (source + ID) or a typed address.
enum ParsedImportInput: Sendable {
    case listing(ParsedListingURL)
    case address(PartialAddress, source: DataSource)
}

/// Parsed listing URL: source, external ID, optional address from path.
struct ParsedListingURL: Sendable {
    let source: DataSource
    let listingID: String
    let address: PartialAddress?
    let originalURL: URL
}

enum URLParseError: Error, Equatable, Sendable {
    case unsupportedDomain
    case missingListingID
    case malformedURL
    case expiredListing
}
