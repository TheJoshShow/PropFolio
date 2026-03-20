//
//  ListingURLParser.swift
//  PropFolio
//
//  Parse listing URLs to extract source and identifier. No network calls.
//

import Foundation

/// Parses listing URLs (Zillow, Redfin) to extract source and listing ID.
protocol ListingURLParser: Sendable {
    func canParse(url: URL) -> Bool
    func parse(url: URL) -> Result<ParsedListingURL, URLParseError>
}
