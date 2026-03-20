//
//  ImportParserTests.swift
//  PropFolioTests
//
//  Import parser tests: Zillow/Redfin desktop and mobile links, ImportInputParser.
//

import XCTest
@testable import PropFolio

final class ZillowURLParserTests: XCTestCase {

    private let parser = ZillowURLParser()

    // MARK: - Desktop

    func testDesktop_homedetails_withAddressSlug_extractsZpid() {
        let url = URL(string: "https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345678_zpid/")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.source, .zillow)
        XCTAssertEqual(parsed.listingID, "12345678")
        XCTAssertEqual(parsed.originalURL, url)
    }

    func testDesktop_zpidOnly_extractsZpid() {
        let url = URL(string: "https://zillow.com/homedetails/12345678_zpid/")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.listingID, "12345678")
    }

    func testDesktop_trailingSlash_normalized() {
        let url = URL(string: "https://www.zillow.com/homedetails/98765432_zpid")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.listingID, "98765432")
    }

    // MARK: - Mobile (same path pattern on zillow.com)

    func testMobile_hostZillow_samePath_extractsZpid() {
        let url = URL(string: "https://mobile.zillow.com/homedetails/55555555_zpid/")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.listingID, "55555555")
    }

    // MARK: - Reject

    func testReject_unsupportedDomain() {
        let url = URL(string: "https://other.com/homedetails/12345678_zpid/")!
        guard case .failure(let error) = parser.parse(url: url) else {
            XCTFail("Expected failure")
            return
        }
        XCTAssertEqual(error, .unsupportedDomain)
    }

    func testReject_noZpidInPath_returnsMissingListingID() {
        let url = URL(string: "https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/")!
        guard case .failure(let error) = parser.parse(url: url) else {
            XCTFail("Expected failure")
            return
        }
        XCTAssertEqual(error, .missingListingID)
    }

    func testCanParse_zillowHosts() {
        XCTAssertTrue(parser.canParse(url: URL(string: "https://www.zillow.com/homedetails/1_zpid/")!))
        XCTAssertTrue(parser.canParse(url: URL(string: "https://zillow.com/homedetails/1_zpid/")!))
        XCTAssertTrue(parser.canParse(url: URL(string: "https://mobile.zillow.com/homedetails/1_zpid/")!))
        XCTAssertFalse(parser.canParse(url: URL(string: "https://redfin.com/home/123")!))
    }
}

final class RedfinURLParserTests: XCTestCase {

    private let parser = RedfinURLParser()

    // MARK: - Desktop

    func testDesktop_pathWithUnit_extractsListingId() {
        let url = URL(string: "https://www.redfin.com/TX/Austin/123-Main-St-78701/unit/1234567890")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.source, .redfin)
        XCTAssertEqual(parsed.listingID, "1234567890")
    }

    func testDesktop_homePath_numericId() {
        let url = URL(string: "https://redfin.com/home/9876543210")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.listingID, "9876543210")
    }

    func testDesktop_queryListingId() {
        let url = URL(string: "https://www.redfin.com/something?listingId=999")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.listingID, "999")
    }

    func testDesktop_queryListing_idUnderscore() {
        let url = URL(string: "https://www.redfin.com/any?listing_id=42")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.listingID, "42")
    }

    // MARK: - Mobile

    func testMobile_mRedfin_samePath() {
        let url = URL(string: "https://m.redfin.com/TX/Austin/123-Main-St-78701/unit/1111111111")!
        guard case .success(let parsed) = parser.parse(url: url) else {
            XCTFail("Expected success")
            return
        }
        XCTAssertEqual(parsed.listingID, "1111111111")
    }

    // MARK: - Reject

    func testReject_unsupportedDomain() {
        let url = URL(string: "https://zillow.com/home/1234567890")!
        guard case .failure(let error) = parser.parse(url: url) else {
            XCTFail("Expected failure")
            return
        }
        XCTAssertEqual(error, .unsupportedDomain)
    }

    func testReject_noIdInPathOrQuery_returnsMissingListingID() {
        let url = URL(string: "https://www.redfin.com/TX/Austin/")!
        guard case .failure(let error) = parser.parse(url: url) else {
            XCTFail("Expected failure")
            return
        }
        XCTAssertEqual(error, .missingListingID)
    }

    func testCanParse_redfinHosts() {
        XCTAssertTrue(parser.canParse(url: URL(string: "https://www.redfin.com/home/1")!))
        XCTAssertTrue(parser.canParse(url: URL(string: "https://redfin.com/home/1")!))
        XCTAssertTrue(parser.canParse(url: URL(string: "https://m.redfin.com/home/1")!))
        XCTAssertFalse(parser.canParse(url: URL(string: "https://zillow.com/homedetails/1_zpid/")!))
    }
}

final class ImportInputParserTests: XCTestCase {

    private let parser = ImportInputParser()

    func testEmpty_returnsMalformedURL() {
        guard case .failure(let e) = parser.parse("") else { XCTFail(); return }
        XCTAssertEqual(e, .malformedURL)
    }

    func testWhitespaceOnly_returnsMalformedURL() {
        guard case .failure(let e) = parser.parse("   \n  ") else { XCTFail(); return }
        XCTAssertEqual(e, .malformedURL)
    }

    func testZillowURL_returnsListing() {
        let input = "https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345678_zpid/"
        guard case .success(let parsed) = parser.parse(input) else { XCTFail(); return }
        if case .listing(let url) = parsed {
            XCTAssertEqual(url.source, .zillow)
            XCTAssertEqual(url.listingID, "12345678")
        } else {
            XCTFail("Expected .listing")
        }
    }

    func testRedfinURL_returnsListing() {
        let input = "https://www.redfin.com/home/9876543210"
        guard case .success(let parsed) = parser.parse(input) else { XCTFail(); return }
        if case .listing(let url) = parsed {
            XCTAssertEqual(url.source, .redfin)
            XCTAssertEqual(url.listingID, "9876543210")
        } else {
            XCTFail("Expected .listing")
        }
    }

    func testUnsupportedDomain_returnsUnsupportedDomain() {
        guard case .failure(let e) = parser.parse("https://other.com/page/123") else { XCTFail(); return }
        XCTAssertEqual(e, .unsupportedDomain)
    }

    func testTypedAddress_returnsAddress() {
        let input = "123 Main St, Austin, TX 78701"
        guard case .success(let parsed) = parser.parse(input) else { XCTFail(); return }
        if case .address(let partial, let source) = parsed {
            XCTAssertEqual(source, .manual)
            XCTAssertEqual(partial.streetAddress, "123 Main St")
            XCTAssertEqual(partial.city, "Austin")
            XCTAssertEqual(partial.state, "TX")
            XCTAssertEqual(partial.postalCode, "78701")
        } else {
            XCTFail("Expected .address")
        }
    }

    func testTypedAddress_noScheme_treatedAsAddress() {
        let input = "Austin, TX"
        guard case .success(let parsed) = parser.parse(input) else { XCTFail(); return }
        if case .address(let partial, let source) = parsed {
            XCTAssertEqual(source, .manual)
            XCTAssertEqual(partial.state, "TX")
        } else {
            XCTFail("Expected .address")
        }
    }
}
