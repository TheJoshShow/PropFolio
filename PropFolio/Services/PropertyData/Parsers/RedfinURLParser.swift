//
//  RedfinURLParser.swift
//  PropFolio
//
//  Parses Redfin desktop and mobile URLs. Extracts listing ID (and optional address).
//

import Foundation

struct RedfinURLParser: ListingURLParser {
    private let desktopHosts = ["www.redfin.com", "redfin.com"]
    private let mobileHosts = ["m.redfin.com", "redfin.com"]

    func canParse(url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return desktopHosts.contains(host) || host.hasPrefix("m.") && host.hasSuffix("redfin.com")
    }

    func parse(url: URL) -> Result<ParsedListingURL, URLParseError> {
        guard canParse(url: url) else { return .failure(.unsupportedDomain) }

        // Desktop: /TX/Austin/123-Main-St-78701/unit/1234567890 or /home/1234567890
        // Mobile:  similar path or /listing/1234567890
        // ID is often in path as numeric segment or in query "listingId"
        var listingID: String?

        if let id = url.queryItems?["listingId"] ?? url.queryItems?["listing_id"] {
            listingID = id
        }

        let path = url.path
        let components = path.split(separator: "/").map(String.init)

        if listingID == nil {
            // Last path component is often the listing ID (numeric)
            if let last = components.last, last.allSatisfy({ $0.isNumber }) {
                listingID = last
            }
            // Or second-to-last for .../unit/1234567890
            if listingID == nil, components.count >= 2, components[components.count - 2].lowercased() == "unit",
               components.last?.allSatisfy({ $0.isNumber }) == true {
                listingID = components.last
            }
        }

        guard let id = listingID, !id.isEmpty else { return .failure(.missingListingID) }

        let partial = extractAddressFromPath(components)
        return .success(ParsedListingURL(
            source: .redfin,
            listingID: id,
            address: partial,
            originalURL: url
        ))
    }

    private func extractAddressFromPath(_ pathComponents: [String]) -> PartialAddress? {
        // /STATE/City/Street-Zip/... or /STATE/City/...
        guard pathComponents.count >= 3 else { return nil }
        let state = pathComponents[0].uppercased()
        let city = pathComponents[1].replacingOccurrences(of: "-", with: " ")
        var street: String?
        var postalCode: String?
        if pathComponents.count >= 4 {
            let slug = pathComponents[2]
            let parts = slug.split(separator: "-").map(String.init)
            if let last = parts.last, last.count == 5, last.allSatisfy({ $0.isNumber }) {
                postalCode = last
                street = parts.dropLast().joined(separator: " ").replacingOccurrences(of: "-", with: " ")
            } else {
                street = slug.replacingOccurrences(of: "-", with: " ")
            }
        }
        return PartialAddress(streetAddress: street, city: city, state: state, postalCode: postalCode)
    }
}

private extension URL {
    var queryItems: [String: String]? {
        guard let comp = URLComponents(url: self, resolvingAgainstBaseURL: false), let items = comp.queryItems else { return nil }
        return Dictionary(uniqueKeysWithValues: items.map { ($0.name, $0.value ?? "") })
    }
}
