//
//  ZillowURLParser.swift
//  PropFolio
//
//  Parses Zillow desktop and mobile URLs. Extracts zpid and optional address from path.
//

import Foundation

struct ZillowURLParser: ListingURLParser {
    private let desktopHosts = ["www.zillow.com", "zillow.com"]
    private let mobileHosts = ["mobile.zillow.com", "zillow.com"]  // mobile may redirect to zillow.com with same path pattern

    func canParse(url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return desktopHosts.contains(host) || host.hasSuffix("zillow.com")
    }

    func parse(url: URL) -> Result<ParsedListingURL, URLParseError> {
        guard canParse(url: url) else { return .failure(.unsupportedDomain) }

        // Normalize: remove fragment and query for path parsing
        var path = url.path
        if path.hasSuffix("/") { path = String(path.dropLast()) }

        // Desktop: /homedetails/123-Main-St-Austin-TX/12345678_zpid/ or /homedetails/12345678_zpid/
        // Mobile:  /homedetails/12345678_zpid/ or similar
        let components = path.split(separator: "/").map(String.init)

        // Find component containing _zpid
        guard let zpidComponent = components.first(where: { $0.contains("_zpid") }) else {
            return .failure(.missingListingID)
        }
        let parts = zpidComponent.split(separator: "_")
        guard let zpidPart = parts.first, !zpidPart.isEmpty, zpidPart.allSatisfy({ $0.isNumber }) else {
            return .failure(.missingListingID)
        }
        let listingID = String(zpidPart)

        let partial = extractAddressFromPath(components)
        return .success(ParsedListingURL(
            source: .zillow,
            listingID: listingID,
            address: partial,
            originalURL: url
        ))
    }

    /// Optional address from path slug (e.g. "123-Main-St-Austin-TX"). Best-effort; listing ID is sufficient for fetch.
    private func extractAddressFromPath(_ pathComponents: [String]) -> PartialAddress? {
        guard let zpidIndex = pathComponents.firstIndex(where: { $0.contains("_zpid") }),
              zpidIndex > 0 else { return nil }
        let addressSlug = pathComponents[zpidIndex - 1]
        let parts = addressSlug.split(separator: "-").map(String.init)
        guard !parts.isEmpty else { return nil }
        var street: String?
        var city: String?
        var state: String?
        var zip: String?
        if let last = parts.last, last.count == 5, last.allSatisfy({ $0.isNumber }) {
            zip = last
            let rest = parts.dropLast()
            if let st = rest.last, st.count == 2, st.allSatisfy({ $0.isLetter }) {
                state = st.uppercased()
                city = rest.dropLast().joined(separator: " ")
                street = rest.dropLast().joined(separator: " ").replacingOccurrences(of: "-", with: " ")
            } else {
                street = rest.joined(separator: " ").replacingOccurrences(of: "-", with: " ")
            }
        } else {
            street = parts.joined(separator: " ").replacingOccurrences(of: "-", with: " ")
        }
        return PartialAddress(streetAddress: street, city: city, state: state, postalCode: zip)
    }
}
