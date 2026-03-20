//
//  ImportInputParser.swift
//  PropFolio
//
//  Orchestrates parsing: URL (Zillow/Redfin) or typed address. Single entry for "parse input".
//

import Foundation

/// Single entry point: parse user input (URL string or typed address) into ParsedImportInput.
struct ImportInputParser: Sendable {
    private let zillow = ZillowURLParser()
    private let redfin = RedfinURLParser()
    private let addressParser = AddressInputParser()

    /// 1. Parse input. 2. Identify source. 3. Extract address/identifiers when possible.
    func parse(_ input: String) -> Result<ParsedImportInput, URLParseError> {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .failure(.malformedURL) }

        // URL: only when input clearly looks like a URL (scheme + host) so malformed or partial input fails fast
        if trimmed.lowercased().hasPrefix("http://") || trimmed.lowercased().hasPrefix("https://") {
            guard let url = URL(string: trimmed),
                  url.scheme?.lowercased() == "http" || url.scheme?.lowercased() == "https",
                  let host = url.host, !host.isEmpty else {
                return .failure(.malformedURL)
            }
            if zillow.canParse(url: url) {
                return zillow.parse(url: url).map { .listing($0) }
            }
            if redfin.canParse(url: url) {
                return redfin.parse(url: url).map { .listing($0) }
            }
            return .failure(.unsupportedDomain)
        }

        // Typed address (no scheme or not a URL)
        let partial = addressParser.parse(trimmed)
        return .success(.address(partial, source: .manual))
    }
}
