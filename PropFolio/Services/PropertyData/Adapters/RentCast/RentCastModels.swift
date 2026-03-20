//
//  RentCastModels.swift
//  PropFolio
//
//  Request/response for RentCast rent and property info API.
//

import Foundation

// MARK: - Request

/// Request: by address components. RentCast accepts street, city, state, zip.
struct RentCastRequest: Encodable {
    let address: String
    let city: String
    let state: String
    let zipCode: String
}

// MARK: - Response

struct RentCastResponse: Decodable {
    let rent: Decimal?
    let rentRangeLow: Decimal?
    let rentRangeHigh: Decimal?
    let bedrooms: Int?
    let bathrooms: Decimal?
    let squareFeet: Int?
    let propertyType: String?
}
